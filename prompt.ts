import { ChatCompletionRequestMessage } from "openai";

const SYSTEM: string = `You are a helpful assistant. I'm going to give you a list of data fields, and then I will give you a series of passages that contain financial incentives. I want you to populate the fields in valid JSON format, with one record for each incentive.

An incentive is typically for a specific appliance or tool, like a heat pump, a battery, or a smaller tool like a snowblower. There are also free incentives like a home inspection for weatherization.

Data fields:
technology: required field. This is a enum. It should be one of the following values: Heat Pump Heating and Cooling(HVAC), HVAC - Air Source Heat Pump, Ground Source Heat Pump(GSHP) / Geothermal HP, HVAC - Air to Water Heat Pump, HVAC - Ducted Heat Pump, HVAC - Ductless Heat Pump, Heat Pump Water Heater(HPWH), New Electric Vehicle, Used Electric Vehicle, Electric Vehicle Charger, Rooftop Solar, Battery Storage, Heat Pump Dryers / Clothes Dryer, Electric Stove, Weatherization(insulation and air sealing), Electric wiring, Electric panel, Electric outdoor equipment, Smart Thermostat, E - Bike, Other

program_description: required field. a brief summary of the incentive, including the price, technology, and the most important restrictions, if any.No more than 150 characters.

program_start: a date the program started, if any

program_end: a date the program ended, if any

rebate_type: required field. This field should be one or more of Point of Sale rebate, After purchase rebate, account credit, tax credit, or assistant program(free service).If the passage instructs the user to mail in or submit an application, it is "After purchase rebate".If it says it will apply it as a credit on the utility bill, it is "account credit".

rebate_value: required field. A free-text version of the value of the rebate (e.g. $2, $500 per ton)

number: required field. Only the number of the rebate value.If the rebate_value is "$2,500", it would be 2500, and if the rebate_value is "$100 / ton", it would be 100.

amount_type: required field. This is an enum. Possible values are: "dollar amount", "percentage", or "amount per unit", depending on how the rebate_value is expressed.

unit: if the Amount type is amount per unit, then this will be the corresponding unit, such as ton, sq ft, or kilowatt

amount_minimum: minimum amount associated with the incentive, if any

amount_maximum: the maximum amount mentioned by an incentive, if any. For example, if the incentive reads "up to $50", then this would be 50.

bonus_description: description of the bonus mentioned in the incentive, if any

equipment_standards_restrictions: specifications for the efficiency of the appliance, if any

equipment_capacity_restrictions: requirements for the size or capacity of the unit

installation_restrictions: requirements for how the unit is installed, such as whether a licensed contractor is required

income_restrictions: if the customer has any restrictions on their income in order to claim the rebate

other_restrictions: for other important restrictions not covered by the above

financing: if information is given related to how to finance the project, include it here

The following are required fields and you must create an answer for them: technology, program_description, program_start, rebate_type, rebate_value, number, and amount_type.`

