import { createMatchParticipant } from '@/entities/match-participant/model/matchParticipant'
import { validateMatchConfiguration } from './matchConfiguration'
import { MatchPhase } from './matchPhases'
import { MatchStatus } from './matchStatus'

/**
 * Cria a sessão inicial de uma partida. Não muta a configuração recebida.
 * @param {{ participants?: Array<{ participantId?: unknown, role?: unknown }> }} configuration
 * @param {{ matchId?: string, startedAt?: string, idFactory?: () => string }} [context]
 * @returns {object}
 */
export function createMatchSession(configuration, context = {}) {
  const normalized = validateMatchConfiguration(configuration)
  const { matchId, startedAt, idFactory } = context

  if (typeof matchId !== 'string' || !matchId.trim()) {
    throw new TypeError('matchId is required to create a match session.')
  }

  if (typeof startedAt !== 'string' || !startedAt.trim()) {
    throw new TypeError('startedAt is required to create a match session.')
  }

  if (typeof idFactory !== 'function') {
    throw new TypeError('idFactory is required to create a match session.')
  }

  const participants = normalized.participants.map(({ participantId, role }) =>
    createMatchParticipant({ id: idFactory(), participantId, role }),
  )

  return {
    match: {
      id: matchId,
      status: MatchStatus.IN_PROGRESS,
      closureReason: null,
      winner: null,
      startedAt,
      endedAt: null,
      turnCount: 0,
      participants,
    },
    phase: MatchPhase.TURN_START,
    currentTurn: 1,
    assassinTargets: {},
    investigations: {},
    nightResult: null,
    voteResult: null,
  }
}

export default createMatchSession
