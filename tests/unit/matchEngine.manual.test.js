import { describe, expect, it } from 'vitest'
import { finishManually } from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

const ENDED_AT = '2026-01-01T03:00:00.000Z'

function expectCode(action, code) {
  try {
    action()
  } catch (error) {
    expect(error.code).toBe(code)
    return
  }

  throw new Error(`Expected GameRuleError with code ${code}.`)
}

function makeSession(phase) {
  return makeValidSession({
    phase,
    currentTurn: 3,
    participants: makeParticipants([
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ]),
    match: { turnCount: 2 },
  })
}

describe('finishManually', () => {
  it('encerra manualmente em qualquer fase não final', () => {
    const phases = [
      MatchPhase.TURN_START,
      MatchPhase.ASSASSINS_ANNOUNCEMENT,
      MatchPhase.ASSASSINS_ACTIONS,
      MatchPhase.DETECTIVES_ANNOUNCEMENT,
      MatchPhase.DETECTIVES_ACTIONS,
      MatchPhase.DAWN_ANNOUNCEMENT,
      MatchPhase.DAWN_RESULT,
      MatchPhase.VOTING,
    ]

    for (const phase of phases) {
      const session = makeSession(phase)
      const next = finishManually(session, ENDED_AT)

      expect(next.phase).toBe(MatchPhase.FINISHED)
      expect(next.match.status).toBe('FINISHED')
      expect(next.match.closureReason).toBe('MANUAL')
      expect(next.match.winner).toBeNull()
      expect(next.match.endedAt).toBe(ENDED_AT)
      expect(next.match.turnCount).toBe(2)
    }
  })

  it('preserva status dos participantes e não conta turno em andamento', () => {
    const session = makeSession(MatchPhase.ASSASSINS_ACTIONS)
    session.match.participants[2].status = PlayerStatus.DEAD
    session.match.participants[2].eliminatedAt = { turn: 2, phase: 'NIGHT' }

    const next = finishManually(session, ENDED_AT)

    expect(next.match.turnCount).toBe(session.match.turnCount)
    expect(next.match.participants).toEqual(session.match.participants)
  })

  it('rejeita segundo encerramento', () => {
    const session = makeSession(MatchPhase.TURN_START)
    const finished = finishManually(session, ENDED_AT)

    expectCode(() => finishManually(finished, ENDED_AT), 'MATCH_ALREADY_FINISHED')
  })
})
