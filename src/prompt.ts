export const SYSTEM: string = `You are a helpful assistant. I'm going to give you a list of data fields, and then I will give you a series of passages that contain financial incentives. I want you to populate the fields in valid JSON format, with one record for each incentive. You MUST respond with valid JSON, no matter what.

An incentive is typically for a specific appliance or tool, like a heat pump, a battery, or a smaller tool like a snowblower. There are also free incentives like a home inspection for weatherization.

Data fields:
Technology: required field. This is a enum. It should be one of the following values (ignoring quotes if they appear): Heat Pump Heating and Cooling (HVAC), HVAC - Air Source Heat Pump, Ground Source Heat Pump (GSHP) / Geothermal HP, HVAC - Air to Water Heat Pump, HVAC - Ducted Heat Pump, HVAC - Ductless Heat Pump, Heat Pump Water Heater (HPWH), New Electric Vehicle, Used Electric Vehicle, Electric Vehicle Charger, Rooftop Solar, Battery Storage, Heat Pump Dryers / Clothes Dryer, Electric Stove, Weatherization (insulation and air sealing), Electric wiring, Electric panel, "Electric lawn equipment (mower, edger, leaf blower, weedwhacker)", Smart Thermostat, E - Bike, Induction Cooktop, Other

Program Description: required field. a brief summary of the incentive, including the amount (such as dollar value or percentage), Technology, and the most important restrictions, if any. No more than 150 characters.

Program Status: required field. This is an enum. It should be one of the following values: Active, Expired, Paused, Unknown

Program Start: if the text mentions a start date for which the program is valid or for which customers must purchase equipment, it goes here (if any)

Program End: if the text mentions an end date for which the program is valid or for which customers must purchase equipment, it goes here (if any)

Rebate Type: required field. This field should be one or more of Point of Sale rebate, Rebate (post purchase), Account Credit, Tax Credit, or assistance program (free service). If the passage indicates the rebate is an instant rebate or applied at time of purchase, it is Point of Sale rebate. If it mentions receiving a check or mailing in an application after purchase, it is Rebate (post purchase). If it says it will apply it as a credit on the utility bill, it is Account Credit. And if it mentions tax credits, it is a Tax Credit.

Rebate Value: required field. A free-text version of the value of the rebate (e.g. $2, $500 per ton). If the rebate has both a percentage cap (e.g. 25% of costs) and a dollar maximum (up to $3,000), include both.

Number: required field. Only the number of the Rebate Value. If the Rebate Value is "$2,500", it would be 2500, and if the Rebate Value is "$100 / ton", it would be 100. Give percentages as a decimal; e.g. 25% is 0.25. If the incentive has both a percentage and a dollar maximum, give the percentage.

Amount Type: required field. This is an enum. Possible values are: "dollar amount", "percent", or "dollar per unit", depending on how the Rebate Value is expressed.

Unit: if the Amount type is amount per unit, then this will be the corresponding unit, such as ton, sq ft, or kilowatt

Amount Minimum: minimum amount associated with the incentive, if any. Do not include commas or units like $ or % in your answer.

Amount Maximum: the maximum amount mentioned by an incentive, if any. For example, if the incentive reads "50% up to $50", then this would be 50. Do not include commas or units like $ or % in your answer.

Bonus Description: description of the bonus mentioned in the incentive, if any. Bonuses are additional offers directly tied to a different incentive and will likely mention the word "bonus" or "additional".

Equipment Standards Restrictions: specifications for the efficiency of the appliance, if any

Equipment Capacity Restrictions: requirements for the size or capacity of the unit

Contractor Restrictions: requirements for who the unit is installed by, such as whether a licensed contractor is required

Income Restrictions: if the customer has any restrictions on their income in order to claim the rebate

Tax-Filing Status Restrictions: if there are any restrictions on the customer's tax-filing status (e.g. single or joint filing), list them here

Homeowner/Renter: if the incentive specifically mentions being available for a particular customer type, fill it here. Valid options are Homeowner, Renter, or Both. Leave blank if it's not specifically mentioned.

Other Restrictions: for other important restrictions not covered by the above

Stacking Details: for any restrictions on how rebates can be combined. For example, if there is a dollar limit across multiple incentives, that would go here. Note that limits for a single incentive should be listed in Other Restrictions.

Financing Details: if information is given related to how to finance the project, include it here

The following are required fields and you must create an answer for them: Technology, Program Description, Program Start, Rebate Type, Rebate Value, number, and Amount Type.`

