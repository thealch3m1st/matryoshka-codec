import {
  buildRomanticMixtapeEncodedShells,
  ROMANTIC_MIXTAPE_SHELLS,
  ROMANTIC_MIXTAPE_SUNO_ID,
  ROMANTIC_MIXTAPE_SUNO_URL,
} from '../../src/examples.ts'

export { ROMANTIC_MIXTAPE_SUNO_ID, ROMANTIC_MIXTAPE_SUNO_URL }

export const romanticMixtapeShells = ROMANTIC_MIXTAPE_SHELLS

export function buildRomanticMixtapeFixture(): string[] {
  return buildRomanticMixtapeEncodedShells()
}
