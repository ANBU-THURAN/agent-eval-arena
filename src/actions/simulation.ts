import fs from "fs";
import path from "path";
import {getAgents, getCurrentState} from "@/actions/agent";
import { callAgent } from "@/model/agent-executor";
import { agentPromptTemplate } from "@/model/agent-prompt";
import { DynamicTool } from "@langchain/core/tools";

// Import all tools you want agents to use
import {
    getCurrentStateTool,
    getCurrentStateOfAgentsTool,
    getProductTool,
    getSentProposalsTool,
    getReceivedProposalsTool,
    getTransactionsOfProductTool,
    getMyTransactionsTool,
    sendProposalToAgentTool,
    respondToProposalTool,
} from "@/tools/agentTools";
import {DynamicStructuredTool} from "langchain/tools";

const tools : (DynamicTool | DynamicStructuredTool)[] = [
    getCurrentStateTool,
    getCurrentStateOfAgentsTool,
    getProductTool,
    getSentProposalsTool,
    getReceivedProposalsTool,
    getTransactionsOfProductTool,
    getMyTransactionsTool,
    sendProposalToAgentTool,
    respondToProposalTool,
];

export const simulate = async () => {
    const maxTurns = 5;
    const toolCallLog: any[] = [];

    // 1. Load all agents
    const agents = await getAgents();

    // 2. Run simulation turns
    for (let turn = 1; turn <= maxTurns; turn++) {
        console.log(`=== TURN ${turn} ===`);

        for (const agent of agents) {
            // Prepare dynamic system prompt
            const systemPrompt = agentPromptTemplate
                .replace("{{agentId}}", agent.id.toString())
                .replace("{{wealth}}", agent.wealth.toString())
                .replace("{{turnNumber}}", turn.toString())
                .replace("{{state}}", JSON.stringify(await getCurrentState(agent.id) || []));

            // Simple user input
            const userInput = "Follow the instructions to achieve your goal";

            // Call agent
            const result = await callAgent(tools, userInput, systemPrompt);

            // Log tool calls with metadata
            if (result?.toolCalls && Array.isArray(result.toolCalls)) {
                result.toolCalls.forEach((call: any) => {
                    toolCallLog.push({
                        ...call,
                        agentId: agent.id,
                        agentName: agent.name,
                        turnNumber: turn,
                    });
                });
            }
        }
    }

    // 3. Save tool call log to file
    const filePath = path.resolve(process.cwd(), "agent_tool_calls.json");
    fs.writeFileSync(filePath, JSON.stringify(toolCallLog, null, 2), "utf-8");
    console.log(`Tool call log saved to ${filePath}`);

    // 4. Return log as simulation result
    return toolCallLog;
};
