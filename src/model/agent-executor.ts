import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import {DynamicStructuredTool} from "langchain/tools";

export const callAgent = async (tools: (DynamicTool | DynamicStructuredTool)[], userInput: string, systemPrompt: string) => {
    const llm = new ChatGoogleGenerativeAI({
        apiKey: "AIzaSyA35Zyxw4wXnVJNZqwpYxTKaNF0Nk4vhmA", // Use env variable
        model: "gemini-2.5-flash",
        temperature: 0,
    });

    const modelWithTools = llm.bindTools(tools);

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `{system_prompt}
            Available tools: {tool_names}, {tool_descriptions}, {tool_schemas}`,
        ],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
    ]);

    const agent = createToolCallingAgent({
        llm: modelWithTools,
        tools,
        prompt,
    });

    const executor = new AgentExecutor({
        agent,
        tools,
        maxIterations: 10,
        verbose: true,
        returnIntermediateSteps: true,
    });

    const result = await executor.invoke({
        input: userInput,
        system_prompt: systemPrompt,
        tool_names: tools.map((t) => t.name).join(", "),
        tool_descriptions: tools.map((t) => t.description).join(", "),
        tool_schemas: tools.map((t) => t.schema).join(", "),
    });

    return result;
};
