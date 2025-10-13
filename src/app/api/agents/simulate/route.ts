import { NextResponse } from "next/server";
import { createProduct } from "@/actions/products";
import { createAgent } from "@/actions/agent";
import { simulate } from "@/actions/simulation";
import {Product} from "@/types/product-types";

export async function GET() {
    try {
        // 1. Create 20 products with valid units
        const products: Product[] = [
            { name: "Steel Rods", rate: 120, unit: "kg" },
            { name: "Cement Bags", rate: 400, unit: "kg" },
            { name: "Copper Wire", rate: 950, unit: "kg" },
            { name: "Wood Planks", rate: 700, unit: "lbs" },
            { name: "Glass Sheets", rate: 500, unit: "lbs" },
            { name: "Bricks", rate: 8, unit: "kg" },
            { name: "Paint Buckets", rate: 350, unit: "litres" },
            { name: "Pipes", rate: 200, unit: "kg" },
            { name: "Tiles", rate: 45, unit: "kg" },
            { name: "Gravel", rate: 50, unit: "kg" },
            { name: "Sand", rate: 35, unit: "kg" },
            { name: "Iron Bars", rate: 100, unit: "kg" },
            { name: "Plastic Sheets", rate: 150, unit: "lbs" },
            { name: "Nails", rate: 250, unit: "kg" },
            { name: "Adhesive", rate: 500, unit: "litres" },
            { name: "Marble", rate: 1500, unit: "kg" },
            { name: "PVC Fittings", rate: 75, unit: "lbs" },
            { name: "Insulation Foam", rate: 1200, unit: "kg" },
            { name: "Wires", rate: 300, unit: "kg" },
            { name: "Roof Panels", rate: 900, unit: "lbs" },
        ];

        for (const product of products) {
            await createProduct(product);
        }

        // 2. Create 3 agents with equal wealth
        const initialWealth = 10000;
        const agentNames = ["Agent Alpha", "Agent Beta", "Agent Gamma"];

        for (const name of agentNames) {
            await createAgent({
                name,
                wealth: initialWealth,
            });
        }

        // 3. Call the simulation function
        const simulationResult = await simulate();

        return NextResponse.json({
            success: true,
            message: "Simulation initialized successfully.",
            simulationResult,
        });
    } catch (err: any) {
        console.error("Simulation setup failed:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
