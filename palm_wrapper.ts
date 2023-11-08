import aiplatform from '@google-cloud/aiplatform';

// Imports the Google Cloud Prediction service client
const { PredictionServiceClient } = aiplatform.v1;

// Import the helper module for converting arbitrary protobuf.Value objects.
const { helpers } = aiplatform;

// Specifies the location of the api endpoint
const clientOptions = {
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};

const project = 'fleet-toolbox-404319';
const publisher = 'google';
const model = 'chat-bison-32k';

const predictionServiceClient = new PredictionServiceClient(clientOptions);
const endpoint = `projects/${project}/locations/us-central1/publishers/${publisher}/models/${model}`;

function generateMessagesPalm(input_text: string, system: string, examples: [string, string][]) {
    let examples_list: object[] = [];
    for (const [user, response] of examples) {
        examples_list.push({ input: { content: user }, output: { content: response } })
    }
    return {
        context: system,
        examples: examples_list,
        messages: [
            { author: "user", content: input_text },
        ]
    }
}

export async function queryPalm(input_text: string, system: string, examples: [string, string][]): Promise<string> {
    if (input_text.trim().length === 0) {
        throw new TypeError("Input text can't be empty string");
    }
    const prompt = generateMessagesPalm(input_text, system, examples);
    // TODO: add token counting

    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue!];

    const parameter = {
        temperature: 0.0
    };
    const parameters = helpers.toValue(parameter);

    const request = {
        endpoint,
        instances,
        parameters
    };

    try {
        const [completion] = await predictionServiceClient.predict(request);
        return completion.predictions![0]
            .structValue?.fields!.candidates
            .listValue?.values![0]
            .structValue?.fields!.content
            .stringValue!;
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error with PALM API request: ${error.message}`)
        } else {
            console.error(`Error with PALM API request: ${error}`);
        }
    }
    return "";
}