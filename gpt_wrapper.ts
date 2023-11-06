import { Configuration, OpenAIApi } from "openai";

import { encode } from 'gpt-3-encoder';
import { generateMessagesGpt } from "./prompt.js";

import { config } from 'dotenv';

config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    // organization: "org-ddLfNAZlZhWVu6YToH5DHQno",
});
const openai = new OpenAIApi(configuration);


export async function queryGpt(input_text: string): Promise<string> {
    if (input_text.trim().length === 0) {
        throw new TypeError("Input text can't be empty string");
    }
    const messages = generateMessagesGpt(input_text);
    // Count tokens for the purpose of deciding if we need a model with a longer context window (which is more expensive).
    let token_count = 100; // We give a bit of buffer to account for other tokens needed to form the request.
    for (const message of messages) {
        token_count += encode(message.content!).length;
    }

    try {
        const completion = await openai.createChatCompletion({
            model: token_count > 4096 ? "gpt-3.5-turbo-16k" : "gpt-3.5-turbo", // 'gpt-4-32k' : 'gpt-4',
            messages: messages,
            temperature: 0.0,
        });
        return completion.data.choices[0].message!.content!;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error with OpenAI API request: ${error.message}`)
        } else {
            console.error(`Error with OpenAI API request: ${error}`);
        }
    }
    return "";
}