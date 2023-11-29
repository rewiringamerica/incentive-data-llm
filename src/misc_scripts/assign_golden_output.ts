import { program } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');
import { parse } from 'csv-parse/sync';




program
  .requiredOption("-f, --folders <folders...>", 'Path to folders with metadata that will be used to build the map.')
  .requiredOption("-g, --golden_file <file>", 'Path to golden file containing finalized state data.');

program.parse();

const DATA_URL_METADATA = "Associated URL";
const DATA_URL_GOLDEN = "Data Source URL(s)";
const AUTHORITY_NAME = "Authority (Name)*";
const INCENTIVES_FILE_BASE = "incentives_data/";


async function main() {
  const opts = program.opts();

  const fileMap = new Map();
  for (const folder of opts.folders) {
    const files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, folder));
    for (const file of files) {
      if (!file.endsWith("_metadata.json")) continue;
      const metadata = JSON.parse(await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, file), { encoding: 'utf8' }));
      if (!(DATA_URL_METADATA in metadata)) continue;
      const filename_prefix = file.substring(0, file.length - 14); // 14 = length of _metadata.json
      fileMap.set(metadata[DATA_URL_METADATA], path.join(INCENTIVES_FILE_BASE, folder, filename_prefix));
    }
  }

  const golden_data = await fs.readFile(opts.golden_file, { encoding: 'utf8' });
  const records = parse(golden_data, {
    columns: true,
    delimiter: ','
  });

  const duplicateAuthorityChecker = new Map();
  const errors = new Set();
  const outputMap = new Map();
  for (const record of records) {
    if (!(DATA_URL_GOLDEN in record)) {
      console.log(record.keys)
      throw Error(`Input file must contain a column named ${DATA_URL_GOLDEN} in record. Keys: ${record.keys}`)
    }
    if (!(AUTHORITY_NAME in record)) {
      throw Error(`Input file must contain a column named ${AUTHORITY_NAME} in record: ${record}`)
    }
    const url = record[DATA_URL_GOLDEN];
    if (url.includes(",") || url.includes("\n")) {
      errors.add(`Multiple URLs detected: not supported right now: ${url}`);
      continue;
    }

    const filename_prefix = fileMap.get(url);
    if (filename_prefix === undefined) {
      errors.add(`Didn't find filename for URL: ${url}`);
      continue;
    }
    if (duplicateAuthorityChecker.get(url) === undefined) {
      duplicateAuthorityChecker.set(url, record[AUTHORITY_NAME]);
    } else if (duplicateAuthorityChecker.get(url) != record[AUTHORITY_NAME]) {
      errors.add(`Multiple Authorities using the same URL leads to difficult assigning records to inputs. Details: url: ${url}, first authority: ${duplicateAuthorityChecker.get(url)}, second authority: ${record[AUTHORITY_NAME]}, filename: ${filename_prefix}\n`);
    }

    if (outputMap.get(filename_prefix) === undefined) {
      outputMap.set(filename_prefix, []);
    }

    const objWithoutBlankFields = Object.fromEntries(Object.entries(record).filter(([, v]) => v !== ""));
    outputMap.get(filename_prefix).push(objWithoutBlankFields);
  }

  for (const [file, data] of outputMap) {
    await fs.writeFile(file + "_golden.json", JSON.stringify(data, null, 2), {
      encoding: "utf-8",
      flag: "w"
    })
  }

  for (const err of errors) {
    console.log(err);
  }
}

main()