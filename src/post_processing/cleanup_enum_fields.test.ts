import t from 'tap'

import { cleanupEnumFields } from './cleanup_enum_fields.js'


t.test('cleanupEnumFields() cleans up Technology field', t => {
  const undefinedIncentive: { "Technology"?: string } = {}
  cleanupEnumFields(undefinedIncentive)
  t.equal(undefinedIncentive["Technology"], "Unknown", "undefined categorized as Unknown")

  const matchingIncentive = { "Technology": "Heat Pump Water Heater (HPWH)" }
  cleanupEnumFields(matchingIncentive)
  t.equal(matchingIncentive["Technology"], "Heat Pump Water Heater (HPWH)", "Matching technology unchanged")

  const standardTestCases = [
    { before: "Heat Pump Water Heater", after: "Heat Pump Water Heater (HPWH)" },
    { before: "Weatherization(insulation & air sealing)", after: "Weatherization (insulation and air sealing)" },
    { before: "Air Source Heat Pump", after: "HVAC - Air Source Heat Pump" }
  ]

  for (const testCase of standardTestCases) {
    const incentive = { "Technology": testCase.before }
    cleanupEnumFields(incentive)
    t.equal(incentive["Technology"], testCase.after, `${testCase.before} => ${testCase.after}`)
  }

  t.end()
})