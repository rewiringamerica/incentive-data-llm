
import { AsyncParser } from '@json2csv/node';
import { program, Option } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');

import { INCENTIVES_FILE_BASE, OUTPUT_DIR, CSV_OPTS } from './constants.js';
import { queryPalm } from "./palm_wrapper.js";
import { queryGpt } from "./gpt_wrapper.js";


program
    .requiredOption("-f, --folders <folders...>", "Name of folder(s) under incentives_data/ where text data is located.")
    .option("-r, --restrict <restrict_files...>", 'Will process only the files supplied. Useful for re-dos.')
    .option("-o, --output_file <file>", 'Name of output file. Saved in the out/ directory.', "output.csv")
    .addOption(new Option("-m, --model_family <model_family>", 'Name of model family to use – either gpt or palm, which controls which model will be queried').choices(['gpt', 'palm']).default('palm'));

program.parse();

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
            if (opts.restrict && !(opts.restrict.includes(file))) {
                continue;
            }
            const txt = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, file), { encoding: 'utf8' });
            if (txt.length == 0) {
                console.log(`Skipping ${file} because it is empty`)
                continue;
            }

            const metadata_json = await retrieveMetadata(folder, file);
            for (const field in metadata_json) {
                metadata_fields.add(field);
            }


            console.log(`Querying ${opts.model_family} with ${path.join(INCENTIVES_FILE_BASE, folder, file)}`)
            let queryFunc = opts.model_family == 'palm' ? queryPalm : queryGpt;
            let promise = queryFunc(txt).then(msg => {
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
                    console.error(`Error parsing json: ${error}, ${msg}`);
                }
            });
            promises.push(promise);
        }
    }

    await Promise.allSettled(promises).then(async () => {
        for (const field of metadata_fields) {
            CSV_OPTS.fields.push(field);
        }

        const parser = new AsyncParser(CSV_OPTS);
        const csv = await parser.parse(output).promise();
        fs.writeFile(path.join(OUTPUT_DIR, opts.output_file), csv);
    })
}

main()