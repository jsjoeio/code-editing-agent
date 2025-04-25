import Anthropic from '@anthropic-ai/sdk';

declare module "bun" {
    interface Env {
        ANTHROPIC_API_KEY: string;
    }
  }

async function main() {
    const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    })
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
}); 

