# Using LLM Runner

## Overview

An LLM should be used as a first pass at incentive data, as it **will** make mistakes that a human would not make. Nonetheless, it should save a significant amount of time for incentives data gathering, because:

1. humans are much better at reviewing existing text than populating it themselves
2. the model can work at impressive scale
3. the model is correct somewhere around 75-80% percentage of the time, depending on how you measure it

There are parts of this process that are still pretty manual/painful; the good news is that you have to do them once and then you can run multiple LLM iterations over the data easily.

## Steps

## Summary

At a high-level, using the LLM has the following steps:

1. one-time onboarding/setup
2. (manual) collecting _where_ the data that you want to collect is – that is, the URLs
3. (mostly automated) retrieving and curating web content
4. (automated) pass the data through the LLM
5. (manual) review

If doing a state refresh, the steps are the largely the same, except that #2 is likely taken care of for you.

### Setup

1. This assumes you have node, yarn, typescript installed.
2. Clone the repo and run `yarn` to install dependencies.
   1. For GPT models, ask an account owner (most Incentive API devs have been invited) for an invite to our OpenAI account. Create an API key and put it in a `.env` file with `OPENAI_API_KEY=<api key>`.
      1. Compile and then run `node build/src/test_request_gpt.js`. If it works, it will print 3 jokes to the console.
   2. For Google models, ask an account owner (currently, just Dan) for an invite to our account. Download a credentials JSON file and then set `export GOOGLE_APPLICATION_CREDENTIALS=<path/to/credentials/file>` from the command-line.
      1. Compile and then run `node build/src/test_request_palm.js`. If it works, it will print 3 jokes to the console.
3. Congrats, you've sent your first request(s) to an LLM!
4. Download `Xpdf command line tools` from https://www.xpdfreader.com/download.html. This will be used later during the text generation step.
5. If you're planning on doing semi-automated text retrieval (recommended), download an html-to-text converter. If you're on Mac, you can skip this step, as Mac comes with one already installed (`textutil`). If you're retrieving the text manually skip this step. 


### URL Collection

