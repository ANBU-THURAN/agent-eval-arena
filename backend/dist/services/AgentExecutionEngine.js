import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { SYSTEM_PROMPT, buildAgentPromptContext } from '../config/prompts.js';
import { DEFAULT_RATE_LIMIT_MS, MAX_AGENT_ITERATIONS, MS_PER_SECOND } from '../constants/index.js';
/**
 * AgentExecutionEngine integrates with Google Gemini API
 * to execute agents with function calling capabilities.
 *
 * Agents can call tools directly to perform trades, which update
 * the database in real-time, making them truly stateful.
 */
export class AgentExecutionEngine {
    genAI = null;
    lastApiCallTime = 0;
    minApiCallDelay;
    constructor(minDelayMs = DEFAULT_RATE_LIMIT_MS) {
        if (process.env.GOOGLE_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        }
        this.minApiCallDelay = minDelayMs;
    }
    /**
     * Ensures minimum delay between API calls to respect rate limits
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastApiCallTime;
        if (timeSinceLastCall < this.minApiCallDelay) {
            const waitTime = this.minApiCallDelay - timeSinceLastCall;
            console.log(`⏱️  Rate limiting: waiting ${Math.round(waitTime / MS_PER_SECOND)}s before next API call`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastApiCallTime = Date.now();
    }
    /**
     * Define tools (functions) that agents can call
     */
    getFunctionDeclarations() {
        return [
            {
                name: 'makeProposal',
                description: 'Propose a trade to another agent. Use this to offer to buy or sell goods. The proposal will be sent to the target agent who can accept, reject, or counter it.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        toAgentId: {
                            type: SchemaType.STRING,
                            description: 'The ID of the agent to send the proposal to (e.g., "agent-gemini-flash-1")',
                        },
                        goodName: {
                            type: SchemaType.STRING,
                            description: 'The name of the good to trade (e.g., "Rice", "Oil", "Wheat", "Sugar")',
                        },
                        quantity: {
                            type: SchemaType.NUMBER,
                            description: 'The quantity of goods to trade (must be positive)',
                        },
                        price: {
                            type: SchemaType.NUMBER,
                            description: 'The total price for this trade in rupees (must be positive)',
                        },
                        explanation: {
                            type: SchemaType.STRING,
                            description: 'Your explanation for why this is a good trade (visible to the other agent)',
                        },
                    },
                    required: ['toAgentId', 'goodName', 'quantity', 'price', 'explanation'],
                },
            },
            {
                name: 'acceptProposal',
                description: 'Accept a pending proposal from another agent. This will immediately execute the trade and update both agents\' inventories and cash.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        proposalId: {
                            type: SchemaType.STRING,
                            description: 'The ID of the proposal to accept',
                        },
                        explanation: {
                            type: SchemaType.STRING,
                            description: 'Your reason for accepting this proposal',
                        },
                    },
                    required: ['proposalId', 'explanation'],
                },
            },
            {
                name: 'rejectProposal',
                description: 'Reject a pending proposal from another agent. Use this if the price is too high, quantity is wrong, or you don\'t want the trade.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        proposalId: {
                            type: SchemaType.STRING,
                            description: 'The ID of the proposal to reject',
                        },
                        explanation: {
                            type: SchemaType.STRING,
                            description: 'Your reason for rejecting (visible to the other agent)',
                        },
                    },
                    required: ['proposalId', 'explanation'],
                },
            },
            {
                name: 'counterProposal',
                description: 'Make a counter-offer to a pending proposal with different quantity or price. This rejects the original and creates a new proposal back to the sender.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        proposalId: {
                            type: SchemaType.STRING,
                            description: 'The ID of the proposal to counter',
                        },
                        quantity: {
                            type: SchemaType.NUMBER,
                            description: 'The new quantity you propose (must be positive)',
                        },
                        price: {
                            type: SchemaType.NUMBER,
                            description: 'The new price you propose in rupees (must be positive)',
                        },
                        explanation: {
                            type: SchemaType.STRING,
                            description: 'Your explanation for the counter-offer',
                        },
                    },
                    required: ['proposalId', 'quantity', 'price', 'explanation'],
                },
            },
            {
                name: 'getAgentStates',
                description: 'Get current states of all agents in the market, including their inventory and cash balances. Use this to make informed trading decisions by understanding what goods other agents have and what they might need.',
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                    required: [],
                },
            },
        ];
    }
    /**
     * Execute an agent for one round with Gemini function calling
     */
    async executeAgent(agentId, modelName, provider, context, tools) {
        if (!this.genAI) {
            console.error('Gemini API not initialized. Check GOOGLE_API_KEY.');
            return;
        }
        try {
            // Initialize model with function calling
            const model = this.genAI.getGenerativeModel({
                model: modelName,
                tools: [{ functionDeclarations: this.getFunctionDeclarations() }],
            });
            // Build prompt with current state
            const promptContext = await buildAgentPromptContext(agentId, context);
            const fullPrompt = `${SYSTEM_PROMPT}\n\n${promptContext}`;
            // Start chat session
            const chat = model.startChat({
                history: [],
            });
            console.log(`\n🤖 Agent ${agentId} thinking...`);
            // Enforce rate limit before API call
            await this.enforceRateLimit();
            // Send message and get response
            let result = await chat.sendMessage(fullPrompt);
            let response = result.response;
            // Handle function calls in a loop (agent may make multiple tool calls)
            let iteration = 0;
            while (iteration < MAX_AGENT_ITERATIONS) {
                const functionCall = response.functionCalls()?.[0];
                if (!functionCall) {
                    // No more function calls, agent is done
                    const textResponse = response.text();
                    if (textResponse && textResponse.trim()) {
                        console.log(`💭 Agent ${agentId}: ${textResponse}`);
                    }
                    break;
                }
                // Execute the requested function
                console.log(`🔧 Agent ${agentId} calling: ${functionCall.name}`);
                const toolResult = await this.executeTool(tools, functionCall.name, functionCall.args);
                console.log(`📊 Result: ${toolResult.message}`);
                // Enforce rate limit before API call
                await this.enforceRateLimit();
                // Send function result back to agent
                result = await chat.sendMessage([
                    {
                        functionResponse: {
                            name: functionCall.name,
                            response: toolResult,
                        },
                    },
                ]);
                response = result.response;
                iteration++;
            }
            if (iteration >= MAX_AGENT_ITERATIONS) {
                console.warn(`⚠️ Agent ${agentId} reached maximum iterations`);
            }
            console.log(`✓ Agent ${agentId} finished`);
        }
        catch (error) {
            console.error(`Error executing agent ${agentId}:`, error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
            }
        }
    }
    /**
     * Execute a tool function called by the agent
     */
    async executeTool(tools, functionName, args) {
        try {
            switch (functionName) {
                case 'makeProposal':
                    const makeArgs = args;
                    return await tools.makeProposal(makeArgs.toAgentId, makeArgs.goodName, makeArgs.quantity, makeArgs.price, makeArgs.explanation);
                case 'acceptProposal':
                    const acceptArgs = args;
                    return await tools.acceptProposal(acceptArgs.proposalId, acceptArgs.explanation);
                case 'rejectProposal':
                    const rejectArgs = args;
                    return await tools.rejectProposal(rejectArgs.proposalId, rejectArgs.explanation);
                case 'counterProposal':
                    const counterArgs = args;
                    return await tools.counterProposal(counterArgs.proposalId, counterArgs.quantity, counterArgs.price, counterArgs.explanation);
                case 'getAgentStates':
                    return await tools.getAgentStates();
                default:
                    return {
                        success: false,
                        message: `Unknown function: ${functionName}`,
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
}
//# sourceMappingURL=AgentExecutionEngine.js.map