import { NextResponse } from "next/server";
import { getAgents } from "@/actions/agent";

export async function GET() {
    try {
        const agents = await getAgents();
        return NextResponse.json(agents);
    } catch (error) {
        console.error("Error fetching agents:", error);
        return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }
}
