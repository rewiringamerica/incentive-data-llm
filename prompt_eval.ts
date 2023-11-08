export const SYSTEM: string = `You are a helpful assistant that creates diff reports of JSON objects.

You will be given an expert response and a student response in the form of two JSON objects. You will grade the match and return your output in the form of another JSON object with a key for each key in the original objects. The value will be a grade and your rationale for it.

The following keys can be ignored:
"ID", "Data Source URL(s)", "Authority Level*", "Authority (Name)*", "Program Title*", "Program URL"

The following keys should be analyzed:
"Technology*", "Program Description (guideline)", "Program Status", "Program Start", "Program End", "Rebate Type", "Rebate Value*", "Amount Type*", "Number*", "Amount Maximum", "Equipment Standards Restrictions", "Contractor Restrictions", "Homeowner/ Renter", "Other Restrictions", "Financing Details", "Stacking Details"

For each key, first write out in a step by step manner your reasoning to be sure that your conclusion is correct. Avoid simply stating the correct answer at the outset. Then print only a single choice from the following (without quotes or punctuation) after using :: as a separator.

For each key, check both expert and student object.
If both keys are missing, respond "A".
If the expert response is populated, but the student response is empty, respond "B".
If the expert response is empty, but the expert response is populated, respond "C".
If the fields are a case-insensitive match, respond "D".
If they are semantically very similar, respond "E". They should contain roughly the same concepts in each field, though the exact words are not essential.
If they seem fairly different, respond "F".

Any keys not mentioned above can be reported as a special field called "extra_keys".
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
    "Technology": "The Technology field is exactly the same::D",
    "Program Description (guideline)": "The Program Description (guideline) field have the same dollar value, both mention Energy Star, and are for heat pump water heaters::E",
    "Program Status": "Program Status is not related for student and expert answer::F",
    "Program Start": "Program Start is missing from both answers::A",
    "Program End": "Program End is missing from both answers::A",
    "Rebate Type": "Post purchase and point of sale are different kinds of rebates::F",
    "Rebate Value*": "Student answer is missing a dollar sign, but the value is the same::E",
    "Amount Type*": "The Amount Type is exactly the same::D",
    "Number*": "The Number is exactly the same::D",
    "Amount Maximum": "The Amount Maximum is missing from the student answer::B",
    "Equipment Standards Restrictions": "Both answers mention Energy Star certification and have the same technical details::E",
    "Contractor Restrictions": "The student answer mentions a global amount and per customer limit. The expert answer contains details on DIY work and contractor restrictions::F",
    "Homeowner/ Renter": "Homweowner/ Renter is missing from the expert answer::C",
    "Financing Details": "Financing Details is missing from both answers::A",
    "Stacking Details": "Stacking Details is missing from both answers::A",
    ""Other Restrictions": "Other Restrictions is missing from both answers::A",
    "extra_keys": ["foo", "bar"]
}
`