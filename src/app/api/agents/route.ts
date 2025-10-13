import { NextResponse } from "next/server";
import { callAgent } from "@/model/agent-executor";
import { getProductTool } from "@/tools/agentTools";

// Example: GET /api/agents
export async function GET() {
    try {
        const userQuery = "What are the details for product 1?";
        const result = await callAgent([getProductTool], userQuery);

        console.log("Agent Output:", result.output);
        console.log("Steps:", result.intermediateSteps);

        return Response.json({
            result: result.output,
            steps: result.intermediateSteps
        });
    } catch (error: any) {
        console.error("Error:", error);
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
