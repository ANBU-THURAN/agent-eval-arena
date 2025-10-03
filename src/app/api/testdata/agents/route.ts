import { NextResponse } from "next/server";
import { createAgent } from "@/actions/agent";
import {Agent} from "@/types/agent-types"; // adjust if your helper file has a different name

export async function GET() {
    try {
        const agents: Agent[] = [
            {
                name: "NegotiatorBot",
            },
            {
                name: "MarketAnalyst",
            },
            {
                name: "SupplierAgent"
            },
        ];

        for (const agent of agents) {
            await createAgent(agent);
        }

        return NextResponse.json({
            message: "3 sample agents created successfully",
            agents,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create sample agents" },
            { status: 500 }
        );
    }
}
