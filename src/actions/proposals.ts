import {and, eq, or,} from "drizzle-orm";
import {db} from "@/db";
import {proposal as proposals} from "@/db/schema";
import {CreateProposal, Proposal} from "@/types/proposal-types";

export const createProposal = async (proposal:CreateProposal) => {
    const toCreate:Proposal = {
        fromAgentId: proposal.fromAgentId,
        toAgentId: proposal.toAgentId,
        productId: proposal.productId,
        message: proposal.message,
        action: proposal.action,
        quantity: proposal.quantity,
        rate: proposal.rate,
        timestamp: Date.now(),
        status: "pending",
        type: "new",
    }
    await db.insert(proposals).values(toCreate);
}

export const getProposal = async (id: number) => {
    return db.select().from(proposals).where(eq(proposals.id, id)).get();
}

export const getSentProposals = async (agentId: number) => {
    return db.select().from(proposals).where(eq(proposals.fromAgentId, agentId)).get();
}

export const getReceivedProposals = async (agentId: number) => {
    return db.select().from(proposals).where(eq(proposals.toAgentId, agentId)).get();
}

export const getAllProposals = async () => {
    return db.select().from(proposals).all();
}

export const getTransactionsOfProduct = async (productId: number) => {
    return db
        .select()
        .from(proposals)
        .where(
            and(
                eq(proposals.productId, productId),
                eq(proposals.status, "accepted")
            )
        )
        .all();
};

export const changeProposalStatus = async (
    proposalId: number,
    status: "accepted" | "rejected",
    message: string
) => {

    const existing = await db
        .select()
        .from(proposals)
        .where(and(eq(proposals.id, proposalId), eq(proposals.status, "pending")))
        .get();

    if (!existing) {
        throw new Error("Proposal not found or not in pending state");
    }


    await db
        .update(proposals)
        .set({
            status,
            message
        })
        .where(eq(proposals.id, proposalId));

    return { ...existing, status, message };
};

