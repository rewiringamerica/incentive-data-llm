import { VertexAI } from "@google-cloud/vertexai";

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function createNonStreamingMultipartContent(
  projectId = "fleet-toolbox-404319",
  location = "us-central1",
  model = "gemini-1.0-pro"
) {
  // Initialize Vertex with your Cloud project and location
  const vertexAI = new VertexAI({ project: projectId, location: location });

  // Instantiate the model
  const generativeVisionModel = vertexAI.getGenerativeModel({
    model: model,
  });

  const textPart = {
    text: "You are a helpful assistant. Give me three dad jokes.",
  };

  const request = {
    contents: [{ role: "user", parts: [textPart] }],
  };

  console.log("Prompt Text:");
  console.log(request.contents[0].parts[0].text);

  console.log("Non-Streaming Response Text:");
  const response = await generativeVisionModel.generateContent(request);

  // Select the text from the response
  const fullTextResponse =
    response.response.candidates[0].content.parts[0].text;

  console.log(fullTextResponse);
}

createNonStreamingMultipartContent();
