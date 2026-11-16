import { MatchPhase } from '@/entities/match/model/matchPhases'

export const ANNOUNCEMENT_TEXT = Object.freeze({
  [MatchPhase.TURN_START]: 'Cidade Dorme',
  [MatchPhase.ASSASSINS_ANNOUNCEMENT]: 'Assassinos Acordem',
  [MatchPhase.DETECTIVES_ANNOUNCEMENT]: 'Detetives Acordem',
  [MatchPhase.DAWN_ANNOUNCEMENT]: 'Cidade Acorda',
})

export function getAnnouncementText(phase) {
  return ANNOUNCEMENT_TEXT[phase] ?? ''
}

export default ANNOUNCEMENT_TEXT
