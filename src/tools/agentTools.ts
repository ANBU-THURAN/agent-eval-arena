import {DynamicStructuredTool, DynamicTool} from "langchain/tools";
import {
    addProductsToAgent, addWealthToAgent,
    getAgents,
    getCurrentState,
    removeProductsFromAgent,
    removeWealthFromAgent
} from "@/actions/agent";
import {
    changeProposalStatus,
    createProposal, getProposal,
    getReceivedProposals,
    getSentProposals,
    getTransactions,
    getTransactionsOfProduct
} from "@/actions/proposals"; // adjust path if needed
import { z } from "zod";
import {CreateProposal} from "@/types/proposal-types";
import {getProduct} from "@/actions/products";
import {tool} from "@langchain/core/tools"

export const computeTool = tool(
    ({ a, b }: { a: number; b: number }): number => {
        /**
         * Multiply a and b.
         */
        return a * b;
    },
    {
        name: "compute",
        description: "computes result of two numbers",
        schema: z.object({
            a: z.number(),
            b: z.number(),
        }),
    }
);

export const getCurrentStateTool = new DynamicTool({
    name: "get_my_current_state",
    description: "Get the current state of yourself by providing your id, result includes your details and the products you own along with quantities.",
    func: async (input: string) => {
        try {
            const agentId = parseInt(input);
            if (isNaN(agentId)) {
                throw new Error("Invalid agentId. Please provide a valid number.");
            }

            const state = await getCurrentState(agentId);

            if (!state) {
                return `Agent with id ${agentId} not found`;
            }

            return JSON.stringify(state, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const getCurrentStateOfAgentsTool = new DynamicTool({
    name: "get_current_state_of_agents",
    description:
        "Get the current state of all agents, including their details and the products they own with quantities.",
    func: async () => {
        try {
            const agents = await getAgents();
            if (!agents || agents.length === 0) {
                return "No agents found.";
            }

            const states = [];
            for (const agent of agents) {
                const state = await getCurrentState(agent.id);
                if (state) {
                    states.push(state);
                }
            }

            return JSON.stringify(states, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});


export const getSentProposalsTool = new DynamicTool({
    name: "get_sent_proposals",
    description:
        "Get all proposals sent by a given agent. Input should be the agentId (number).",
    func: async (input: string) => {
        try {
            const agentId = parseInt(input);
            if (isNaN(agentId)) {
                throw new Error("Invalid agentId. Please provide a valid number.");
            }

            const proposals = await getSentProposals(agentId);
            return JSON.stringify(proposals, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const getReceivedProposalsTool = new DynamicTool({
    name: "get_received_proposals",
    description:
        "Get all proposals received by a given agent. Input should be the agentId (number).",
    func: async (input: string) => {
        try {
            const agentId = parseInt(input);
            if (isNaN(agentId)) {
                throw new Error("Invalid agentId. Please provide a valid number.");
            }

            const proposals = await getReceivedProposals(agentId);
            return JSON.stringify(proposals, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const getTransactionsOfProductTool = new DynamicTool({
    name: "get_transactions_of_product",
    description:
        "Get all transactions of a product. Input should be the productId (number). Only proposals with status 'accepted' are returned.",
    func: async (input: string) => {
        try {
            const productId = parseInt(input);
            if (isNaN(productId)) {
                throw new Error("Invalid productId. Please provide a valid number.");
            }

            const transactions = await getTransactionsOfProduct(productId);
            return JSON.stringify(transactions, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const getMyTransactionsTool = new DynamicTool({
    name: "get_my_transactions",
    description:
        "Get all transactions of yourself. Input should be your agentId. A transaction means a proposal with status 'accepted' where this agent is either sender or receiver.",
    func: async (input: string) => {
        try {
            const agentId = parseInt(input);
            if (isNaN(agentId)) {
                throw new Error("Invalid agentId. Please provide a valid number.");
            }

            const transactions = await getTransactions(agentId);
            return JSON.stringify(transactions, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const sendProposalToAgentTool = new DynamicStructuredTool({
    name: "send_proposal_to_agent",
    description:
        "Send a proposal from one agent to another. Requires fromAgentId, toAgentId, productId, product name, quantity, rate, and a message.",
    schema: z.object({
        fromAgentId: z.number().describe("The ID of the agent sending the proposal"),
        toAgentId: z.number().describe("The ID of the agent receiving the proposal"),
        productId: z.number().describe("The ID of the product involved in the proposal"),
        quantity: z.number().describe("The quantity of product being proposed"),
        rate: z.number().describe("The rate or price per unit of the product"),
        message: z.string().describe("The content of the proposal message"),
        action: z.string().describe("The action of the proposal message buy/sell"),
    }),
    func: async (input) => {
        try {
            const proposal: CreateProposal = {
                fromAgentId: input.fromAgentId,
                toAgentId: input.toAgentId,
                productId: input.productId,
                quantity: input.quantity,
                rate: input.rate,
                message: input.message,
                action: input.action as "buy" | "sell",
            };

            const result = await createProposal(proposal);

            return JSON.stringify(result, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const getProductTool = new DynamicTool({
    name: "get_product_details",
    description:
        "get the details of a product by providing it's ID",
    func: async (input: string) => {
        try {
            const productId = parseInt(input);
            console.log(productId);
            if (isNaN(productId)) {
                throw new Error("Invalid productId. Please provide a valid number.");
            }

            const product = await getProduct(productId);
            console.log(product);
            return JSON.stringify(product, null, 2);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});

export const respondToProposalTool = new DynamicStructuredTool({
    name: "respond_to_proposal",
    description:
        "Respond to a pending proposal. Can accept or reject it. Automatically transfers products and wealth if accepted. Inputs: proposalId, status ('accepted' or 'rejected'), message.",
    schema: z.object({
        proposalId: z.number().describe("The ID of the proposal to respond to"),
        status: z.enum(["accepted", "rejected"]).describe("The new status of the proposal"),
        message: z.string().describe("The response message"),
    }),
    func: async (input) => {
        try {
            const { proposalId, status, message } = input;

            const proposal = await getProposal(proposalId);
            if (!proposal) {
                throw new Error(`Proposal with id ${proposalId} not found`);
            }
            if (proposal.status !== "pending") {
                throw new Error("Proposal is not pending and cannot be updated");
            }

            if (status === "rejected") {
                return await changeProposalStatus(proposalId, status, message);
            }

            const { fromAgentId, toAgentId, productId, quantity, rate, action } = proposal;

            if (action === "buy") {
                await removeProductsFromAgent(toAgentId, productId, quantity);
                await addProductsToAgent(fromAgentId, productId, quantity);

                const totalCost = quantity * rate;
                await removeWealthFromAgent(fromAgentId, totalCost);
                await addWealthToAgent(toAgentId, totalCost);
            } else if (action === "sell") {

                await removeProductsFromAgent(fromAgentId, productId, quantity);
                await addProductsToAgent(toAgentId, productId, quantity);

                const totalCost = quantity * rate;
                await removeWealthFromAgent(toAgentId, totalCost);
                await addWealthToAgent(fromAgentId, totalCost);
            }

            return await changeProposalStatus(proposalId, status, message);
        } catch (err: any) {
            return `Error: ${err.message}`;
        }
    },
});





