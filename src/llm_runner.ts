import { AsyncParser } from '@json2csv/node';
import { program, Option, OptionValues } from 'commander';

import fs from 'node:fs/promises';
import path from 'node:path';

import { INCENTIVES_FILE_BASE, OUTPUT_FILE_BASE, OUTPUT_SUBDIR, CSV_OPTS } from './constants.js';
import { SYSTEM, EXAMPLE_1_RESPONSE, EXAMPLE_1_USER, EXAMPLE_2_RESPONSE, EXAMPLE_2_USER } from "./prompt.js"

import { queryPalm } from "./palm_wrapper.js";
import { GptWrapper } from "./gpt_wrapper.js";
import { Metadata } from "./metadata.js"
import { generateHomeownerRenterField } from './post_processing/homeowner_renter.js';
import { cleanupEnumFields } from './post_processing/cleanup_enum_fields.js';


program
  .requiredOption("-f, --folders <folders...>", "Name of folder(s) under incentives_data/ where text data is located.")
  .option("-r, --restrict <restrict_files...>", 'Will process only the files supplied. Useful for re-dos. Give the full path including INCENTIVES_FILE_BASE')
  .option("-o, --output_file <file>", 'Name of output file. Saved in the out/ directory.', "output.csv")
  .option("-w, --wait <duration_ms>", "How long to wait in ms between requests to avoid rate limiting")
  .addOption(new Option("-m, --model_family <model_family>", 'Name of model family to use for queries').choices(['gpt4', 'gpt', 'palm']).default('palm'));

program.parse();


async function retrieveMetadata(folder: string, file: string): Promise<Metadata> {
  const metadata_file = path.parse(file).name + "_metadata.json"
  let contents: string = ""
  try {
    contents = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, metadata_file), { encoding: 'utf8' })
    const metadata: Metadata = JSON.parse(contents)
    return metadata
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.log(`Error parsing metadata in ${metadata_file}: contents are ${contents}; error is ${err}`)
    } else {
      console.log(`No metadata file found: ${path.join(INCENTIVES_FILE_BASE, folder, file)}`);
    }
    return {}
  }
}

function getParamsForLogging(opts: OptionValues) {
  return {
    model: opts.model_family,
    system: SYSTEM,
    examples: [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE], [EXAMPLE_2_USER, EXAMPLE_2_RESPONSE]]
  }
}

async function main() {
  const opts = program.opts();

  const promises: Promise<void>[] = [];
  const output: object[] = [];
  const metadata_fields: Set<string> = new Set<string>();

  const runId = Date.now().toString()

  await fs.mkdir(path.join(OUTPUT_FILE_BASE, runId));
  await fs.writeFile(path.join(OUTPUT_FILE_BASE, runId, "parameters.json"), JSON.stringify(getParamsForLogging(opts)), {
    encoding: "utf-8",
    flag: "w"
  });

  await fs.mkdir(path.join(OUTPUT_FILE_BASE, runId, OUTPUT_SUBDIR));
  const droppedFiles: string[] = [];
  for (const folder of opts.folders) {
    await fs.mkdir(path.join(OUTPUT_FILE_BASE, runId, OUTPUT_SUBDIR, folder)).catch(err => {
      if (err.code !== 'EEXIST') {
        console.log(err);
      }
    });
    const files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, folder));
    for (const file of files) {
      if (!file.endsWith(".txt")) continue;
      if (opts.restrict && !(opts.restrict.includes(path.join(INCENTIVES_FILE_BASE, folder, file)))) {
        continue;
      }
      const txt = (await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, file), { encoding: 'utf8' })).trim();
      if (txt.length == 0) {
        console.log(`Skipping ${path.join(folder, file)} because it is empty`)
        continue;
      }

      const metadata = await retrieveMetadata(folder, file);
      for (const field in metadata) {
        metadata_fields.add(field);
      }
      if (metadata.tags !== undefined && metadata.tags.includes("index")) {
        console.log(`Skipping ${path.join(folder, file)} because we detected an index tag`)
        continue;
      }

      if (opts.wait) {
        await new Promise(f => setTimeout(f, +opts.wait))
      }

      console.log(`Querying ${opts.model_family} with ${path.join(INCENTIVES_FILE_BASE, folder, file)}`)
      const gpt_wrapper = new GptWrapper(opts.model_family)
      const queryFunc = opts.model_family == 'palm' ? queryPalm : gpt_wrapper.queryGpt.bind(gpt_wrapper)
      const promise = queryFunc(txt, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE], [EXAMPLE_2_USER, EXAMPLE_2_RESPONSE]]).then(async msg => {
        if (msg == "") return;
        console.log(`Got response from ${path.join(INCENTIVES_FILE_BASE, folder, file)}`)
        try {
          let records = JSON.parse(msg);
          if (!(Symbol.iterator in Object(records))) {
            records = [records]
          }

          let incentive_order_key = 0;
          const file_records: object[] = []
          let combined: object = {};
          for (const record of records) {
            cleanupEnumFields(record)
            generateHomeownerRenterField(record)

            if (!('folder' in metadata)) {
              metadata['folder'] = folder;
            }
            metadata['file'] = file; // For debugging.
            metadata['order'] = incentive_order_key;
            combined = { ...record, ...metadata };
            output.push(combined);
            file_records.push(combined)
            incentive_order_key += 1;
          }
          await fs.writeFile(path.join(OUTPUT_FILE_BASE, runId, OUTPUT_SUBDIR, folder, file.replace(".txt", "_output.json")), JSON.stringify(file_records, null, 2), {
            encoding: "utf-8",
            flag: "w"
          })
        } catch (error) {
          console.error(`Error parsing json: ${error}, ${msg}`);
          droppedFiles.push(path.join(INCENTIVES_FILE_BASE, folder, file))
        }
      });
      promises.push(promise);
    }
  }

  await Promise.allSettled(promises).then(async () => {
    for (const field of metadata_fields) {
      // Metadata fields go in front.
      CSV_OPTS.fields.unshift(field);
    }

    const parser = new AsyncParser(CSV_OPTS);
    const csv = await parser.parse(output).promise();
    await fs.writeFile(path.join(OUTPUT_FILE_BASE, runId, opts.output_file), csv);
    if (droppedFiles.length > 0) {
      await fs.writeFile(path.join(OUTPUT_FILE_BASE, runId, "dropped_files.json"), JSON.stringify(droppedFiles));
    }
    console.log(`Find your results with run ID ${runId} at ${path.join(OUTPUT_FILE_BASE, runId)}`)

  })
}

main()