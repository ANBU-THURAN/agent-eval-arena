import { NextResponse } from "next/server";
import { createProduct } from "@/actions/products";
import {Product} from "@/types/product-types";

export async function GET() {
    try {
        // three sample products
        const products: Product[] = [
            {
                name: "Wheat",
                rate: 25,
                unit: "kg" as const,
            },
            {
                name: "Olive Oil",
                rate: 120,
                unit: "litres" as const,
            },
            {
                name: "Sugar",
                rate: 40,
                unit: "kg" as const,
            },
        ];

        // insert into DB
        for (const product of products) {
            await createProduct(product);
        }

        return NextResponse.json({
            message: "3 sample products created successfully",
            products,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create sample products" },
            { status: 500 }
        );
    }
}
