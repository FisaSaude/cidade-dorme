import { GameRuleError } from '@/shared/lib/errors'

/**
 * Fases do ciclo de uma partida.
 */
export const MatchPhase = Object.freeze({
  TURN_START: 'TURN_START',
  ASSASSINS_ANNOUNCEMENT: 'ASSASSINS_ANNOUNCEMENT',
  ASSASSINS_ACTIONS: 'ASSASSINS_ACTIONS',
  DETECTIVES_ANNOUNCEMENT: 'DETECTIVES_ANNOUNCEMENT',
  DETECTIVES_ACTIONS: 'DETECTIVES_ACTIONS',
  DAWN_ANNOUNCEMENT: 'DAWN_ANNOUNCEMENT',
  DAWN_RESULT: 'DAWN_RESULT',
  VOTING: 'VOTING',
  FINISHED: 'FINISHED',
})

/**
 * Fases em que uma eliminação pode ocorrer.
 */
export const EliminationPhase = Object.freeze({
  NIGHT: 'NIGHT',
  VOTE: 'VOTE',
})

/**
 * Transições permitidas ao dispensar uma sobreposição.
 */
export const ANNOUNCEMENT_TRANSITIONS = Object.freeze({
  [MatchPhase.TURN_START]: MatchPhase.ASSASSINS_ANNOUNCEMENT,
  [MatchPhase.ASSASSINS_ANNOUNCEMENT]: MatchPhase.ASSASSINS_ACTIONS,
  [MatchPhase.DETECTIVES_ANNOUNCEMENT]: MatchPhase.DETECTIVES_ACTIONS,
  [MatchPhase.DAWN_ANNOUNCEMENT]: MatchPhase.DAWN_RESULT,
})

/**
 * Retorna a próxima fase de uma sobreposição.
 * @param {string} phase
 * @returns {string}
 */
export function getNextAnnouncementPhase(phase) {
  const nextPhase = ANNOUNCEMENT_TRANSITIONS[phase]

  if (!nextPhase) {
    throw new GameRuleError(
      'INVALID_PHASE',
      `Announcement cannot be dismissed in phase ${String(phase)}.`,
    )
  }

  return nextPhase
}

export default MatchPhase
