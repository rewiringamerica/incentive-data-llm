import Fuse from 'fuse.js'
import { AsyncParser } from '@json2csv/node'
import fs = require('node:fs/promises')

import { SYSTEM, EXAMPLE_1_USER, EXAMPLE_1_RESPONSE } from './prompt_eval.js'

// 0 is an exact match; 1 is a terrible match.
const FUZZY_MATCH_THRESHOLD = 0.5
const KEY_NAME = 'Column'
const ROW_TOTAL = 'Row Total'

enum Grade {
  Unspecified = 'Unspecified',

  MissingBoth = 'MissingBoth',
  MissingPredicted = 'MissingPredicted',
  MissingGolden = 'MissingGolden',
  CaseInsensitiveMatch = 'CaseInsensitiveMatch',

  FuzzyMatch = 'FuzzyMatch',
  FuzzyNoMatch = 'FuzzyNoMatch',

  ModelGradedMatch = 'ModelGradedMatch',
  ModelGradedAlmostMatch = 'ModelGradedAlmostMatch',
  ModelGradedWeakMatch = 'ModelGradedWeakMatch',
  ModelGradedNoMatch = 'ModelGradedNoMatch',
}

// To reduce output constraints on the model, we ask the LLM grader to simply
// give back a letter rather than a more complicated enum. Then we use this
// to translate.
const MODEL_GRADES = new Map<string, Grade>([
  ['A', Grade.ModelGradedMatch],
  ['B', Grade.ModelGradedAlmostMatch],
  ['C', Grade.ModelGradedWeakMatch],
  ['D', Grade.ModelGradedNoMatch]
])

// These fields will be compared by a fuzzy match algorithm to basically test
// that we got that answer or extremely close.
const FUZZY_MATCH_FIELDS: string[] = [
  'Technology',
  'Program Status',
  'Program Start',
  'Program End',
  'Rebate Type',
  'Amount Type',
  'Number',
  'Unit',
  'Amount Minimum',
  'Amount Maximum',
  'Amount Representative',
  'Homeowner/Renter',
]

const MODEL_GRADED_FIELDS: string[] = [
  'Rebate Value',
  'Program Description',
  'Bonus Description',
  'Equipment Standards Restrictions',
  'Equipment Capacity Restrictions',
  'Contractor Restrictions',
  'Income Restrictions',
  'Tax-Filing Status Restrictions',
  'Other Restrictions',
  'Financing Details',
  'Stacking Details'
]

export interface Diff {
  diffs: Record<string, DiffVal>
  extra_keys?: string
  filename?: string
  order?: number
}

interface DiffVal {
  grade?: string
  golden: string
  predicted: string
  explanation?: string
}

type Incentive = Record<string, string>

export type Report = Array<Record<string, unknown>>

type ModelQueryFunction = ((input_text: string, system: string, examples: Array<[string, string]>) => Promise<string>)

export class Differ {
  modelQueryFunction: ModelQueryFunction

  constructor(modelQueryFunction: ModelQueryFunction) {
    this.modelQueryFunction = modelQueryFunction
  }

  async modelGradeFields(golden: Incentive, predicted: Incentive): Promise<Diff> {
    const lastMessage: string = `Expert:
    ${JSON.stringify(golden)}
    
    Student:
    ${JSON.stringify(predicted)}`

    // return [queryGpt(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]]), queryPalm(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]])];
    const resp = await this.modelQueryFunction(lastMessage, SYSTEM, [[EXAMPLE_1_USER, EXAMPLE_1_RESPONSE]])
    const diff: Diff = { diffs: {} }
    try {
      const parsed = JSON.parse(resp)
      for (const key in parsed) {
        diff.diffs[key] = {
          golden: golden[key],
          predicted: predicted[key],
          grade: MODEL_GRADES.get(parsed[key].grade.toUpperCase()) ?? Grade.Unspecified,
          explanation: parsed[key].explanation,
        }
      }
    } catch (err) {
      console.log(`Error while parsing ${resp}: ${err}`)
    }
    return diff
  }

