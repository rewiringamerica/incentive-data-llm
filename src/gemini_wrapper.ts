import { GenerateContentRequest, VertexAI } from "@google-cloud/vertexai";
// import util from "util";

const projectId = "fleet-toolbox-404319";
const location = "us-central1";
const model = "gemini-1.0-pro";

const vertexAI = new VertexAI({ project: projectId, location: location });
const generativeModel = vertexAI.getGenerativeModel({
  model: model,
});

function generateMessagesGemini(
  input_text: string,
  system: string,
  examples: [string, string][]
): GenerateContentRequest {
  const examples_list = [];
  for (const [user, response] of examples) {
    examples_list.push(
      { role: "user", parts: [{ text: user }] },
      { role: "assistant", parts: [{ text: response }] }
    );
  }
  return {
    contents: [
      { role: "system", parts: [{ text: system }] },
      ...examples_list,
      { role: "user", parts: [{ text: input_text }] },
    ],
  };
}

export async function queryGemini(
  input_text: string,
  system: string,
  examples: [string, string][]
): Promise<string> {
  if (input_text.trim().length === 0) {
    throw new TypeError("Input text can't be empty string");
  }
  const prompt = generateMessagesGemini(input_text, system, examples);
  // TODO: add token counting

  const resp = await generativeModel.countTokens(prompt);
  console.log("count tokens response: ", resp);

  // console.log(util.inspect(prompt, false, null, true));
  // const prompt2: GenerateContentRequest = {
  //   contents: [{ role: "user", parts: [{ text: "Tell me 3 dad jokes." }] }],
  // };

  try {
    const response = await generativeModel.generateContent(prompt);
    return response.response.candidates[0].content.parts[0].text || "";
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error with Gemini API request, error: ${error}`);
    } else {
      console.error(`Error with Gemini API request: ${error}`);
    }
  }
  return "";
}
