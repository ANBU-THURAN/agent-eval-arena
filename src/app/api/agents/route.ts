import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {BasePromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate} from "@langchain/core/prompts";
import {callAgent} from "@/model/agent-executor";
import {getCurrentStateOfAgentsTool} from "@/tools/agentTools";

export async function GET() {
    try {
        const systemPrompt = ChatPromptTemplate.fromTemplate(
            "You are an intelligent agent. You have access to the following tools: {tools} {tool_names}.\nUse them wisely.\n\n{agent_scratchpad}"
        );
        const output = await callAgent(systemPrompt, [getCurrentStateOfAgentsTool]);
        console.log(output);

        return NextResponse.json("nothing");
    } catch (error: any) {
        console.error("Error fetching Gemini response:", error);
        return NextResponse.json({ error: "Failed to get response from Gemini" }, { status: 500 });
    }
}
