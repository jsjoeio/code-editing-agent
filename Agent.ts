import Anthropic from "@anthropic-ai/sdk";

export class Agent {
    private client: Anthropic;
    constructor(client: Anthropic, getUserMessage: () => Promise<void>) {
        this.client = client;
    }

    private async getUserMessage(): Promise<string> {
        const prompt = "\u001b[94mYou\u001b[0m: ";
        process.stdout.write(prompt);
        for await (const line of process.stdin) {
            const userInput = line.trim();
            if (userInput) {
                return userInput;
            }
        }

        return ""
    }

    private async runInference(conversation: { role: "user" | "assistant", content: string}[]): Promise<Anthropic.Messages.Message> {
        const params: Anthropic.MessageCreateParams = {
            max_tokens: 1024,
            messages: conversation,
            model: 'claude-3-5-sonnet-latest',
          };
          const message = await this.client.messages.create(params);
          return message;
    }

    // todo how to handle errors, either return result or throw error
    public async run(): Promise<void> {
        const conversation: { role: "user" | "assistant"; content: string }[] = [];

        console.log("Chat with Claude (use 'ctrl-c' to quit)")

        while (true) {
            const userMessage = await this.getUserMessage();
            if (userMessage === "exit" || userMessage === "quit") {
                console.log("Exiting chat...");
                break;
            }

            conversation.push({ role: "user", content: userMessage });

            try {
                // Get response from Claude
                const message = await this.runInference(conversation);
                message.content
                const assistantMessage = { role: "assistant" as const, content: message.content.join(" ") };
                conversation.push(assistantMessage);

                // Display Claude's response
                console.log(`\u001b[93mClaude\u001b[0m: ${message.content}`);
            } catch (error) {
                console.error("Error during inference:", error);
                break;
            }
        }

    }

}