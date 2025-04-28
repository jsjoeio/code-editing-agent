import Anthropic from '@anthropic-ai/sdk';
import { Agent } from './Agent';

declare module "bun" {
    interface Env {
        ANTHROPIC_API_KEY: string;
    }
  }

async function main() {
    const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    })
    const agent = new Agent(client);

    await agent.run();
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
}); 

