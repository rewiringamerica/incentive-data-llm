import { test } from "tap";
import { renderSchema } from "../src/prompt.js";
import { SCHEMA_METADATA } from "../src/incentive_schema.js";

test("prompt renders schema correctly", (t) => {
  const got = renderSchema(SCHEMA_METADATA);

  const expected = `Data Fields:
Technology: the type of technology in the incentive. Required field. It should be one of the following values: HVAC - Air Source Heat Pump, HVAC - Air to Water Heat Pump, HVAC - Ducted Heat Pump, HVAC - Ductless Heat Pump, Ground Source Heat Pump (GSHP) / Geothermal HP, Heat Pump Water Heater (HPWH), New Electric Vehicle, Used Electric Vehicle, Electric Vehicle Charger, Rooftop Solar, Battery Storage, Heat Pump Dryers / Clothes Dryer, Induction Cooktop, Weatherization (Insulation and Air Sealing), Electric Panel, Electric Outdoor Equipment, Smart Thermostat, E-Bike, Electric Thermal Storage/Slab, Evaporative Cooler, Non-Heat Pump Clothes Dryer, Non-Heat Pump Water Heater, Whole House Fan, Other.

Program Description: a brief summary of the incentive, including the amount (such as dollar value or percentage), Technology, and the most important restrictions, if any. No more than 150 characters. Required field.

Program Status: current availability of the program. Required field. It should be one of the following values: Active, Expired, Paused, Planned, Other, Unknown.

Program Start: if mentioned, a start date for which the program is valid or for which customers must purchase equipment.

Program End: if mentioned, an end date for which the program is valid or for which customers must purchase equipment.

Rebate Type: the way the incentive is paid to the customer. If the passage indicates the rebate is an instant rebate or applied at time of purchase, it is Point of Sale rebate. If it mentions receiving a check or mailing in an application after purchase, it is Rebate (post purchase). If it says it will apply it as a credit on the utility bill, it is Account Credit. And if it mentions tax credits, it is a Tax Credit. Required field. It should be one of the following values: Rebate (Post Purchase), Point of Sale Rebate, Account Credit, Tax Credit, Assistance Program, Bonus, Multiple, Other, Unknown, Financing.

Rebate Value: A free-text version of the value of the rebate (e.g. $2000, $500 per ton). If the rebate has both a percentage cap (e.g. 25% of costs) and a dollar maximum (up to $3,000), include both. Required field.

Amount Type: The financial structure of the rebate. Required field. It should be one of the following values: Dollar Per Unit, Percent, Dollar Amount.

Amount Number: Only the number of the Rebate Value. If the Rebate Value is "$2,500", it would be 2500, and if the Rebate Value is "$100 / ton", it would be 100. Give percentages as a decimal; e.g. 25% is 0.25. If the incentive has both a percentage and a dollar maximum, give the percentage. Required field.

Amount Unit: if the Amount type is amount per unit, then this will be the corresponding unit, such as ton, sq ft, or kilowatt

Amount Minimum: the minimum amount associated with the incentive, if any. Do not include commas or units like $ or % in your answer.

Amount Maximum: the maximum amount associated with the incentive, if any. For example, if the incentive reads '50% up to $50', then this would be 50. Do not include commas or units like $ or % in your answer.

Bonus Description: description of the bonus mentioned in the incentive, if any. Bonuses are additional offers directly tied to an incentive and will likely use the words "bonus" or "additional".

Equipment Standards Restrictions: specifications for the efficiency of the appliance, if any

Equipment Capacity Restrictions: requirements for the size or capacity of the unit, if any

Contractor Restrictions: requirements for who the unit is installed by, such as whether a licensed contractor is required

Income Restrictions: if the customer has any restrictions on their income in order to claim the rebate

Tax-Filing Status: if there are any restrictions on the customer's tax-filing status (e.g. single or joint filing), list them here It should be one of the following values: Head of Household, Joint, Married, Filing Separately, Single, Qualifying Widower with Dependent Child.

Other Restrictions: for other important restrictions not covered by the above

Stacking Details: for any restrictions on how rebates can be combined. For example, if there is a dollar limit across multiple incentives, that would go here. Note that limits for a single incentive should be listed in Other Restrictions.

Financing Details: if information is given related to how to finance the project, include it here
`;
  t.equal(got, expected);
  t.end();
});
