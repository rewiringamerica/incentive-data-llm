export const INCENTIVES_FILE_BASE = "incentives_data/";
export const OUTPUT_FILE_BASE = "out/";
export const OUTPUT_SUBDIR = "outputs"


export const CSV_OPTS = {
  fields: ['state', 'file', 'order', "Technology", "Program Description", "Program Status",
    "Program Start", "Program End", "Rebate Type", "Rebate Value", "Number", "Amount Type",
    "Unit", "Amount Minimum", "Amount Maximum", "Bonus Description",
    "Equipment Standards Restrictions", "Equipment Capacity Restrictions",
    "Contractor Restrictions", "Income Restrictions", "Tax - Filing Status Restrictions",
    "Homeowner/Renter", "Other Restrictions", "Stacking Details", "Financing Details"
  ]
};

export const TECHNOLOGY_TO_HOMEOWNER_RENTER = new Map<string, string>([
  ["Heat Pump Heating and Cooling (HVAC)", "Homeowner"],
  ["HVAC - Air Source Heat Pump", "Homeowner"],
  ["Ground Source Heat Pump (GSHP) / Geothermal HP", "Homeowner"],
  ["HVAC - Air to Water Heat Pump", "Homeowner"],
  ["HVAC - Ducted Heat Pump", "Homeowner"],
  ["HVAC - Ductless Heat Pump", "Homeowner"],
  ["Heat Pump Water Heater (HPWH)", "Homeowner"],
  ["New Electric Vehicle", "Homeowner, Renter"],
  ["Used Electric Vehicle", "Homeowner, Renter"],
  ["Electric Vehicle Charger", "Homeowner"],
  ["Rooftop Solar", "Homeowner"],
  ["Battery Storage", "Homeowner"],
  ["Heat Pump Dryers / Clothes Dryer", "Homeowner"],
  ["Electric Stove", "Homeowner"],
  ["Weatherization (insulation and air sealing)", "Homeowner"],
  ["Electric wiring", "Homeowner"],
  ["Electric panel", "Homeowner"],
  ["Electric lawn equipment (mower, edger, leaf blower, weedwhacker)", "Homeowner, Renter"],
  ["Smart Thermostat", "Homeowner"],
  ["E - Bike", "Homeowner, Renter"],
  ["Induction Cooktop", "Homeowner"],
  ["Other", "Unknown"],
])