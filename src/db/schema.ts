import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

// Agents table
export const agent = sqliteTable("agent", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull()
});

// Products table
export const product = sqliteTable("product", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    rate: integer("rate").notNull(),
    unit: text("unit").notNull(),
});

// AgentProducts table (join table)
export const agentProduct = sqliteTable("agent_product", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    agentId: integer("agent_id")
        .notNull()
        .references(() => agent.id),
    productId: integer("product_id")
        .notNull()
        .references(() => product.id),

    quantity: real("quantity").notNull(),
});

export const proposal = sqliteTable("proposal", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    fromAgentId: integer("from_agent_id")
        .notNull()
        .references(() => agent.id),

    toAgentId: integer("to_agent_id")
        .notNull()
        .references(() => agent.id),

    productId: integer("product_id")
        .notNull()
        .references(() => product.id),

    quantity: real("quantity").notNull(),
    rate: real("rate").notNull(),
    timestamp: integer("timestamp").notNull(),
    status: text("status").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(),
    action: text("action").notNull(),
});
