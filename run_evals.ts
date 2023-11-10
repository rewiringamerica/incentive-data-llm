import { program } from 'commander';
import Fuse from 'fuse.js'
import { AsyncParser } from '@json2csv/node';


import fs = require('node:fs/promises');
import path = require('node:path');

import { SYSTEM, EXAMPLE_1_USER, EXAMPLE_1_RESPONSE } from "./prompt_eval.js"
import { queryPalm } from "./palm_wrapper.js";
import { queryGpt } from "./gpt_wrapper.js";


program
    .requiredOption("-d, --diff_file <diff>", 'Path to save output diff file')
    .requiredOption("-g, --golden_folder <folder>", 'Path to the folder where golden files live with suffix _golden.json for each relevant file')
    .requiredOption("-o, --output_folder <folder>", 'Path to the output folder where output files live with suffix _output.json.');

program.parse();

const INCENTIVES_FILE_BASE = "incentives_data/";
const OUTPUT_FILE_BASE = "out/";
// 0 is an exact match; 1 is a terrible match.
const FUZZY_MATCH_THRESHOLD = 0.5;

enum Grade {
    Unspecified,

    MissingBoth,
    MissingPredicted,
    MissingGolden,
    CaseInsensitiveMatch,

    FuzzyMatch,
    FuzzyNoMatch,

    ModelGradedMatch,
    ModelGradedNoMatch
}

const GRADE_MAP: Map<string, Grade> = new Map([
    ["A", Grade.MissingBoth],
    ["B", Grade.MissingPredicted],
    ["C", Grade.MissingGolden],
    ["D", Grade.CaseInsensitiveMatch],
    ["E", Grade.ModelGradedMatch],
    ["F", Grade.ModelGradedNoMatch],
]);

// These fields will be compared by a fuzzy match algorithm to basically test
// that we got that answer or extremely close.
const FUZZY_MATCH_FIELDS: string[] = [
    "Technology*",
    "Program Status",
    "Program Start",
    "Program End",
    "Rebate Type",
    "Amount Type*",
    "Number*",
    "Unit",
    "Amount Minimum",
    "Amount Maximum",
    "Amount Representative",
    "Homeowner/ Renter",
];


const MODEL_GRADED_FIELDS: string[] = [
    "Rebate Value*",
    "Program Description (guideline)",
    "Bonus Description",
    "Equipment Standards Restrictions",
    "Equipment Capacity Restrictions",
    "Contractor Restrictions",
    "Income Restrictions",
    "Tax-filing Status Restrictions",
    "Other Restrictions",
    "Financing Details",
    "Stacking Details"
];

interface Diff {
    diffs: { [index: string]: DiffVal };
    extra_keys?: string;
    filename?: string;
    order?: number;
}

interface DiffVal {
    grade?: string, golden: string, predicted: string, explanation?: string
}

interface Incentive {
    [index: string]: string;
}

function compareFuzzyFields(golden: Incentive, output: Incentive): Diff {
    let diff: Diff = { diffs: {} };
    for (const k of FUZZY_MATCH_FIELDS) {
        let base: DiffVal = {
            golden: golden[k],
            predicted: output[k]
        };
        if (!(golden.hasOwnProperty(k) || output.hasOwnProperty(k))) {
            base.grade = Grade[Grade.MissingBoth];
        } else if (golden.hasOwnProperty(k) && !(output.hasOwnProperty(k))) {
            base.grade = Grade[Grade.MissingPredicted];
        } else if (output.hasOwnProperty(k) && !(golden.hasOwnProperty(k))) {
            base.grade = Grade[Grade.MissingGolden];
        } else if (golden[k] == output[k]) {
            base.grade = Grade[Grade.CaseInsensitiveMatch];
        } else {
            const fuse = new Fuse([golden[k]], { includeScore: true });
            const res = fuse.search(output[k], { limit: 1 })
            if (res.length > 0 && res[0].hasOwnProperty("score") && res[0].score! < FUZZY_MATCH_THRESHOLD) {
                base.grade = Grade[Grade.FuzzyMatch];
                base.explanation = `Fuzzy Match score of ${res[0].score} (threshold is ${FUZZY_MATCH_THRESHOLD})`
            } else {
                // TODO: give some explanation for why no fuzzy match.
                base.grade = Grade[Grade.FuzzyNoMatch];
            }
        }
        diff.diffs[k] = base;
    }
    return diff
}

