# Using LLM Runner

## Overview

An LLM should be used as a first pass at incentive data, as it **will** make mistakes that a human would not make. Nonetheless, it should save a significant amount of time for incentives data gathering, because:

1) humans are much better at reviewing existing text than populating it themselves
2) the model can work at impressive scale
3) the model is correct somewhere around 75% percentage of the time, depending on how you measure it

There are parts of this process that are still pretty manual/painful; the good news is that you have to do them once and then you can run multiple LLM iterations over the data easily.

## Steps

### API Onboarding
1. This assumes you have node, npm, typescript installed.
1. Clone the repo and run `npm install` to install dependencies.
   1. For GPT models, ask an account owner (most Incentive API devs have been invited) for an invite to our OpenAI account. Create an API key and put it in a `.env` file with `OPENAI_API_KEY=<api key>`.
      1. Compile with `tsc`, then run `node build/test_request_gpt.js`. If it works, it will print 3 jokes to the console.
   2. For Google models, ask an account owner (currently, just Dan) for an invite to our account. Download a credentials JSON file and then set `export GOOGLE_APPLICATION_CREDENTIALS=<path/to/credentials/file>` from the command-line.
      1. Compile with `tsc`, then run `node build/test_request_palm.js`. If it works, it will print 3 jokes to the console.
2. Congrats, you've sent your first request(s) to an LLM!

### Data Creation
Now we have to create text data for the LLM model to use to produce incentive data. The text data is basically what you would see on a website that describes the incentive (or a large set of incentives).

The current structure is that the LLM looks for all `.txt` files in a given folder and for each, it queries the model. The model request is a common prompt with the text from the text file appended at the end. It then combines the results into a large spreadsheet. If you want, you can do this as a purely manual process and simply feed in arbitrary text files. The following workflow is intended to reduce some of the manual work.

1. Create a new state (or more generally, a new folder) under `incentives_data/`.
2. For each row in the Tier 1 data sheet, you may need to split it into multiple rows based on all of the websites you need to visit. The Tier 1 sheet URL is more like the program URL; what you probably care about for this process is the actual data source URL(s) and the text on each page. Create a Google sheet with each URL you want to visit; this file **must** also contain a `folder` column that corresponds to the folder you just created where your data will live. Download as CSV.
3. Run `node build/create_metadata_files.js -i <your_input_file.csv>`. This will create a bunch of metadata files that will be used to propagate any useful metadata, like the URL, Authority Name, etc. It will also assign each row a number and use that as the basis for filenames; e.g. the first non-header row in your spreadsheet is associated with `0.txt` and `0_metadata.json`.
   1. If grabbing the data manually, run: `for i in {0..23}; do touch $i.txt; done` (replacing `23` based on the number of text files you need to create). If using the automated approaches below, skip this step.
4. Populate the text files – this is the part of the data that contains the incentive information. There are two approaches you can take: either go manually, copy-pasting from the internet, or try some of the automation steps below. The good news is that once you've done this step, you can do as many LLM runs as are needed if the schema changes, you want to change the prompt, etc. Don't sweat this process and err on the side of capturing too much rather than too little – we can always trim this down later.
   1. Use `curl` to fetch webpage content. In your metadata spreadsheet that has the filename numbers associated with each row (add a column for this if not done already), add another column with the formula: `=G2&" -o "&H2&".html"`, changing `G2` and `H2` to point to the URL column and the file number, respectively. At the bottom, add `="curl "&textjoin(" ",true,I2:I89)` (replacing the range with the column you just created) to get the `curl` command you need to run. Run this *from the destination folder* and it will sequentially pull the raw HTML data from the web and save it into `.html` files.
   2. Find any PDFs in the previous step and rename the extension to `.pdf` instead of `.html`. This can be done manually or with a bit of Google sheets magic.
   3. Download `Xpdf command line tools` from https://www.xpdfreader.com/download.html. Figure out where the `pdftotext` script lives.
   4. Run: `find *.pdf -exec bash -c '<path/to>/pdftotext "$0" "${0%.*}.txt"' {} \;`. This finds all PDFs in the current folder, runs the pdftotext script on them, and saves the result in a text file with the same name (e.g. `1.pdf` gets parsed into `1.txt`).
   5. Use a html-to-text converter to convert the `.html` files to text. For Mac, there is already something available called `textutil`. Linux might need to look at something else. Run the command with something like: `find *.html -exec bash -c 'textutil -convert txt "$0" -output "${0%.*}.txt"' {} \;`.
   6. At this point, you should have a `.txt` for every URL. Go through the text files and clean them up. You might need to open the original website or PDF in some cases (there are typically extensions for your code editor so you can do these side-by-side).
     1. Whether in PDF or HTML format, tables are probably not going to be understood by an LLM. For these, change the format so it makes more sense in text format (or just flag these to revise by hand).
     2. If you don't want to send a particular row to the LLM for any reason, just clear out the text or delete the file. An example might be for websites that are jumping off points for the pages that actually contain the incentives.
 5. Whether achieved manually or partially automated, you should now have a bunch of text files in a folder under `incentives_data/` containing the text from the websites that is in a state where a human or AI would have a decent shot of pulling information from it. And you should have a naming convention that allows you to associate the file created with the Tier 1 row it eventually needs to belong to.

