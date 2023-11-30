import { program } from 'commander';

import fs = require('node:fs/promises');
import path = require('node:path');

import { Metadata } from "./metadata.js"
import { INCENTIVES_FILE_BASE } from './constants.js';
import { Builder, Browser } from 'selenium-webdriver';


program
  .requiredOption("-f, --folders <folders...>", "Name of folder(s) under incentives_data/ where text data is located.")
  .option("-r, --restrict <restrict_files...>", 'Will process only the files supplied. Useful for re-dos. Give the full path including INCENTIVES_FILE_BASE')
  .option("-w, --wait <duration_ms>", "How long to wait in ms between requests to avoid rate limiting");

program.parse();


async function retrieveMetadata(folder: string, metadata_file: string): Promise<Metadata> {
  let contents: string = ""
  try {
    contents = await fs.readFile(path.join(INCENTIVES_FILE_BASE, folder, metadata_file), { encoding: 'utf8' })
    const metadata: Metadata = JSON.parse(contents)
    return metadata
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.log(`Error parsing metadata in ${metadata_file}: contents are ${contents}; error is ${err}`)
    } else {
      console.log(`No metadata file found: ${path.join(INCENTIVES_FILE_BASE, folder, metadata_file)}`);
    }
    return {}
  }
}

function isPdf(url: string, tags: string[] | undefined) {
  if (url.endsWith(".pdf")) {
    return true
  }
  if (tags !== undefined && tags.includes("pdf")) {
    return true
  }
  return false
}

async function main() {
  const opts = program.opts();

  const droppedFiles: string[] = []

  for (const folder of opts.folders) {
    const files = await fs.readdir(path.join(INCENTIVES_FILE_BASE, folder));
    for (const file of files) {
      if (!file.endsWith("_metadata.json")) continue;
      if (opts.restrict && !(opts.restrict.includes(path.join(INCENTIVES_FILE_BASE, folder, file)))) {
        continue;
      }

      const metadata = await retrieveMetadata(folder, file);
      const url = metadata["Data URL"]
      if (url === undefined) continue

      if (opts.wait) {
        await new Promise(f => setTimeout(f, +opts.wait))
      }

      console.log(`Visiting ${url} from ${path.join(INCENTIVES_FILE_BASE, folder, file)}`)
      if (isPdf(url, metadata.tags)) {
        const resp = await fetch(url)
        if (!resp.ok) {
          droppedFiles.push(path.join(INCENTIVES_FILE_BASE, folder, file))
        } else {
          const dest = path.join(INCENTIVES_FILE_BASE, folder, file.replace("_metadata.json", ".pdf"))
          fs.writeFile(dest, new DataView(await resp.arrayBuffer()))
        }
      } else {
        const driver = await new Builder().forBrowser(Browser.CHROME).build();
        await driver.manage().setTimeouts({ implicit: 5000 })
        try {
          await driver.get(url);
          const src = await driver.getPageSource()
          await fs.writeFile(path.join(INCENTIVES_FILE_BASE, folder, file.replace("_metadata.json", ".html")), src, {
            encoding: "utf-8",
            flag: "w"
          })
        } catch {
          droppedFiles.push(path.join(INCENTIVES_FILE_BASE, folder, file))
        } finally {
          await driver.quit();
        }
      }
    }
  }
  if (droppedFiles.length > 0) {
    console.log("Failed to process:")
    for (const droppedFile of droppedFiles) {
      console.log(droppedFile)
    }
  }
}

main()