function parseModelGrade(input: string): string {
    let grade = GRADE_MAP.get(input.toUpperCase());
    if (grade === undefined) {
        return Grade[Grade.Unspecified];
    }
    return Grade[grade];
}

async function compareModelGradedFields(golden: Incentive, output: Incentive): Promise<Diff> {
    let lastMessage: string = `Expert:
    ${JSON.stringify(golden)}
    
    Student:
    ${JSON.stringify(output)}`

    // return [queryGpt(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]]), queryPalm(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]])];
    let resp = await queryGpt(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]]);
    let diff: Diff = { diffs: {} };
    try {
        let parsed = JSON.parse(resp);
        for (const key in parsed) {
            if (key === "extra_keys") {
                diff.extra_keys = parsed[key];
            } else {
                diff.diffs[key] = {
                    golden: golden[key],
                    predicted: output[key],
                    grade: parseModelGrade(parsed[key].grade),
                    explanation: parsed[key].explanation,
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
    return diff;
}

function getFieldSubsetFromObject(input: Incentive, allowed: string[]): Incentive {
    return Object.fromEntries(Object.entries(input).filter(([key, _]) => allowed.includes(key)));
}

async function compareIncentives(golden: Incentive, output: Incentive): Promise<Diff> {
    let fuzzyDiffs = compareFuzzyFields(getFieldSubsetFromObject(golden, FUZZY_MATCH_FIELDS), getFieldSubsetFromObject(output, FUZZY_MATCH_FIELDS))
    let modelDiffs = await compareModelGradedFields(getFieldSubsetFromObject(golden, MODEL_GRADED_FIELDS), getFieldSubsetFromObject(output, MODEL_GRADED_FIELDS))
    modelDiffs.diffs = { ...modelDiffs.diffs, ...fuzzyDiffs.diffs };
    return modelDiffs;
}

async function compareData(key: string, golden_data: Incentive[], output_data: Incentive[]): Promise<Diff[]> {
    let diffs: Diff[] = [];

    if (golden_data.length != output_data.length) {
        console.log("Golden and output data are different lengths; comparison not supported");
    } else {
        for (let i = 0; i < golden_data.length; i++) {
            let diff = await compareIncentives(golden_data[i], output_data[i]);
            diff.filename = key;
            diff.order = i;
            diffs.push(diff);
        }
    }
    return diffs;
}

function createReport(diffs: Diff[]) {
    // Transform to keyed by... key
    // Ignore extra_keys
    // Basically sum across all diffs by key
    // Eventually want a record 
    let keyFrequencies: Map<string, Map<string, number>> = new Map();
    for (const diff of diffs) {
        for (const key in diff.diffs) {
            if (key === "extra_keys") continue;
            if (keyFrequencies.get(key) === undefined) {
                keyFrequencies.set(key, new Map<string, number>());
            }
            let freq = keyFrequencies.get(key)!;
            let grade = diff.diffs[key].grade!;
            freq.set(grade, 1 + (freq.get(grade) ?? 0))
        }
    }
    let output: object[] = [];
    keyFrequencies.forEach((val, key) => {
        let obj: { [key: string]: any } = {};
        val.forEach((count, grade) => {
            obj[grade] = count;
        })
        obj["column"] = key;
        output.push(obj);
    });
    return output;
}

async function main() {
    const opts = program.opts();

    const golden_files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, opts.golden_folder));
    const output_files = await fs.readdir(path.join(OUTPUT_FILE_BASE, opts.output_folder));

    let unmatched_golden_files: string[] = [];
    let unmatched_output_files: string[] = [];
    let seenOutputFiles = new Set<string>();

    let promises: Promise<void>[] = [];
    let diffs: Diff[] = [];
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

        let promise = compareData(golden_file, golden_data, JSON.parse(output_data)).then((diff) => {
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

        let fields: string[] = ["column"];
        for (const grade in Object.keys(Grade).filter((v) => isNaN(Number(v)))) {
            fields.push(Grade[grade]);
        }
        console.log(fields);
        const parser = new AsyncParser({ fields: fields });
        let report = createReport(diffs);

        const csv = await parser.parse(report).promise();
        fs.writeFile(path.join(OUTPUT_FILE_BASE, `${opts.diff_file}_report.csv`), csv);
    })
}

main()