import { db } from './index.js';
import { schema } from './schema/index.js';
import { AGENT_MODELS, AGENTS } from '../config/agents.config.js';
import { GOODS } from '../config/economy.config.js';
async function seed() {
    console.log('Seeding database...');
    try {
        // Seed models
        console.log('Seeding models...');
        for (const model of AGENT_MODELS) {
            await db.insert(schema.models).values(model).onConflictDoNothing();
        }
        console.log(`✓ Seeded ${AGENT_MODELS.length} models`);
        // Seed agents
        console.log('Seeding agents...');
        for (const agent of AGENTS) {
            await db.insert(schema.agents).values({
                id: agent.id,
                name: agent.name,
                modelId: agent.modelId,
                provider: agent.provider,
            }).onConflictDoNothing();
        }
        console.log(`✓ Seeded ${AGENTS.length} agents`);
        // Seed goods
        console.log('Seeding goods...');
        for (const good of GOODS) {
            await db.insert(schema.goods).values(good).onConflictDoNothing();
        }
        console.log(`✓ Seeded ${GOODS.length} goods`);
        console.log('Database seeding complete!');
    }
    catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    }
}
seed().catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map