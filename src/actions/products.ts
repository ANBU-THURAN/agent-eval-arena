import { eq } from "drizzle-orm";
import { db } from "@/db";
import { product as products } from "@/db/schema"; // make sure your schema has `product`
import { Product } from "@/types/product-types";

export const createProduct = async (product: Product) => {
    await db.insert(products).values({
        name: product.name,
        rate: product.rate,
        unit: product.unit,
    });
};

export const getProduct = async (id: number) => {
    return db.select().from(products).where(eq(products.id, id)).get();
};

export const getProducts = async () => {
    return db.select().from(products).all();
};
