import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import { agent as agents, agentProduct as agentProducts, product as products } from "@/db/schema";
import {Agent} from "@/types/agent-types";

export const createAgent = async (agent:Agent) => {
    await db.insert(agents).values({
        name: agent.name,
        wealth: agent.wealth
    });
}

export const getAgent = async (id: number) => {
    return db.select().from(agents).where(eq(agents.id, id)).get();
}

export const getAgents = async () => {
    return db.select().from(agents).all();
}

export const addProductsToAgent = async (agentId: number, productId: number, quantity: number) => {
    const existing = await db
        .select()
        .from(agentProducts)
        .where(and(eq(agentProducts.agentId, agentId), eq(agentProducts.productId, productId)))
        .get();

    if (existing) {

        await db
            .update(agentProducts)
            .set({ quantity: existing.quantity + quantity })
            .where(eq(agentProducts.id, existing.id));
    } else {

        await db.insert(agentProducts).values({
            agentId,
            productId,
            quantity,
        });
    }
};

export const removeProductsFromAgent = async (agentId: number, productId: number, quantity: number) => {
    const existing = await db
        .select()
        .from(agentProducts)
        .where(and(eq(agentProducts.agentId, agentId), eq(agentProducts.productId, productId)))
        .get();

    if (!existing) return;

    const newQuantity = existing.quantity - quantity;
    if (newQuantity > 0) {
        await db
            .update(agentProducts)
            .set({ quantity: newQuantity })
            .where(eq(agentProducts.id, existing.id));
    } else {
        await db.delete(agentProducts).where(eq(agentProducts.id, existing.id));
    }
};

export const getCurrentState = async (agentId: number) => {
    const agent = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .get();

    if (!agent) return null;

    const productsWithQty = await db
        .select({
            productId: agentProducts.productId,
            name: products.name,
            quantity: agentProducts.quantity,
        })
        .from(agentProducts)
        .leftJoin(products, eq(agentProducts.productId, products.id))
        .where(eq(agentProducts.agentId, agentId))
        .all();

    return {
        ...agent,
        products: productsWithQty,
    };
};


export const addWealthToAgent = async (agentId: number, amount: number) => {
    const existing = await getAgent(agentId);
    if (!existing) return null;

    const newWealth = existing.wealth + amount;

    await db
        .update(agents)
        .set({ wealth: newWealth })
        .where(eq(agents.id, agentId));

    return { ...existing, wealth: newWealth };
};


export const removeWealthFromAgent = async (agentId: number, amount: number) => {
    const existing = await getAgent(agentId);
    if (!existing) return null;

    const newWealth = existing.wealth - amount;

    if(newWealth < 0) throw new Error("cannot remove wealth");

    await db
        .update(agents)
        .set({ wealth: newWealth })
        .where(eq(agents.id, agentId));

    return { ...existing, wealth: newWealth };
};