const EXAMPLE_USER: string = `Air Source Heat Pump Water Heater Rebate
Requirements
$350 per heating ton rebate for Air Source Heat Pump Water Heater (30 Gallon Minimum) - Must be Energy Star® rated.
A unit serving as backup for another source such as solar water heating or ground-source heat pump does not qualify.
Electric Resistance Water Heaters are no longer eligible for rebate as of January 1, 2023.
Tankless water heaters do not qualify for a rebate. 
EEA’s Rules and Regulations require you to advise EEA when making any material changes or increases in your connected load. Call EEA Energy Management Advisor at (970) 564-4450 to schedule an assessment before you purchase your new equipment. Rebates may be denied if you refuse to install required service upgrades.
To apply for rebate:
You must have an active electric account at Empire Electric to qualify for an air-source heat pump water heater rebate.
Rebate must be requested within 90 days from purchase date, no exceptions.
A detailed receipt must be submitted with application.
Rebate will be issued as a credit on your electric account. Please allow 6 to 8 weeks for your credit to appear.

Appliance rebates
Requirements
 Must have an active member account with EEA to qualify for rebate.
Application form must be completed and submitted within 90 days from purchase date, no exceptions. 
Rebate will be issued as a credit on your electric account. Please allow 6 to 8 weeks for credit to appear.

$60 - Electric Clothes Dryer.
$120 - Heat Pump Ventless Electric Clothes Dryer.
$350 - Induction Cooktops (30" or Larger). Propane or Natural Gas to Electric Induction. Verification Required - Photo of old gas cooktop required.


Outdoor Electric Equipment Rebate Application

Requirements
 Must have an active member account with EEA to qualify for rebate.
Application form must be completed and submitted within 90 days from purchase date, no exceptions. 
Rebate will be issued as a credit on your electric account. Please allow 6 to 8 weeks for credit to appear.  
Minimum purchase price $50.00.
Maximum total rebate $1000 for a riding mower and $300 total per member per year for all combined outdoor power equipment rebates.
Limitations: New battery or corded equipment. 1 product type per member per year (except e-bikes) and 1 extra battery per product.
A detailed receipt listing of your purchase and the photo of  your product or spec sheet can be uploaded below.
Submission of this application does not guarantee a rebate. 
Rebate Amounts
Single Stage Snow Blower - 25% of Price up to $150
Riding Lawn Mower - 50% of price up to $1000`

const EXAMPLE_RESPONSE = `[
    {
      "technology": "HVAC - Air Source Heat Pump",
      "program_description": "$350 per heating ton rebate for qualifying Air Source Heat Pump Water Heater (30 Gallon Minimum)",
      "rebate_type": "Account Credit",
      "rebate_value": "$350 per heating ton",
      "number": 350,
      "amount_type": "dollar per unit",
      "unit": "heating ton",
      "equipment_standards_restrictions": "Must be Energy Star® rated.",
      "equipment_capacity_restrictions": "30 Gallon Minimum",
      "other_restrictions": "Backup units, electric resistance water heaters, and tankless water heaters are not eligible."
    },
    {
      "technology": "Heat Pump Dryers / Clothes Dryer",
      "program_description": "$60 rebate for Electric Clothes Dryer",
      "rebate_type": "Account Credit",
      "rebate_value": $60,
      "number": 60,
      "amount_type": "dollar amount"
    },
    {
      "technology": "Heat Pump Dryers / Clothes Dryer",
      "program_description": "$120 rebate for Heat Pump Ventless Electric Clothes Dryer",
      "rebate_type": "Account Credit",
      "rebate_value": "$120",
      "number": 120,
      "amount_type": "dollar amount"
    },
    {
      "technology": "Induction Cooktop",
      "program_description": "$350 rebate for Induction Cooktops (30\" or Larger) after converting from natural gas or propane",
      "rebate_type": "Account Credit",
      "rebate_value": "$350",
      "number": 350,
      "amount_type": "dollar amount",
      "equipment_standards_restrictions": "Must be an Induction Cooktop (30\" or Larger)."
    },
    {
      "technology": "Electric outdoor equipment",
      "program_description": "25% of Price up to $150 for Single Stage Snow Blower",
      "rebate_type": "Account Credit",
      "rebate_value": "25%",
      "number": 25,
      "amount_type": "percentage",
      "amount_maximum": 150
    },
    {
      "technology": "Electric outdoor equipment",
      "program_description": "50% of price up to $1000 for Riding Lawn Mower",
      "rebate_type": "Account Credit",
      "rebate_value": "50%",
      "number": 50,
      "amount_type": "percentage",
      "amount_maximum": 1000
    },
]`

const functions = [
  {
    "name": "extract_incentive_data",
    "description": "Get the current weather in a given location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state, e.g. San Francisco, CA",
        },
        "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] },
      },
      "required": ["location"],
    },
  }
];


export function generateMessages(incentive_text: string): ChatCompletionRequestMessage[] {
  return [
    { "role": "system", content: SYSTEM },
    { "role": "user", content: EXAMPLE_USER },
    { "role": "assistant", content: EXAMPLE_RESPONSE },
    { "role": "user", content: incentive_text },
  ]
}