  getFuzzyMatchData(golden: string, predicted: string): { grade?: string, explanation?: string } {
    const fuse = new Fuse([golden], { includeScore: true })
    const res = fuse.search(predicted, { limit: 1 })
    const result: { grade?: string, explanation?: string } = {}
    if (res.length > 0 && Object.hasOwn(res[0], 'score') && res[0].score! < FUZZY_MATCH_THRESHOLD) {
      result.grade = Grade[Grade.FuzzyMatch]
      result.explanation = `Fuzzy Match score of ${res[0].score} (threshold is ${FUZZY_MATCH_THRESHOLD})`
    } else {
      result.grade = Grade[Grade.FuzzyNoMatch]
    }
    return result
  }

  async compareIncentives(golden: Incentive, predicted: Incentive): Promise<Diff> {
    const modelGolden: Incentive = {}
    const modelPredicted: Incentive = {}

    const diff: Diff = { diffs: {} }
    for (const k of FUZZY_MATCH_FIELDS.concat(MODEL_GRADED_FIELDS)) {
      let base: DiffVal = {
        golden: golden[k] ?? 'Not provided',
        predicted: predicted[k] ?? 'Not provided'
      }
      if (!(Object.hasOwn(golden, k) || Object.hasOwn(predicted, k))) {
        base.grade = Grade.MissingBoth
      } else if (Object.hasOwn(golden, k) && !(Object.hasOwn(predicted, k))) {
        base.grade = Grade.MissingPredicted
      } else if (Object.hasOwn(predicted, k) && !(Object.hasOwn(golden, k))) {
        base.grade = Grade.MissingGolden
      } else if (String(golden[k]).toLowerCase() == String(predicted[k]).toLowerCase()) {
        base.grade = Grade.CaseInsensitiveMatch
      } else {
        if (FUZZY_MATCH_FIELDS.includes(k)) {
          base = { ...base, ...this.getFuzzyMatchData(golden[k], predicted[k]) }
        } else {
          modelGolden[k] = golden[k]
          modelPredicted[k] = predicted[k]
        }
      }
      diff.diffs[k] = base
    }

    if (Object.keys(modelGolden).length > 0) {
      const modelGraded = await this.modelGradeFields(modelGolden, modelPredicted)
      for (const key in modelGraded.diffs) {
        if (!(key in diff.diffs)) {
          console.log(`Model returned unknown key: ${key}`)
        } else {
          diff.diffs[key] = modelGraded.diffs[key]
        }
      }
    }

    return diff
  }

  async compareData(key: string, golden_data: Incentive[], predicted_data: Incentive[]): Promise<Diff[]> {
    const diffs: Diff[] = []

    if (golden_data.length != predicted_data.length) {
      console.log(`In file ${key}, golden and predicted data are different lengths; comparison not supported`)
    } else {
      for (let i = 0; i < golden_data.length; i++) {
        const diff = await this.compareIncentives(golden_data[i], predicted_data[i])
        diff.filename = key
        diff.order = i
        diffs.push(diff)
      }
    }
    return diffs
  }

  createReport(diffs: Diff[]): Report {
    const keyFrequencies: Map<string, Map<string, number>> = new Map()
    for (const diff of diffs) {
      for (const key in diff.diffs) {
        if (keyFrequencies.get(key) === undefined) {
          keyFrequencies.set(key, new Map<string, number>())
        }
        const freq = keyFrequencies.get(key)!
        const grade = diff.diffs[key].grade!
        freq.set(grade, 1 + (freq.get(grade) ?? 0))
        freq.set(ROW_TOTAL, 1 + (freq.get(ROW_TOTAL) ?? 0))
      }
    }
    const report: Report = []
    const totals: Map<string, number> = new Map();
    keyFrequencies.forEach((val, key) => {
      const row: Record<string, unknown> = {}
      val.forEach((count, grade) => {
        row[grade] = count
        totals.set(grade, count + (totals.get(grade) ?? 0))
      })
      row[KEY_NAME] = key
      report.push(row)
    })
    const row: Record<string, unknown> = {}
    row[KEY_NAME] = "Column Totals"
    totals.forEach((val, grade) => {
      row[grade] = val
    })
    report.push(row)
    return report
  }

  async writeReport(report: Report, filename: string) {
    const fields: string[] = [KEY_NAME]
    const keys = Object.keys(Grade) as (keyof typeof Grade)[]
    for (const key of keys) {
      fields.push(Grade[key])
    }
    fields.push(ROW_TOTAL)
    const parser = new AsyncParser({ fields: fields })

    const csv = await parser.parse(report).promise()
    fs.writeFile(filename, csv)
  }
}