export interface FixtureNsfwReasons {
  Sexuality: number
  Weapons: number
  'Drug-use': number
}

export interface FixtureExpectations {
  articles: string[]
  redirects: number
  otherNs: number
  disambig: number
  stubs: number
  nsfw: number
  nsfwReasons: FixtureNsfwReasons
}

export interface DumpsterFixture {
  file: string
  dir: string
  count: number
  expect: FixtureExpectations
}

declare function makeFixture(count?: number): DumpsterFixture

export default makeFixture