export const EXAMPLE_1_USER: string = `Air Source Heat Pump Water Heater Rebate
These incentives are valid for purchases made between January 1, 2023, and December 31, 2023.

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
Must be installed by a licensed ENERGYSTAR-certified contractor.

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

export const EXAMPLE_1_RESPONSE: string = `[
    {
      "Technology": "HVAC - Air Source Heat Pump",
      "Program Description": "$350 per heating ton rebate for qualifying Air Source Heat Pump Water Heater (30 Gallon Minimum)",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "$350 per heating ton",
      "Number": 350,
      "Amount Type": "dollar per unit",
      "Unit": "heating ton",
      "Equipment Standards Restrictions": "Must be Energy Star® rated.",
      "Equipment Capacity Restrictions": "30 Gallon Minimum",
      "Other Restrictions": "Backup units, electric resistance water heaters, and tankless water heaters are not eligible."
    },
    {
      "Technology": "Heat Pump Dryers / Clothes Dryer",
      "Program Description": "$60 rebate for Electric Clothes Dryer",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "$60",
      "Number": 60,
      "Amount Type": "dollar amount",
      "Contractor Restrictions": "Must be installed by a licensed ENERGYSTAR-certified contractor."
    },
    {
      "Technology": "Heat Pump Dryers / Clothes Dryer",
      "Program Description": "$120 rebate for Heat Pump Ventless Electric Clothes Dryer",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "$120",
      "Number": 120,
      "Amount Type": "dollar amount",
      "Contractor Restrictions": "Must be installed by a licensed ENERGYSTAR-certified contractor."
    },
    {
      "Technology": "Induction Cooktop",
      "Program Description": "$350 rebate for Induction Cooktops (30" or Larger) after converting from natural gas or propane",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "$350",
      "Number": 350,
      "Amount Type": "dollar amount",
      "Equipment Standards Restrictions": "Must be an Induction Cooktop (30" or Larger).",
      "Contractor Restrictions": "Must be installed by a licensed ENERGYSTAR-certified contractor."
    },
    {
      "Technology": "Electric outdoor equipment",
      "Program Description": "25% of price up to $150 for Single Stage Snow Blower",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "25% of price up to $150",
      "Number": 0.25,
      "Amount Type": "percent",
      "Amount Maximum": 150
    },
    {
      "Technology": "Electric outdoor equipment",
      "Program Description": "50% of price up to $1000 for Riding Lawn Mower",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "50% of price up to $1000",
      "Number": 0.5,
      "Amount Type": "percent",
      "Amount Maximum": 1000
    }
]`

export const EXAMPLE_2_USER: string = `Electric Vehicles (EVs)
This incentive is currently paused due to lack of funds.

Rebate may apply to the purchase of a new vehicle and will be automatically at the time of sale.
In no case will the rebate exceed 50% of the purchase price.
Limit 1 rebate of each type per member per year.
Financing Details is available via Empower Loans. For more details, see www.empower.com.
The SMPA member applying for the rebate must register the vehicle in the same county as the their SMPA account. Proof of registration must be uploaded to the application.
To be eligible for the rebate, the vehicle must not have been previously registered in any county served by SMPA.

All Electric Plug-In Vehicle (EV) Rebate Form | $750 Rebate
Draws electricity from a battery and is capable of being charged from an external source
Has not been modified from the original equipment manufacturer power train specifications
Has a gross vehicle weight rating of 8,500 pounds or less
Has a maximum speed of at least 65 mph

Plug-In Hybrid Electric Vehicle (PHEV) | $250
Draws electricity from a battery and is capable of being charged from an external source
Has not been modified from the original equipment manufacturer power train specifications
Has a gross vehicle weight rating of 8,500 pounds or less and
Has a maximum speed of at least 65 mph

Neighborhood Electric Vehicle (NEV) | $250
Draws electricity from a battery to operate drive train and is capable of being charged from an external source
Has not been modified from the original equipment manufacturer power train specifications
Has a gross vehicle weight rating of 3,000 pounds or less
Has a maximum speed of 25 mph`

export const EXAMPLE_2_RESPONSE = `[
  {
    "Technology": "New Electric Vehicle",
    "Program Description": "$750 rebate for new All Electric Plug-In Vehicle (EV), capped at 50% of purchase price",
    "Program Status": "Paused",
    "Rebate Type": "Point of sale rebate",
    "Rebate Value": "$750 capped at 50% of price",
    "Number": 0.5,
    "Amount Type": "percent",
    "Amount Maximum": "750",
    "Equipment Standards Restrictions": "Has a maximum speed of at least 65 mph",
    "Equipment Capacity Restrictions": "Has a gross vehicle weight rating of 8,500 pounds or less",
    "Other Restrictions": "Proof of registration in the same county as the SMPA account required.",
    "Stacking Details": "Limit 1 rebate of each type per member per year.",
    "Financing Details": "Financing Details is available via Empower Loans. For more details, see www.empower.com."
  },
  {
    "Technology": "New Electric Vehicle",
    "Program Description": "$250 rebate for new Plug-In Hybrid Electric Vehicle (PHEV), capped at 50% of purchase price",
    "Program Status": "Paused",
    "Rebate Type": "Point of sale rebate",
    "Rebate Value": "$250 capped at 50% of price",
    "Number": 0.5,
    "Amount Type": "percent",
    "Amount Maximum": "250",
    "Equipment Standards Restrictions": "Has a maximum speed of at least 65 mph",
    "Equipment Capacity Restrictions": "Has a gross vehicle weight rating of 8,500 pounds or less",
    "Other Restrictions": "Proof of registration in the same county as the SMPA account required.",
    "Stacking Details": "Limit 1 rebate of each type per member per year.",
    "Financing Details": "Financing Details is available via Empower Loans. For more details, see www.empower.com."
  },
  {
    "Technology": "New Electric Vehicle",
    "Program Description": "$250 rebate for new Neighborhood Electric Vehicle (NEV), capped at 50% of purchase price",
    "Program Status": "Paused",
    "Rebate Type": "Point of sale rebate",
    "Rebate Value": "$250 capped at 50% of price",
    "Number": 0.5,
    "Amount Type": "percent",
    "Amount Maximum": "250",
    "Equipment Standards Restrictions": "Has a maximum speed of 25 mph",
    "Equipment Capacity Restrictions": "Has a gross vehicle weight rating of 3,000 pounds or less",
    "Other Restrictions": "Proof of registration in the same county as the SMPA account required.",
    "Stacking Details": "Limit 1 rebate of each type per member per year.",
    "Financing Details": "Financing Details is available via Empower Loans. For more details, see www.empower.com."
  }
]`