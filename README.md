# Using GPT Runner

## Overview

GPT should be used as a first pass at incentive data, as it **will** make mistakes that a human would not make. The value is primarily being able to do it at scale, since there is some cleanup that you'll want to do with the results, and some of the steps take roughly the same amount of time if you're doing them for 10 rows vs 500. If you prefer, you can steal the prompt and feed smaller batches of text to the actual ChatGPT model at chat.openai.com, though you still will have to pay the cleanup penalty eventually.

There are parts of this process that are still pretty manual/painful; the good news is that you have to do them once and then you can run multiple GPT iterations over the data easily.

## Steps

### API Onboarding
1. This assumes you have node, npm, typescript installed.
1. Clone the repo and run `npm install` to install dependencies.
1. Ask an account owner (currently, just Dan) for an invite to our account. Create an API key and put it in a `.env` file with `OPENAI_API_KEY=<api key>`.
2. Compile with `tsc`, then run `node build/test_request.js`. If it works, it will print 3 jokes to the console. Congrats, you've sent your first request to a GPT model!

### Data Creation
Now we have to create text data for the GPT model to use to produce incentive data. The text data is basically what you would see on a website that describes the incentive (or a large set of incentives).

The current structure is that GPT looks for all `.txt` files in a given folder and for each, it queries the model. The model request is a common prompt with the text from the text file appended at the end. It then combines the results into a large spreadsheet. If you want, you can do this as a purely manual process and simply feed in arbitrary text files. The following workflow is intended to reduce some of the manual work.

1. Create a new state (or more generally, a new folder) under `incentives_data/`.
2. For each row in the Tier 1 data sheet, you may need to split it into multiple rows based on all of the websites you need to visit. The Tier 1 sheet URL is more like the program URL; what you probably care about for this process is the actual data source URL(s) and the text on each page. Create a Google sheet with each URL you want to visit; this file **must** also contain a `folder` column that corresponds to the folder you just created where your data will live. Download as CSV.
3. Run `node build/create_metadata_files.js -i <your_input_file.csv>`. This will create a bunch of metadata files that will be used to propagate any useful metadata, like the URL, Authority Name, etc. It will also assign each row a number and use that as the basis for filenames; e.g. the first non-header row in your spreadsheet is associated with `0.txt` and `0_metadata.json`.
   1. Then, to create the text files, run: `for i in {0..23}; do touch $i.txt; done` (replacing `23` based on the number of text files you need to create).
4. Populate the text files – this is the part of the data that contains the incentive information. There are two approaches you can take: either go manually, with a lot of copy-pasting from the internet, or try some of the automation steps below. The good news is that once you've done this step, you can do as many GPT runs as are needed if the schema changes, you want to change the prompt, etc. Don't sweat this process and err on the side of capturing too much rather than too little – we can always trim this down later.
   1. Use `curl` to fetch webpage content. In your metadata spreadsheet that has the filename numbers associated with each row (add a column for this if not done already), add another column with the formula: `=G2&" -o "&H2&".txt"`, changing `G2` and `H2` to point to the URL column and the file number, respectively. At the bottom, add `="curl "&textjoin(" ",true,I2:I89)` (replacing the range with the column you just created) to get the `curl` command you need to run. Run this *from the destination folder* and it will sequentially pull the raw HTML data from the web and save it into `.html` files.
   2. Find any PDFs in the previous step and rename the extension to `.pdf` instead of `.html`. This can be done manually or with a bit of Google sheets magic.
   3. Download `Xpdf command line tools` from https://www.xpdfreader.com/download.html. Figure out where the `pdftotext` script lives.
   4. Run: `find *.pdf -exec bash -c '<path/to>/pdftotext "$0" "${0%.*}.txt"' {} \;`. This finds all PDFs in the current folder, runs the pdftotext script on them, and saves the result in a text file with the same name (e.g. `1.pdf` gets parsed into `1.txt`).
   5. Use a html-to-text converter to convert the `.html` files to text. For Mac, there is already something available called `textutil`. Linux might need to look at something else. Run the command with something like: `find *.html -exec bash -c 'textutil -convert txt "$0" -output "${0%.*}.txt"' {} \;`.
   6. At this point, you should have a `.txt` for every URL. Go through the text files and clean them up. You might need to open the original website or PDF in some cases (there are typically extensions for your code editor so you can do these side-by-side).
     1. Whether in PDF or HTML format, tables are probably not going to be understood by GPT. For these, change the format so it makes more sense in text format (or just flag these to revise by hand).
     2. If you don't want to send a particular row to GPT for any reason, just clear out the text or delete the file. An example might be for websites that are jumping off points for the pages that actually contain the incentives.
 5. Whether achieved manually or partially automated, you should now have a bunch of text files in a folder under `incentives_data/` containing the text from the websites that is in a state where a human or AI would have a decent shot of pulling information from it. And you should have a naming convention that allows you to associate the file created with the Tier 1 row it eventually needs to belong to.

### Sending the data to GPT
1. Compile if necessary with `tsc`.
1. Run the script: `node build/gpt_runner.js --folder=<name of folder with text data>`. Run `node build/gpt_runner.js --help` for details on other flags.
1. It will take a few minutes. Apparently there are periodic cases where the API times out after 10 minutes, but these are rare. Right now we send all files in parallel to GPT because we're not operating at a level where rate limiting is a concern: we can have 3,500 requests per minute throughout our organization.
1. At the end, the script will output a CSV file into the `out/` directory.

### Post-processing the data
This data should be considered a rough first pass. You'll end up making a lot of changes, but hopefull it'll still save time.

Here are some of the post-processing steps I would recommend:
1. Pull the data into Google Sheets (File -> Import).
1. Use a vlookup to pull in any data you want from your Tier 1 list and/or your separate list of URLs. It's pretty helpful to have the URL associated with each row as a column so that you can quickly go to the page and verify information.
1. Go to anywhere amount_type is missing and populate that field.
1. For any rows with amount_type = `dollar per unit`, check the units are correct.
1. For any rows with amount_type = `percentage`, check for any rows where the field is “inverted” – e.g. right now, if the text says, “$100, not to exceed 25% of cost”, then GPT may record it as a rebate of 25% percentage rather than $100. That said, we don’t actually have a way to represent percentage-based maximums right now anyway (see [thread](https://rewiringameri-g3x1100.slack.com/archives/C05S7N7Q5GE/p1696521688127919)), so arguably keeping it as a percentage with a dollar maximum is still accurate.
1. For all other `percentage` rows, confirm that GPT hasn't missed an amount_maximum. This is easy to check by adding a column with `=REGEXEXTRACT(<cell containing program_description>,"\$[0-9,]+")`, which will flag any dollar amounts.
1. Program description – these are probably best to just skim for anything that looks awkward and try to batch-edit as much as possible.



## Limitations
1. We don't have a partial recovery if a file comes back and isn't legitimate JSON; we just drop that file (though you would get a console error so make sure to check).
1. We have no insight into the relationship between files and billing. We could pretty easily dump this information to the console so folks know how "big" their requests are and how much they are costing.
1. This is based on a naive and fairly short approach to prompt engineering – it is possible we can get much better performance with more experimentation, fine-tuning, splitting the task up, etc.