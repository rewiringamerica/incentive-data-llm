import { Incentive } from "../incentive.js"
import { TECHNOLOGY_TO_HOMEOWNER_RENTER } from "../constants.js"


export function generateHomeownerRenterField(incentive: Incentive) {
  if (!(incentive["Technology"] === undefined) && TECHNOLOGY_TO_HOMEOWNER_RENTER.has(incentive["Technology"])) {
    incentive["Homeowner/Renter"] = TECHNOLOGY_TO_HOMEOWNER_RENTER.get(incentive["Technology"])
  } else {
    incentive["Homeowner/Renter"] = "Unknown"
  }
}