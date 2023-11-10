export const SYSTEM: string = `You are a helpful assistant that creates diff reports of JSON objects.

You will be given an expert response and a student response in the form of two JSON objects. You will grade the match and return your output in the form of another JSON object with a key for each key in the original objects. The value will be a JSON object containing a grade and your explanation for it.

The following keys can be ignored:
"ID", "Data Source URL(s)", "Authority Level*", "Authority (Name)*", "Program Title*", "Program URL"

The following keys should be analyzed:
"Technology*", "Program Description (guideline)", "Program Status", "Program Start", "Program End", "Rebate Type", "Rebate Value*", "Amount Type*", "Number*", "Amount Maximum", "Equipment Standards Restrictions", "Contractor Restrictions", "Homeowner/ Renter", "Other Restrictions", "Financing Details", "Stacking Details"

For each key, first write out in a step by step manner your reasoning to be sure that your conclusion is correct. Avoid simply stating the correct answer at the outset. That will be a key with name "explanation".
Then add a key named "grade" with a single choice from the following (without quotes or punctuation).

For each key, check both expert and student object.
If both keys are missing, the grade is "A".
If the expert response is populated, but the student response is empty, the grade is "B".
If the expert response is empty, but the expert response is populated, the grade is "C".
If the fields are a case-insensitive match, the grade is "D".
If they are semantically very similar, the grade is "E". They should contain roughly the same concepts in each field, though the exact words are not essential.
If they seem fairly different, the grade is "F".

An example value might be be {"explanation": "The student answer doesn't mention light bulbs, whereas the expert answer does", "grade": "F"}.

Any keys not mentioned above can be reported as a special field called "extra_keys" that simply contains the names of the keys.
`

export const EXAMPLE_1_USER: string = `
Expert:
{
    "ID": "CO-30",
    "Data Source URL(s)": "https://www.csu.org/Pages/WaterHeater.aspx",
    "Authority Level*": "Utility",
    "Authority (Name)*": "Colorado Springs Utilities",
    "Program Title*": "Residential Efficiency Rebate Program",
    "Program URL": "https://www.csu.org/Pages/WaterHeater.aspx",
    "Technology*": "Heat Pump Water Heater (HPWH)",
    "Program Description (guideline)": "Rebate up to $200 on an Energy Star certified heat pump water heater",
    "Program Status": "Active",
    "Rebate Type": "Rebate (post purchase)",
    "Rebate Value*": "$200",
    "Amount Type*": "dollar amount",
    "Number*": "200",
    "Amount Maximum": "$200",
    "Equipment Standards Restrictions": "• Uniform energy factor of 2.20 for 120V/15A.\n• Must be ENERGY STAR certified.\n",
    "Contractor Restrictions": "Work must be performed by a Colorado Contractor. Do-it-yourself work does not qualify.\n",
    "foo": "• This rebate is for retrofit applications only and does not apply to new construction.\n• Provide a Pikes Peak Regional Building Department permit number and pass inspection to qualify for the rebate\n• Must be installed according to manufacturer’s instructions, including ducting for heat exchanger airflow when recommended by\nmanufacturer.\n• Two (2) rebates available per service address every three years"
}

Student:
{
    "ID": "CO-30",
    "Data Source URL(s)": "https://www.csu.org/Pages/WaterHeater.aspx",
    "Authority Level*": "Utility",
    "Authority (Name)*": "Colorado Springs Utilities",
    "Program Title*": "Residential Efficiency Rebate Program",
    "Program URL": "https://www.csu.org/Pages/WaterHeater.aspx",
    "Technology*": "Heat Pump Water Heater (HPWH)",
    "Program Description (guideline)": "Up to $200 on an Energy Star heat pump water heater",
    "Program Status": "Paused",
    "Rebate Type": "Point of sale rebate",
    "Rebate Value*": "200",
    "Amount Type*": "dollar amount",
    "Number*": "200",
    "Equipment Standards Restrictions": "Must be ENERGY STAR-certified. UEF of 2.20 for 120V/15A.",
    "Contractor Restrictions": "Limit 1 per customer per account type. Global amount of $5,000 across all rebates. DIY work is not permitted.\n",
    "Homeowner/ Renter": "Homeowner",
    "bar": "• This rebate is for retrofit applications only and does not apply to new construction.\n• Provide a Pikes Peak Regional Building Department permit number and pass inspection to qualify for the rebate\n• Must be installed according to manufacturer’s instructions, including ducting for heat exchanger airflow when recommended by\nmanufacturer.\n• Two (2) rebates available per service address every three years"
}`

export const EXAMPLE_1_RESPONSE = `{
    "Technology": {"explanation": "The Technology field is exactly the same.", "grade": "D"},
    "Program Description (guideline)": {"explanation": "The Program Description (guideline) field have the same dollar value, both mention Energy Star, and are for heat pump water heaters", "grade": "E"},
    "Program Status": {"explanation": "Program Status is not related for student and expert answer", "grade": "F"},
    "Program Start": {"explanation": "Program Start is missing from both answers", "grade": "A"},
    "Program End": {"explanation": "Program End is missing from both answers", "grade": "A"},
    "Rebate Type": {"explanation": "Post purchase and point of sale are different kinds of rebates", "grade": "F"},
    "Rebate Value*": {"explanation": "Student answer is missing a dollar sign, but the value is the same", "grade": "E"},
    "Amount Type*": {"explanation": "The Amount Type is exactly the same", "grade": "D"},
    "Number*": {"explanation": "The Number is exactly the same", "grade": "D"},
    "Amount Maximum": {"explanation": "The Amount Maximum is missing from the student answer", "grade": "B"},
    "Equipment Standards Restrictions": {"explanation": "Both answers mention Energy Star certification and have the same technical details", "grade": "E"},
    "Contractor Restrictions": {"explanation": "The student answer mentions a global amount and per customer limit. The expert answer contains details on DIY work and contractor restrictions", "grade": "F"},
    "Homeowner/ Renter": {"explanation": "Homweowner/ Renter is missing from the expert answer", "grade": "C"},
    "Financing Details": {"explanation": "Financing Details is missing from both answers", "grade": "A"},
    "Stacking Details": {"explanation": "Stacking Details is missing from both answers", "grade": "A"},
    ""Other Restrictions": {"explanation": "Other Restrictions is missing from both answers", "grade": "A"},
    "extra_keys": ["foo", "bar"]
}
`