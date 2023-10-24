import { AsyncParser } from '@json2csv/node';
import { program } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');
import { parse } from 'csv-parse/sync';




program
    .requiredOption("-i, --input_file <file>", 'Path to input file that describes the text files that need to be created.');

program.parse();


const INCENTIVES_FILE_BASE = "incentives_data/";

async function main() {
    const opts = program.opts();

    const metadata = await fs.readFile(opts.input_file, { encoding: 'utf8' });
    const records = parse(metadata, {
        columns: true,
        delimiter: ','
    });
    let filecount = 0
    for (const record of records) {
        if (!("folder" in record)) {
            throw Error(`Input file must contain a 'folder' column indicating the name of the folder in which to produce the metadata file: ${record}`)
        }
        const folder = record["folder"];
        const filename = ("filename" in record) ? record["filename"] : `${filecount}.txt`;
        const metadata_filename = path.parse(filename).name + "_metadata.json";

        await fs.writeFile(path.join(INCENTIVES_FILE_BASE, folder, metadata_filename), JSON.stringify(record), {
            encoding: "utf-8",
            flag: "w"
        });
        filecount += 1
    }
}

main()