Collect a list of all of the URLs you want to retrieve incentives content from. For each row in the [Tier 1 data sheet](https://docs.google.com/spreadsheets/d/19CmS4HbFEfL2DzXcyXMiz_uI8fqxpeUkHbKWnq5sviE/edit#gid=0), you may end up with multiple URLs. The URLs in the Tier 1 sheet are like program URLs that introduce the program; what you care about for this process is the actual data source URL(s), since you're going to `curl` them. This works best if the URLs are as specific about individual incentives as possible, so make sure to click through to individual incentive pages rather than summary pages if they exist. The pages we're trying to collect should contain all the detail that might appear in the captured incentive. Note that the tier 1 spreadsheet is usually complete but might be missing some programs, for example city-level programs in major cities. Check around for those. Unfortunately, this part is manual and it can take a while – up to a couple hours for larger states.

Note that if you are doing a refresh of a state, you likely have the URLs already – they should be in the existing data in the `Data Source URL(s)` columm (or similar).

To use the URLs in the rest of the process, create a Google sheet with each URL you want to visit on a different line. You can include arbitrary metadata as well that isn't found on the website itself, such as the Authority and Program names, other URLs, etc. There is also a rudimentary `tags` column – the only tag currently used is `index` for websites that don't contain incentive information themselves, but contain links to other pages that do. We collect these to eventually enable change detection on those sites. In any case, feel free to define your own tags if helpful. Example spreadsheet is [here](https://docs.google.com/spreadsheets/d/1ycS542inm4Ntn_fvayyq9x5wqFKTulcoSKj8CVVkQHw/edit#gid=416315587).

The only requirement is that this file **must** contain a `folder` column that corresponds to the folder you will create in the repo where your data will live. The URL column doesn't actually matter since the next script won't read it directly. Create a folder called `in/` in the root directory, then download as CSV and put it in the `in/` folder.

Create a new state folder (or more generally, any new folder) under `incentives_data/`, using the `<folder>` value you put in the sheet above.

Compile and then run `node build/src/create_metadata_files.js -i <your_input_file.csv>`. This will create a bunch of metadata files in `incentives_data/<folder>` that will be used to propagate the metadata you included above. It will also assign each row a numeric ID and use that as the basis for filenames; e.g. the first non-header row in your spreadsheet is associated with `0.txt` and `0_metadata.json`.

### Text generation

Now we have to create text data for the LLM model to use to produce incentive data. The text data is basically what you would see on a website that describes the incentive (or a large set of incentives).

The current file structure is that the LLM looks for all `.txt` files in a given folder and for each, it queries the model. The model request is a common prompt with the text from the text file appended at the end. It then combines the results into a large spreadsheet. If you want, you can do this as a purely manual process and simply feed in arbitrary text files, or use a semi-automated approach.

#### Manual Text Retrieval

If grabbing the text data manually, run: `for i in {0..23}; do touch $i.txt; done` (replacing `23` based on the number of text files you need to create). If using the automated approaches below, skip this step.

#### Semi-Automated Text Retrieval (Recommended)

TODO: put as much of this in a bash script as is feasible.

1. Use `curl` to fetch webpage content. In your metadata spreadsheet that has the filename numbers associated with each row (add a column for this if not done already), add another column with the formula: `=G2&" -o "&H2&".html"`, changing `G2` and `H2` to point to the URL column and the file number, respectively. At the bottom, add `="curl "&textjoin(" ",true,I2:I89)` (replacing the range with the column you just created) to get the `curl` command you need to run. Run this _from the destination folder_ and it will sequentially pull the raw HTML data from the web and save it into `.html` files.
2. Find any PDFs in the previous step and rename the extension to `.pdf` instead of `.html`. This can be done manually or with a bit of Google sheets magic.
3. Figure out where the `pdftotext` script lives (this is the Xpdf command line tools you installed during setup).
4. Run: `find *.pdf -exec bash -c '<path/to>/pdftotext -layout "$0" "${0%.*}.txt"' {} \;`. This finds all PDFs in the current folder, runs the pdftotext script on them, and saves the result in a text file with the same name (e.g. `1.pdf` gets parsed into `1.txt`).
5. Use a html-to-text converter to convert the `.html` files to text. For Mac, there is already something available called `textutil`. Linux might need to look at something else. Run the command with something like: `find *.html -exec bash -c 'textutil -convert txt "$0" -output "${0%.*}.txt"' {} \;`.

#### Text Generation Review

At this point, you should have a `.txt` for every URL. 

1. Go through the text files and ensure that each one is populated. Occasionally websites are Javascript-oriented so the HTML doesn't have any meaningful text to extract. If that's the case, pull down any text that is relevant to the incentives on that page, and put it in the text file. 
2. Clean up the txt files. That could be removing text from the beginning or end that isn't incentive-related, cleaning up tables that didn't parse well, etc. You might need to open the original website or PDF in some cases (there are typically extensions for your code editor so you can do these side-by-side). You also may want to delete any incentives from the txt files that we don't care about (i.e., refrigerator, etc).

If you don't want to send a particular row to the LLM for any reason, just clear out the text or delete the file. You can also add `index` to the `tags` field of the metadata CSV (or metadata file) as described above.

### Sending the data to the LLM

Whether achieved manually or partially automated, you should now have a bunch of text files in a folder under `incentives_data/` containing the text from the websites that is in a state where a human or AI would have a decent shot of extracting meaningful information from it.

1. Compile and then run the script from the root directory: `node build/src/llm_runner.js --folders=<name of folder with text data>`. Run `node build/src/llm_runner.js --help` for details on other flags. We use the PaLM model by default, but this can be controlled with the `--model_family` or `-m` parameter. Note that while supplying `gpt` or `palm` (default) are relatively cheap, `gpt4` is more expensive, so you can have real monetary consequences if you're not careful.
   1. For the next few steps, start by using `palm` or `gpt` until you're able to generate output files without errors.
   2. Once the files are ready for the final run, you can use `gpt4`. Check https://platform.openai.com/usage to ensure that costs are not getting too high.
2. It will take a few minutes. Apparently there are periodic cases where the API times out after 10 minutes, but these are rare. There's also the potential for rate-limiting, so if you have lots of files, use the `--wait` parameter (in milliseconds) to put some time in between each request. Usually a couple seconds is fine.
3. The script writes outputs to a specific subfolder with a RunID in the `out/` directory. The script will print your RunID, though it's timestamp-based and should be the most recent one. In that folder, you should see:
   1. An `output.csv` containing the parsed data
   2. An `outputs/` directory containing all the JSON associated with each input file
   3. A `parameters.json` file saving the details of the run so we can figure out what worked and what didn't
   4. Possibly, a `dropped_files.json` which will list any files that had errors to retry. You'll fix those in the next step.
4. If there are any files in `dropped_files.json`, review and fix them. You can rerun these by passing the same command as before with the `-r` flag (e.g. `-r incentives_data/ca/31.txt incentives_data/mn/17.txt`) to restrict the run just to certain text files. The most common cause of error is that the LLM models have limits on the length of their output, ~4k characters for GPT and ~8k characters for PaLM. If this is the case, you'll see some `Error parsing json: SyntaxError: Unexpected token` or similar errors in the console, because the output is being cutoff resulting in malformed JSON. To fix this you can either:
   - Review the input txt files and delete any irrelevant incentives, if there are any
   - Split up the txt files into `1.1.txt`, `1.2.txt`, etc

### Reviewing the output

This data should be considered a rough first pass. You'll end up making a lot of changes, but it should still save time.

We have a doc that describes recommended post-processing steps here: https://docs.google.com/document/d/1pCIBaYrSiT9ufA9tVqPpZlrbjNGrvZd9ZfItEjjyvJc.

After running through the steps in that doc and thoroughly checking the incentives, finally run the [spreadsheet-to-json script](https://github.com/rewiringamerica/api.rewiringamerica.org/blob/main/scripts/README.md#spreadsheet-to-json) and fix any errors.

## Evals

We have a basic eval framework set up to evaluate how a model is performing. This is not something you can do with data recently collected; you need to have a golden dataset that is considered correct.

This requires some file setup:

1. In each folder in `incentives/data` that you want to evaluate, you need golden files with suffix `_golden.json`, e.g. `1_golden.json` is the golden file for `1.txt`. These are JSON files that contain the incentives as they _should_ appear; in other words, the answer key.

2. Then execute a model run as described in the previous section, retaining the RunID. Run `node build/src/run_evals.js -r <run_id>` to run your eval. You'll see a `diffs.json` and `report.csv` in the `out/<run_id>` folder now, containing the "raw" diffs and then a summary report.

3. To interpret the output: we grade every key (field) that the model is requested to produce. For all keys, we first investigate whether it is missing in both the golden and predicted (model-produced) output, missing in only one, or populated in both. If populated in both, we compare the two. For all fields, we start by looking for an case-insensitive match. If we don't find it, for shorter fields, we'll use a fuzzy matching algorithm, and for longer ones, we actually send it back to the model to grade its own response! The fuzzy match is binary (FuzzyMatch or FuzzyNoMatch), but the model grading has four levels to give a bit more nuance in the answer.

The `diffs.json` files have a field-by-field comparison including an explanation of why the field was given the grade that it was (for model-graded fields). The `report.csv` rolls this up so you just see the totals by key and grade.

### Eval Caveats

1. We only have the ability to compare two JSON files with the same number of incentives in the same order right now, so in practice, it's typically best to use an artificial test set specifically constructed for this purpose. In the longer term, it would be nice to be able to construct diffs that are aware if the model (or golden) is missing incentives.

2. LLMs are not deterministic. In practice, this isn't a major issue for GPT3.5 and PaLM 2 – they are deterministic enough so that the metrics don't vary much between runs. For GPT4, I recommend you run at least 3 trials and inspect how similar the numbers are before being confident you're seeing a meaningful change.
