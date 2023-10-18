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

The current structure is that GPT looks for all `.txt` files in a supplied folder and for each, it queries the model. The model request is a common prompt with the text from the text file appended at the end. It then combines the results into a large spreadsheet. The following steps describe the common case, though there is a bit more flexibility based on the command-line arguments.

1. Create a new state (or more generally, a new folder) under `incentives_data/`.
1. Create text files containing the relevant website text. This is the part that is still time-consuming and best done in large batches. What I recommend is:
    1. For each row in the Tier 1 data sheet, you may need to actually split it into many rows based on all of the websites you need to visit. The Tier 1 sheet URL is more like the program URL; what you probably care about for this process is the actual data source URL(s) and the text on each page.
    1. For each data source URL, assign it a number so you can easily correspond it with the text file that is produced, and name the text file `<number>.txt`. I actually do this in a separate spreadsheet so I can easily vlookup information that doesn't come from the page (like Authority Name) later. In the longer-term, we can develop a better process for this so that this metadata is automatically propagated throughout the process and ends up in the spreadsheet with out additional effort.
        1. To quickly create a lot of text files, use this bash script: `for i in {1..23}; do touch $i.txt; done`.
    1. Create the text files – this is the part of the data that contains the incentive information. Right now this is a lot of copy-pasting from the internet, but once you do it once, you can do as many GPT runs as are needed if the schema changes, you want to change the prompt, etc. Don't sweat this process and err on the side of capturing too much rather than too little – we can always trim this down later.
        1. Some PDFs are terrible for copy-pasting. It might be easier to select all text in the PDF, copy it to a Google doc, and edit there.
        2. Tables are probably not going to be directly understood by GPT natively. For these, change the format so it makes more sense in text format (or just flag these to revise by hand).
        3. Deleting the text files is optional; if they are empty, we just skip over them.
    2. At the end of this process, you should have a bunch of text files in a folder under `incentives_data/` containing the text from the websites that is in a state where a human or AI would have a decent shot of pulling information from it. And you should have a naming convention that allows you to associate the file created with the Tier 1 row it eventually needs to belong to.

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