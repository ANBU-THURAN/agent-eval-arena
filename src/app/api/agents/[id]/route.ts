import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/actions/agent";

export async function GET(
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id); // get path param
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
        }

        const agent = await getAgent(id);

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error("Error fetching agent:", error);
        return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
    }
}
