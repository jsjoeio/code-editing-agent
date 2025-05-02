import Anthropic from "@anthropic-ai/sdk";
import { READ_FILE_DEFINITION, type ToolDefinition } from "./Tool";
import type { MessageParam } from "@anthropic-ai/sdk/src/resources.js";


export class Agent {
    private client: Anthropic;
    private useStub: boolean;
    private tools: ToolDefinition[] = [READ_FILE_DEFINITION];
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

    private async runInference(conversations: MessageParam[]): Promise<Anthropic.Messages.Message> {
        const params: Anthropic.MessageCreateParams = {
            max_tokens: 1024,
            messages: conversations,
            model: 'claude-3-5-sonnet-latest',
            tools: this.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.inputSchema,
            })),
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


        const conversation: MessageParam[] = [];

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

                message.content.forEach(async (item) => {
                    let content = "";
                    switch (item.type) {
                        case 'text':
                            content = item.text;
                            console.log(`\u001b[93mClaude\u001b[0m: ${content}`);
                            conversation.push({
                                content,
                                role: "assistant" as const,
                            });
                            break;
                        case 'tool_use':
                            const result = await this.executeTool(item)
                            const toolResultContent = [
                                {
                                    "type": "tool_result" as const,
                                    "tool_use_id": result.id,
                                    "content": result.result,
                                }
                            ]
                            // have ot push tool_use before tool result
                            conversation.push({
                                role: 'assistant' as const,
                                content: [
                                    {
                                        type: "tool_use" as const,
                                        id: item.id,
                                        name: item.name,
                                        input: item.input,
                                    }
                                ]
                            })

                            conversation.push({
                                role: 'user' as const,
                                content: toolResultContent,
                            });
                            console.log(`\n\u001b[92mtool\u001b[0m: ${item.name}(${JSON.stringify(item.input)})`);

                            const followUp = await this.runInference(conversation);

                            followUp.content.forEach((item) => {
                                if (item.type === 'text') {
                                    const content = item.text;
                                    console.log(`\u001b[93mClaude\u001b[0m: ${content}`);
                                    conversation.push({
                                        role: "assistant" as const,
                                        content,
                                    });
                                }
                            });

                            break;
                        default:
                            break;
                    }
                });
            } catch (error) {
                console.error("Error during inference:", error);
                break;
            }
        }

    }

    private async executeTool(item: Anthropic.Messages.ToolUseBlock): Promise<{ type: 'tool_result'; id: string; result: string; error: boolean }> {
        const toolDef = this.tools.find(tool => tool.name === item.name);

        if (!toolDef) {
            return {
                type: 'tool_result',
                id: item.id,
                result: 'tool not found',
                error: true,
            };
        }

        try {
            const response = await toolDef.function(item.input);
            return {
                type: 'tool_result',
                id: item.id,
                result: response,
                error: false,
            };
        } catch (err) {
            return {
                type: 'tool_result',
                id: item.id,
                result: (err as Error).message,
                error: true,
            };
        }
    }
}