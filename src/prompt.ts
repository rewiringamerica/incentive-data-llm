import { SCHEMA_METADATA, SchemaMetadata } from "./incentive_schema.js";

export function renderSchema(schema: SchemaMetadata): string {
  return (
    "Data Fields:\n" +
    Object.entries(schema)
      .map(([, metadata]) => {
        let output = `${metadata.display_name}: ${metadata.text}`;
        if (metadata.required) output += " Required field.";
        if (metadata.values) {
          output += ` It should be one of the following values: ${metadata.values.join(
            ", "
          )}.`;
        }
        return output;
      })
      .join("\n\n") +
    "\n"
  );
}

export const SYSTEM: string = `You are a helpful assistant. I'm going to give you a list of data fields, and then I will give you a series of passages that contain financial incentives. I want you to populate the fields in valid JSON format, with one record for each incentive.

An incentive is typically for a specific appliance or tool, like a heat pump, a battery, or a smaller tool like a snowblower. There are also free incentives like a home inspection for weatherization.

${renderSchema(SCHEMA_METADATA)}`;

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
Riding Lawn Mower - 50% of price up to $1000`;

export const EXAMPLE_1_RESPONSE: string = `[
    {
      "Technology": "HVAC - Air Source Heat Pump",
      "Program Description": "$350 per heating ton rebate for qualifying Air Source Heat Pump Water Heater (30 Gallon Minimum)",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "$350 per heating ton",
      "Amount Type": "Dollar Per Unit",
      "Amount Number": 350,
      "Amount Unit": "heating ton",
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
      "Amount Type": "Dollar Amount",
      "Amount Number": 60,
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
      "Amount Type": "Dollar Amount",
      "Amount Number": 120,
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
      "Amount Type": "Dollar Amount",
      "Amount Number": 350,
      "Equipment Standards Restrictions": "Must be an Induction Cooktop (30" or Larger).",
      "Contractor Restrictions": "Must be installed by a licensed ENERGYSTAR-certified contractor."
    },
    {
      "Technology": "Electric Outdoor Equipment",
      "Program Description": "25% of price up to $150 for Single Stage Snow Blower",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "25% of price up to $150",
      "Amount Type": "Percent",
      "Amount Number": 0.25,
      "Amount Maximum": 150
    },
    {
      "Technology": "Electric Outdoor Equipment",
      "Program Description": "50% of price up to $1000 for Riding Lawn Mower",
      "Program Status": "Active",
      "Program Start": "1/1/2023",
      "Program End": "12/31/2023",
      "Rebate Type": "Account Credit",
      "Rebate Value": "50% of price up to $1000",
      "Amount Type": "Percent",
      "Amount Number": 0.5,
      "Amount Maximum": 1000
    }
]`;

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
Has a maximum speed of 25 mph`;

export const EXAMPLE_2_RESPONSE = `[
  {
    "Technology": "New Electric Vehicle",
    "Program Description": "$750 rebate for new All Electric Plug-In Vehicle (EV), capped at 50% of purchase price",
    "Program Status": "Paused",
    "Rebate Type": "Point of sale rebate",
    "Rebate Value": "$750 capped at 50% of price",
    "Amount Type": "Percent",
    "Amount Number": 0.5,
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
    "Amount Type": "Percent",
    "Amount Number": 0.5,
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
    "Amount Type": "Percent",
    "Amount Number": 0.5,
    "Amount Maximum": "250",
    "Equipment Standards Restrictions": "Has a maximum speed of 25 mph",
    "Equipment Capacity Restrictions": "Has a gross vehicle weight rating of 3,000 pounds or less",
    "Other Restrictions": "Proof of registration in the same county as the SMPA account required.",
    "Stacking Details": "Limit 1 rebate of each type per member per year.",
    "Financing Details": "Financing Details is available via Empower Loans. For more details, see www.empower.com."
  }
]`;
