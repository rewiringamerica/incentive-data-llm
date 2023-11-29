import { program } from 'commander';
import { encoding_for_model } from "tiktoken";

import fs = require('node:fs/promises');
import path = require('node:path');

import { SYSTEM } from "../prompt.js"


program
  .option("-r, --restrict <restrict_files...>", 'Will process only the files supplied. Useful for re-dos. Give the full path including INCENTIVES_FILE_BASE')
  .requiredOption("-f, --folders <folders...>", 'Path to input folder(s) where pairs of input text and output golden files live.')
  .requiredOption("-o, --output <output_file>", 'The output file.');

program.parse();

const INCENTIVES_FILE_BASE = "incentives_data/";
const OUTPUT_FILE_BASE = "eval_data/";

function generateEvalMessages(system: string, example: [string, string]) {
  const output: { "messages": object[], } = { "messages": [] };
  const messages: object[] = []
  messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: example[0] });
  messages.push({ role: "assistant", content: example[1] });
  output["messages"] = messages
  return output
}

async function main() {
  const opts = program.opts();

  const records: string[] = [];

  const enc = encoding_for_model('gpt-3.5-turbo-1106')

  for (const folder of opts.folders) {
    const files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, folder));
    for (const file of files) {
      if (!file.endsWith(".txt")) continue;
      if (opts.restrict && !(opts.restrict.includes(path.join(INCENTIVES_FILE_BASE, folder, file)))) {
        continue;
      }

      const golden_file = path.parse(file).name + "_golden.json"
      let golden: string;
      try {
        golden = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, golden_file), { encoding: 'utf8' })
      } catch (err) {
        console.log(`No golden file found: ${path.join(INCENTIVES_FILE_BASE, folder, file)}`);
        continue;
      }

      const txt = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, file), { encoding: 'utf8' })
      const trainingExample = JSON.stringify(generateEvalMessages(SYSTEM, [golden, txt]))
      const exampleLength = enc.encode(trainingExample).length
      if (exampleLength > 4000) {
        console.log(`${path.join(INCENTIVES_FILE_BASE, folder, file)} is likely above the per-example token threshold (4,096) and may not be usable as fine-tuning data. Number of GPT 3.5 tokens not including request overhead: ${exampleLength}. Discarding it.`)
        continue
      }
      records.push(trainingExample)
    }
  }

  await fs.writeFile(path.join(OUTPUT_FILE_BASE, opts.output), records.join("\n"), {
    encoding: "utf-8",
    flag: "w"
  })
}

main()