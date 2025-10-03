import {ChatGoogleGenerativeAI} from "@langchain/google-genai";

import {DynamicTool} from "langchain/tools";
import {AgentExecutor, createReactAgent} from "langchain/agents";
import {BasePromptTemplate, ChatPromptTemplate} from "@langchain/core/prompts";


export const callAgent = async (systemPrompt: BasePromptTemplate, tools: DynamicTool[]) => {

    const llm = new ChatGoogleGenerativeAI({
        apiKey: "<API_KEY>",
        model: "gemini-2.5-flash",
        temperature: 0,
        streaming: false,
        maxRetries: 2,
    });

    // Create the agent using LangGraph
    const agent = await createReactAgent({
        llm,
        tools,
        prompt: systemPrompt,
    });

    const agentExecutor = new AgentExecutor({
        agent,
        tools
    });

    console.log("About to invoke");
    return await agentExecutor.invoke({
        input: "hello world",
    });
};