export type Proposal = {
    fromAgentId: number; //
    toAgentId: number;
    message: string;
    timestamp: number;  //
    status: "accepted" | "rejected" | "pending"; //
    type: "new" | "counter"; //
    action: "buy" | "sell";
    productId: number;
    quantity: number;
    rate: number;
}

export type CreateProposal = Omit<Proposal, "timestamp" | "status" | "type">;
export type ProposalResponse = Omit<Proposal, "type" | "timestamp" | "fromAgentId" | "toAgentId" | "action">;