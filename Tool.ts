import * as fs from "fs/promises";

export type ToolDefinition = {
    name: string;
    description: string;
    inputSchema: JSONSchema; // Updated to match the JSON schema structure
    function: (input: unknown) => Promise<string>;
};

type JSONSchema = {
    type: "object";
    properties: {
        [key: string]: {
            type: string;
            description?: string;
        };
    };
    required?: string[];
};

type ReadFileInput = {
    filePath: string;
};

const readFileInputSchema = {
    type: "object" as const,
    properties: {
        filePath: {
            type: "string",
            description: "The relative file path to read",
        },
    },
    required: ["filePath"],
};

// ReadFile function implementation
async function readFile(input: unknown): Promise<string> {
    // Validate and parse the input
    const { filePath: path } = input as ReadFileInput;

    try {
        // Read the file contents
        const content = await fs.readFile(path, "utf-8");
        return content;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
        return "Failed to read file: Unknown error";
    }
}

export const READ_FILE_DEFINITION: ToolDefinition = {
    name: "read_file",
    description: "Read the contents of a given relative file path. Use this when you want to see what's inside a file. Do not use this with directory names.",
    inputSchema: readFileInputSchema,
    function: readFile,
};
