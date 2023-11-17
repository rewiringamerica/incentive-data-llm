export const INCENTIVES_FILE_BASE = "incentives_data/";
export const OUTPUT_FILE_BASE = "out/";
export const OUTPUT_SUBDIR = "outputs"

// Not actually consumed, but keeping around temporarily for reference.
export const OLD_FIELDS = ['state', 'file', 'order', 'technology', 'technology (if selected other)',
  'program_description', 'program_status', 'program_start', 'program_end', 'rebate_type',
  'rebate_value', 'amount_type', 'number', 'unit', 'amount_minimum', 'amount_maximum',
  'amount_representative', 'bonus_description',
  'equipment_standards_restrictions', 'equipment_capacity_restrictions', 'installation_restrictions',
  'income_restrictions', 'tax_filing_status_restrictions', 'homeowner_renter', 'other_restrictions',
  'stacking_details', 'financing_details'
];

export const CSV_OPTS = {
  fields: ['state', 'file', 'order', "Technology", "Program Description", "Program Status",
    "Program Start", "Program End", "Rebate Type", "Rebate Value", "Number", "Amount Type",
    "Unit", "Amount Minimum", "Amount Maximum", "Bonus Description",
    "Equipment Standards Restrictions", "Equipment Capacity Restrictions",
    "Contractor Restrictions", "Income Restrictions", "Tax - Filing Status Restrictions",
    "Homeowner / Renter", "Other Restrictions", "Stacking Details", "Financing Details"
  ]
};

