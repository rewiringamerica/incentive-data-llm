import { OpenAI } from "openai";

import { config } from 'dotenv';

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: "org-ddLfNAZlZhWVu6YToH5DHQno",
});

async function testRequest() {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", content: "You are a helpful assistant." },
        { "role": "user", content: "Give me 3 excellent dad jokes." },
      ],
      temperature: 0.7 // To get more joke variation!
    });
    console.log(completion.choices[0].message!.content);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error with OpenAI API request: ${error.message}`)
    } else {
      console.error(`Error with OpenAI API request: ${error}`);
    }
  }
}

testRequest();