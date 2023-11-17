import { program, Option } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');

import { queryPalm } from "./palm_wrapper.js";
import { GptWrapper } from "./gpt_wrapper.js";
import { Differ, Diff, Report } from "./differ.js";
import { INCENTIVES_FILE_BASE, OUTPUT_FILE_BASE, OUTPUT_SUBDIR } from './constants.js';

program
  .requiredOption("-r, --run_id <run_id>", 'runId where your previous run was saved.')
  .addOption(new Option("-m, --model_family <model_family>", 'Name of model family to use for model-grading').choices(['gpt4', 'gpt', 'palm']).default('palm'));


program.parse();

async function getFilesRecursive(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files: (string | string[])[] = await Promise.all(dirents.map((dirent) => {
    const res = path.join(dir, dirent.name);
    return dirent.isDirectory() ? getFilesRecursive(res) : res;
  }));
  return files.flat();
}

async function main() {
  const opts = program.opts();

  const output_files = await getFilesRecursive(path.join(OUTPUT_FILE_BASE, opts.run_id, OUTPUT_SUBDIR));

  const unmatched_golden_files: string[] = [];
  const unmatched_output_files: string[] = [];
  const seen_golden_dirs = new Set<string>();
  const seen_predicted_files = new Set<string>();

  const promises: Promise<void>[] = [];
  const diffs: Diff[] = [];
  const gpt_wrapper = new GptWrapper(opts.model_family)
  const queryFunc = opts.model_family == 'palm' ? queryPalm : gpt_wrapper.queryGpt.bind(gpt_wrapper)
  const differ: Differ = new Differ(queryFunc);

  for (const output_file of output_files) {
    if (!output_file.endsWith("_output.json")) continue;
    const shortName = output_file.replace(path.join(OUTPUT_FILE_BASE, opts.run_id, OUTPUT_SUBDIR, "/"), "")
    seen_golden_dirs.add(path.dirname(shortName))

    const matching_golden = shortName.replace("_output.json", "_golden.json")
    let golden_data: string;
    try {
      golden_data = await fs.readFile(path.join(INCENTIVES_FILE_BASE, matching_golden), { encoding: 'utf8' })
    } catch (err) {
      unmatched_output_files.push(output_file)
      continue;
    }
    if (golden_data == "") {
      unmatched_output_files.push(output_file)
      continue;
    }

    seen_predicted_files.add(shortName)
    const predicted_data = JSON.parse(await fs.readFile(path.join(output_file), { encoding: 'utf8' }))

    const promise = differ.compareData(shortName, JSON.parse(golden_data), predicted_data).then((diff) => {
      diffs.push(...diff);
    }).catch((err) => {
      console.log(`error: ${err}`);
    });
    promises.push(promise);

  }

  for (const golden_dir of seen_golden_dirs) {
    const files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, golden_dir))
    for (const file of files) {
      if (!(file.endsWith("_golden.json"))) continue
      const matching_output = path.join(golden_dir, file.replace("_golden.json", "_output.json"))
      if (!(seen_predicted_files.has(matching_output))) {
        unmatched_golden_files.push(path.join(INCENTIVES_FILE_BASE, golden_dir, file))
      }
    }
  }
  console.log("Unmatched goldens:");
  console.log(unmatched_golden_files);
  console.log("Unmatched outputs:");
  console.log(unmatched_output_files);

  await Promise.allSettled(promises).then(async () => {
    console.log(`Final diffs and report written to ${path.join(OUTPUT_FILE_BASE, opts.run_id)}`);
    await fs.writeFile(path.join(OUTPUT_FILE_BASE, opts.run_id, "diff.json"), JSON.stringify(diffs), {
      encoding: "utf-8",
      flag: "w"
    })

    const report: Report = differ.createReport(diffs);
    differ.writeReport(report, path.join(OUTPUT_FILE_BASE, opts.run_id, "report.csv"))
  })
}

main()