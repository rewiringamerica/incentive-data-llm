import t from 'tap'

import { Incentive } from '../incentive.js'
import { generateHomeownerRenterField } from "./homeowner_renter.js"


t.test('generateHomeownerRenterField() generates Homeowner/Renter', t => {
  const testCases = [
    { name: "undefined Technology", input: {}, want: "Unknown" },
    { name: "recognized Technology", input: { "Technology": "HVAC - Air Source Heat Pump" }, want: "Homeowner" },
    { name: "unknown Technology", input: { "Technology": "Rube Goldberg Machine" }, want: "Unknown" }
  ]

  for (const testCase of testCases) {
    const incentive: Incentive = testCase.input
    generateHomeownerRenterField(incentive)
    t.equal(incentive["Homeowner/Renter"], testCase.want, testCase.name)
  }

  t.end()
})