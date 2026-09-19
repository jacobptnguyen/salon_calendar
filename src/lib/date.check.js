// Run with: node src/lib/date.check.js
import assert from 'node:assert/strict'
import { parseTimeAndNote } from './date.js'

const cases = [
  // colon slips
  ['2;30 Full set', '14:30', 'Full set'],
  ['2;;30 Full set', '14:30', 'Full set'],
  ['2::30 Full set', '14:30', 'Full set'],
  ['2:;30 Full set', '14:30', 'Full set'],
  ['2.30 Full set', '14:30', 'Full set'],
  ['2,30 Full set', '14:30', 'Full set'],
  ['2 ; 30 Full set', '14:30', 'Full set'],
  ['2: 30 Full set', '14:30', 'Full set'],
  ['9 ; 30 - color', '09:30', 'color'],
  // missing space / punctuation before the note
  ['2:30Full set', '14:30', 'Full set'],
  ['230Full set', '14:30', 'Full set'],
  ['9Full set', '09:00', 'Full set'],
  ['2:30 - Full set', '14:30', 'Full set'],
  ['2:30-Full set', '14:30', 'Full set'],
  ['2:30: Full set', '14:30', 'Full set'],
  ['2:30, Full set', '14:30', 'Full set'],
  // am/pm spellings
  ['2:30p Full set', '14:30', 'Full set'],
  ['2:30 p.m. Full set', '14:30', 'Full set'],
  ['2:30PM Full set', '14:30', 'Full set'],
  ['9:30 a.m. Full set', '09:30', 'Full set'],
  ['2:30pmFull', '14:30', 'pmFull'], // known ceiling: marker glued to note
  // 24-hour
  ['14:30 Full set', '14:30', 'Full set'],
  ['1430 Full set', '14:30', 'Full set'],
  // regressions
  ['2:30 Full set', '14:30', 'Full set'],
  ['230 Full set', '14:30', 'Full set'],
  ['9 Full set', '09:00', 'Full set'],
  ['12 lunch', '12:00', 'lunch'],
  ['9 am Full', '09:00', 'Full'],
  ['12:15 am Full', '00:15', 'Full'],
  ['2:30 Amy', '14:30', 'Amy'],
  ['2:30 Anna', '14:30', 'Anna'],
  ['2:30 5 people', '14:30', '5 people'],
]
for (const [input, time, note] of cases) {
  assert.deepEqual(parseTimeAndNote(input), { time, note }, input)
}

for (const input of ['12345 foo', 'Full set', '2:75 x', '2:30']) {
  assert.equal(parseTimeAndNote(input), null, input)
}

console.log(`ok: ${cases.length + 4} cases`)
