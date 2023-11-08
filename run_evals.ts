import { program } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');

import { SYSTEM, EXAMPLE_1_USER, EXAMPLE_1_RESPONSE } from "./prompt_eval.js"
import { queryPalm } from "./palm_wrapper.js";
import { queryGpt } from "./gpt_wrapper.js";


program
    .requiredOption("-g, --golden_folder <folder>", 'Path to the folder where golden files live with suffix _golden.json for each relevant file')
    .requiredOption("-o, --output_folder <folder>", 'Path to the output folder where output files live with suffix _output.json.');

program.parse();

const INCENTIVES_FILE_BASE = "incentives_data/";
const OUTPUT_FILE_BASE = "out/";

function compareIncentives(golden: object, output: object): Promise<string> {
    console.log("Golden");
    console.log(golden);

    console.log("Output");
    console.log(output);

    let lastMessage: string = `Expert:
    ${JSON.stringify(golden)}
    
    Student:
    ${JSON.stringify(output)}`

    // return [queryGpt(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]]), queryPalm(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]])];
    return queryGpt(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]]);
}

async function compareData(key: string, golden_data: object[], output_data: object[]): Promise<object[]> {
    let diffs: object[] = [];
    let promises: Promise<string>[] = [];

    if (golden_data.length != output_data.length) {
        console.log("Golden and output data are different lengths; comparison not supported");
    } else {
        for (let i = 0; i < golden_data.length; i++) {
            let incentivePromise = compareIncentives(golden_data[i], output_data[i]);
            promises.push(incentivePromise);
            incentivePromise.then((result) => {
                let diff = JSON.parse(result);
                diff["key"] = key;
                diff["order"] = i;
                diffs.push(diff);
            })
        }
    }

    await Promise.allSettled(promises).then(async () => {
        console.log(diffs);
        return diffs;
    })
    return [];
}

async function main() {
    const opts = program.opts();

    const golden_files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, opts.golden_folder));
    const output_files = await fs.readdir(path.join(OUTPUT_FILE_BASE, opts.output_folder));

    let unmatched_golden_files: string[] = [];
    let unmatched_output_files: string[] = [];
    let seenOutputFiles = new Set<string>();

    for (const golden_file of golden_files) {
        if (!golden_file.endsWith("_golden.json")) continue;

        const matching_output = golden_file.replace("_golden", "_output")
        let output_data: string;
        try {
            output_data = await fs.readFile(path.join(OUTPUT_FILE_BASE, opts.output_folder, matching_output), { encoding: 'utf8' })
        } catch (err) {
            unmatched_golden_files.push(golden_file)
            continue;
        }
        if (output_data == "") {
            continue;
        }

        seenOutputFiles.add(matching_output)
        const golden_data = JSON.parse(await fs.readFile(path.join(INCENTIVES_FILE_BASE, opts.golden_folder, golden_file), { encoding: 'utf8' }))
        // let golden_records: Incentive[] = [];
        // for (const golden of golden_data) {
        //     let parsed = golden as Incentive;
        //     golden_records.push(parsed);
        // }
        // const output_data_objs = JSON.parse(output_data)
        // let output_records: Incentive[] = [];
        // for (const output of output_data_objs) {
        //     let parsed = output as Incentive;
        //     output_records.push(parsed);
        // }
        let diff = compareData(golden_file, golden_data, JSON.parse(output_data));
    }

    for (const output_file of output_files) {
        if (!(seenOutputFiles.has(output_file))) {
            unmatched_output_files.push(output_file);
        }
    }
    console.log("Unmatched goldens:");
    console.log(unmatched_golden_files);
    console.log("Unmatched outputs:");
    console.log(unmatched_output_files);

    // await fs.writeFile(path.join(OUTPUT_FILE_BASE, opts.output), records.join("\n"), {
    //     encoding: "utf-8",
    //     flag: "w"
    // })
}

main()