### Sending the data to the LLM
1. Compile if necessary with `tsc`.
2. Run the script: `node build/llm_runner.js --folder=<name of folder with text data>`. Run `node build/llm_runner.js --help` for details on other flags. We use the PaLM model by default, but this can be controlled with the `--model_family` or `-m` parameter.
3. It will take a few minutes. Apparently there are periodic cases where the API times out after 10 minutes, but these are rare. We will run into rate limits if you send more than ~40 requests at once, so if you have lots of files, use the `--wait` parameter (in milliseconds) to put some time in between each request. Usually a couple seconds is fine.
4. The script writes outputs a specific run subfolder in the `out/` directory. The script will print your RunID, though it's timestamp-based, so should be the most recent one. In that folder, you should see:
   1. An `output.csv` containing the parsed data
   2. An `outputs/` directory containing all the JSON associated with each input file
   3. A `parameters.json` file saving the details of the run so we can figure out what worked and what didn't
   4. Possibly, a `dropped_files.json` which will list any files that had errors to retry. You can rerun these by passing the same command as before with the `-r` flag (e.g. `-r incentives_data/ca/31.txt incentives_data/mn/17.txt`) to restrict the run just to certain text files.

### Post-processing the data
This data should be considered a rough first pass. You'll end up making a lot of changes, but it should still save time.

We have a doc that describes recommended post-processing steps here: https://docs.google.com/document/d/1pCIBaYrSiT9ufA9tVqPpZlrbjNGrvZd9ZfItEjjyvJc.

## Evals

We have a basic eval framework set up to evaluate how a model did. This requires some file setup:

1. In each folder in `incentives/data` that you want to evaluate, you need golden files with suffix `_golden.json`, e.g. `1_golden.json` is the golden file for `1.txt`. These are JSON files that contain the incentives as they *should* appear. 

2. Then execute a model run as described above, retaining the RunID. Run `node build/run_evals.js -r <run_id>` to run your eval. You'll see a `diffs.json` and `report.csv` in the `out/<run_id>` folder now, containing the "raw" diffs and then a summary report.

3. Interpreting the output: we grade every key (field) that the model is requested to produce. For all keys, we first investigate whether it is missing in both the golden and predicted (model-produced) output, missing in only one, or populated in both. If populated in both, we compare the two. For all fields, we start by looking for an case-insensitive match. If we don't find it, for shorter fields, we'll use a fuzzy matching algorithm, and for longer ones, we actually send it back to the model to grade its own response! The fuzzy match is binary (FuzzyMatch or FuzzyNoMatch), but the model grading has four levels to give a bit more nuance in the answer.

The `diffs.json` files have a field-by-field comparison including an explanation of why the field was given the grade that it was (for model-graded fields). The `report.csv` rolls this up so you just see the totals by key and grade.

### Eval Caveats
1. We only have the ability to compare two JSON files with the same number of incentives in the same order right now, so in practice, it's typically best to use an artificial test set specifically constructed for this purpose.

2. LLMs are not deterministic. In practice, this isn't a major issue for GPT3.5 and PaLM 2 – they are deterministic enough so that the metrics don't vary much between runs. For GPT4, I recommend you run at least 3 trials and inspect how similar the numbers are before being confident you're seeing a meaningful change.