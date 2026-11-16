/**
 * Status possíveis de uma partida.
 */
export const MatchStatus = Object.freeze({
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
})

/**
 * Motivos de encerramento de uma partida.
 */
export const MatchClosureReason = Object.freeze({
  VICTORY: 'VICTORY',
  MANUAL: 'MANUAL',
})

export default MatchStatus
