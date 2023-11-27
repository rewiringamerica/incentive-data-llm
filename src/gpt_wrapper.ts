import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

import { encode } from 'gpt-3-encoder';
import { config } from 'dotenv';

config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-ddLfNAZlZhWVu6YToH5DHQno",
});
const openai = new OpenAIApi(configuration);

const LOG_TOKEN_COUNTS = false

export class GptWrapper {
  model_family: string

  constructor(model_family: string) {
    this.model_family = model_family
  }

  generateMessagesGpt(text: string, system: string, examples: [string, string][]): ChatCompletionRequestMessage[] {

    const output: ChatCompletionRequestMessage[] = [];
    output.push({ role: "system", content: system });
    for (const [user, assistant] of examples) {
      output.push({ role: "user", content: user });
      output.push({ role: "assistant", content: assistant });
    }
    output.push({ role: "user", content: text });

    return output;
  }

  async queryGpt(input_text: string, system: string, examples: [string, string][]): Promise<string> {
    if (input_text.trim().length === 0) {
      throw new TypeError("Input text can't be empty string");
    }
    const messages = this.generateMessagesGpt(input_text, system, examples);
    // Count tokens for the purpose of deciding if we need a model with a longer context window (which is more expensive).
    let token_count = 100; // We give a bit of buffer to account for other tokens needed to form the request.
    for (const message of messages) {
      token_count += encode(message.content!).length;
    }
    if (LOG_TOKEN_COUNTS) console.log(token_count)

    let model: string = ""
    if (this.model_family == "gpt4") {
      model = 'gpt-4-1106-preview'
    } else if (this.model_family == "gpt") {
      model = 'gpt-3.5-turbo-1106'
    } else {
      throw new Error(`Invalid model_family supplied; must be gpt or gpt4 for GPT models: ${this.model_family}`)
    }

    try {
      const completion = await openai.createChatCompletion({
        model: model,
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
}




