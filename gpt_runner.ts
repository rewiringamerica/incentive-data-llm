import { Configuration, OpenAIApi } from "openai";

import { AsyncParser } from '@json2csv/node';
import { encode } from 'gpt-3-encoder';
import { program } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');

import { generateMessages } from "./prompt.js";

import { config } from 'dotenv';

config();

program
    .requiredOption("-f, --folders <folders...>", "Name of folder(s) under incentives_data/ where text data is located.")
    .option("-o, --output_file <file>", 'Name of output file. Saved in the out/ directory.', "output.csv");

program.parse();


const INCENTIVES_FILE_BASE = "incentives_data/";
const OUTPUT_DIR = "out/";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    // organization: "org-ddLfNAZlZhWVu6YToH5DHQno",
});
const openai = new OpenAIApi(configuration);

async function queryGpt(input_text: string): Promise<string> {
    if (input_text.trim().length === 0) {
        throw new TypeError("Input text can't be empty string");
    }
    const messages = generateMessages(input_text);
    // Count tokens for the purpose of deciding if we need a model with a longer context window (which is more expensive).
    let token_count = 100; // We give a bit of buffer to account for other tokens needed to form the request.
    for (const message of messages) {
        token_count += encode(message.content!).length;
    }

    try {
        const completion = await openai.createChatCompletion({
            model: token_count > 4096 ? "gpt-3.5-turbo-16k" : "gpt-3.5-turbo",
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

const csv_opts = {
    fields: ['state', 'file', 'order', 'technology', 'technology (if selected other)',
        'program_description', 'program_status', 'program_start', 'program_end', 'rebate_type',
        'rebate_value', 'amount_type', 'number', 'unit', 'amount_minimum', 'amount_maximum',
        'amount_representative', 'bonus_description',
        'equipment_standards_restrictions', 'equipment_capacity_restrictions', 'installation_restrictions',
        'income_restrictions', 'tax_filing_status_restrictions', 'homeowner_renter', 'other_restrictions',
        'stacking_details', 'financing_details'
    ]
};

async function retrieveMetadata(folder: string, file: string): Promise<object> {
    const metadata_file = path.parse(file).name + "_metadata.json"
    try {
        const metadata = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, metadata_file), { encoding: 'utf8' })
        return JSON.parse(metadata);
    } catch (err) {
        // This is expected.
        // TODO(separate file not found error from other things that might go wrong)
        console.log(`No metadata file found: ${path.join(INCENTIVES_FILE_BASE, folder, file)}`);
        return {};
    }
}

async function main() {
    const opts = program.opts();

    let promises: Promise<void>[] = [];
    let output: object[] = [];
    let metadata_fields: Set<string> = new Set<string>();
    for (const folder of opts.folders) {
        const files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, folder));
        for (const file of files) {
            if (!file.endsWith(".txt")) continue;
            const txt = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, file), { encoding: 'utf8' });
            if (txt.length == 0) continue;

            const metadata_json = await retrieveMetadata(folder, file);
            for (const field in metadata_json) {
                metadata_fields.add(field);
            }


            console.log(`Querying GPT with ${path.join(INCENTIVES_FILE_BASE, folder, file)}`)
            let promise = queryGpt(txt).then(msg => {
                if (msg == "") return;
                console.log(`Got response from ${path.join(INCENTIVES_FILE_BASE, folder, file)}`)
                try {
                    const records = JSON.parse(msg);
                    let incentive_order_key = 0;
                    for (const record of records) {
                        record['state'] = folder;
                        record['file'] = file; // For debugging.
                        record['order'] = incentive_order_key;
                        var combined = { ...record, ...metadata_json };
                        output.push(combined);
                        incentive_order_key += 1;
                    }
                } catch (error) {
                    console.error(`Error parsing csv: ${error}, ${msg}`);
                }
            });
            promises.push(promise);
        }
    }

    await Promise.allSettled(promises).then(async () => {
        for (const field of metadata_fields) {
            csv_opts.fields.push(field);
        }

        const parser = new AsyncParser(csv_opts);
        const csv = await parser.parse(output).promise();
        fs.writeFile(path.join(OUTPUT_DIR, opts.output_file), csv);
    })
}

main()