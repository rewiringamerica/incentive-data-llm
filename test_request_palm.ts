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
const model = 'chat-bison@001';

const predictionServiceClient = new PredictionServiceClient(clientOptions);
const endpoint = `projects/${project}/locations/us-central1/publishers/${publisher}/models/${model}`;

async function testRequest() {
    const prompt = {
        context: 'You are a helpful assistant',
        messages: [
            { author: "user", content: "Give me 3 excellent dad jokes." },
        ],
    };

    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue!];

    const parameter = {
        temperature: 0.7 // To get more joke variation!
    };
    const parameters = helpers.toValue(parameter);

    const request = {
        endpoint,
        instances,
        parameters
    };

    try {
        const [completion] = await predictionServiceClient.predict(request);
        for (const prediction of completion.predictions!) {
            console.log(JSON.stringify(prediction
                .structValue?.fields!.candidates
                .listValue?.values![0]
                .structValue?.fields!.content
                .stringValue));
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error with PALM API request: ${error.message}`)
        } else {
            console.error(`Error with PALM API request: ${error}`);
        }
    }
}

testRequest();