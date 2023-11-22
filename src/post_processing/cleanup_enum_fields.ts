import { Incentive } from "../incentive.js"
import { TECHNOLOGY_TO_HOMEOWNER_RENTER } from "../constants.js"
import Fuse from 'fuse.js'


const TECHNOLOGIES = [...TECHNOLOGY_TO_HOMEOWNER_RENTER.keys()];
const FUZZY_MATCH_THRESHOLD = 0.5

export function cleanupEnumFields(incentive: Incentive) {
  cleanupTechnology(incentive)
}


function cleanupTechnology(incentive: Incentive) {
  const technology = incentive["Technology"]
  if (technology === undefined) {
    incentive["Technology"] = "Unknown"
    return
  }
  if (TECHNOLOGIES.includes(technology)) return

  const fuse = new Fuse(TECHNOLOGIES, { includeScore: true })
  const res = fuse.search(technology, { limit: 1 })
  if (res.length > 0 && Object.hasOwn(res[0], 'score') && res[0].score! < FUZZY_MATCH_THRESHOLD) {
    incentive["Technology"] = res[0].item
    console.log(`Renaming ${technology} for ${res[0].item}`)
  }
}