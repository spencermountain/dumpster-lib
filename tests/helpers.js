import assert from 'node:assert/strict'

// Tape awaits async tests but does not provide a promise-rejection assertion.
export async function rejects(t, promise, expected) {
  await assert.rejects(promise, expected)
  t.pass('rejects as expected')
}
