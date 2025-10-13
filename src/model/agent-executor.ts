import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";

export const callAgent = async (tools: DynamicTool[], userInput: string) => {
    const llm = new ChatGoogleGenerativeAI({
        apiKey: "AIzaSyA35Zyxw4wXnVJNZqwpYxTKaNF0Nk4vhmA", // Use env variable
        model: "gemini-2.5-flash",
        temperature: 0.2,
    });

    const modelWithTools = llm.bindTools(tools);

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `You are a helpful assistant. Use tools when needed to answer questions.

After calling a tool and receiving results, provide a clear final answer.
Do not call the same tool repeatedly.

Available tools: {tool_names}`,
        ],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
    ]);

    const agent = await createToolCallingAgent({
        llm: modelWithTools,
        tools,
        prompt,
    });

    const executor = new AgentExecutor({
        agent,
        tools,
        maxIterations: 5,
        verbose: true,
        returnIntermediateSteps: true,
    });

    const result = await executor.invoke({
        input: userInput,
        tool_names: tools.map((t) => t.name).join(", "),
    });

    return result;
};
