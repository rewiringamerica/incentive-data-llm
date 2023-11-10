import { program, Option } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');

import { queryPalm } from "./palm_wrapper.js";
import { queryGpt } from "./gpt_wrapper.js";
import { Differ, Diff, Report } from "./differ.js";
import { INCENTIVES_FILE_BASE, OUTPUT_FILE_BASE } from './constants.js';

program
    .requiredOption("-d, --diff_file <diff>", 'Path to save output diff file. Report will have the same name but with a _report.csv suffix')
    .requiredOption("-g, --golden_folder <folder>", 'Path to the folder where golden files live with suffix _golden.json for each relevant file')
    .requiredOption("-o, --output_folder <folder>", 'Path to the output folder where output files live with suffix _output.json.')
    .addOption(new Option("-m, --model_family <model_family>", 'Name of model family to use – either gpt or palm, which controls which model will be queried').choices(['gpt', 'palm']).default('palm'));


program.parse();

async function main() {
    const opts = program.opts();

    const golden_files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, opts.golden_folder));
    const output_files = await fs.readdir(path.join(OUTPUT_FILE_BASE, opts.output_folder));

    let unmatched_golden_files: string[] = [];
    let unmatched_output_files: string[] = [];
    let seenOutputFiles = new Set<string>();

    let promises: Promise<void>[] = [];
    let diffs: Diff[] = [];
    let queryFunc = opts.model_family == 'palm' ? queryPalm : queryGpt;
    let differ: Differ = new Differ(queryFunc);

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

        let promise = differ.compareData(golden_file, golden_data, JSON.parse(output_data)).then((diff) => {
            diffs.push(...diff);
        }).catch((err) => {
            console.log(`error: ${err}`);
        });
        promises.push(promise);

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

    await Promise.allSettled(promises).then(async () => {
        console.log(`Final diffs written to ${path.join(OUTPUT_FILE_BASE, opts.diff_file)}`);
        await fs.writeFile(path.join(OUTPUT_FILE_BASE, opts.diff_file), JSON.stringify(diffs), {
            encoding: "utf-8",
            flag: "w"
        })

        let report: Report = differ.createReport(diffs);
        differ.writeReport(report, path.join(OUTPUT_FILE_BASE, `${opts.diff_file}_report.csv`))
    })
}

main()