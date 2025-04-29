import Anthropic from "@anthropic-ai/sdk";

export class Agent {
    private client: Anthropic;
    private useStub: boolean;
    constructor(client: Anthropic, useStub: boolean = false) {
        this.client = client;
        this.useStub = useStub;
    }

    private async getUserMessage(): Promise<string> {
        const prompt = "\u001b[94mYou\u001b[0m: ";
        process.stdout.write(prompt);

        return new Promise((resolve, reject) => {
            try {
                process.stdin.setEncoding("utf-8");
                process.stdin.resume(); // Ensure stdin is active

                process.stdin.once("data", (data) => {
                    const userInput = data.toString().trim();
                    process.stdin.pause(); // Pause stdin after receiving input
                    resolve(userInput);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    private async runInference(conversation: { role: "user" | "assistant", content: string }[]): Promise<Anthropic.Messages.Message> {
        const params: Anthropic.MessageCreateParams = {
            max_tokens: 1024,
            messages: conversation,
            model: 'claude-3-5-sonnet-latest',
        };

        if (this.useStub) {
            const stubResponse = {
                content: [
                    {

                        type: "text",
                        text: "This is a stubbed response from Claude.",
                    }

                ]
            } as unknown as Anthropic.Messages.Message;

            return Promise.resolve(stubResponse);

        }
        try {
            const message = await this.client.messages.create(params);
            return message;
        } catch (error) {
            console.error("Error during inference:", error);
            return Promise.reject(error);
        }
    }

    public async run(): Promise<void> {
        const conversation: { role: "user" | "assistant"; content: string }[] = [];

        console.log("Chat with Claude (type 'exit' or 'quit' to end session)!")

        while (true) {
            const userMessage = await this.getUserMessage();
            if (userMessage === "exit" || userMessage === "quit") {
                console.log("Exiting chat...");
                break;
            }

            conversation.push({ role: "user" as const, content: userMessage });

            try {
                // Get response from Claude
                const message = await this.runInference(conversation);

                const assistantContent = message.content.filter(item => item.type === "text").map(item => item.text).join(" ");
                conversation.push({
                    role: "assistant" as const,
                    content: assistantContent,
                });

                // Display Claude's response
                console.log(`\u001b[93mClaude\u001b[0m: ${assistantContent}`);
            } catch (error) {
                console.error("Error during inference:", error);
                break;
            }
        }

    }

}