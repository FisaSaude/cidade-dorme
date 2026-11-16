import { describe, expect, it } from 'vitest'
import {
  resolveDetectivesPhase,
  setInvestigation,
} from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

function expectCode(action, code) {
  try {
    action()
  } catch (error) {
    expect(error.code).toBe(code)
    return
  }

  throw new Error(`Expected GameRuleError with code ${code}.`)
}

function makeSession() {
  return makeValidSession({
    phase: MatchPhase.DETECTIVES_ACTIONS,
    participants: makeParticipants([
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ]),
  })
}

describe('matchEngine detectives phase', () => {
  it('registra investigação com papel revelado sem alterar status', () => {
    const session = makeSession()
    const next = setInvestigation(session, 'mp-2', 'mp-1')

    expect(next.investigations['mp-2']).toEqual({
      targetId: 'mp-1',
      revealedRole: 'ASSASSIN',
    })
    expect(next.match.participants.find((participant) => participant.id === 'mp-1').status).toBe(
      PlayerStatus.ALIVE,
    )
  })

  it('aceita investigação nula', () => {
    const session = makeSession()
    const next = setInvestigation(session, 'mp-2', null)
    expect(next.investigations['mp-2']).toBeNull()
  })

  it('valida ator e alvo', () => {
    const session = makeSession()

    expectCode(() => setInvestigation(session, 'mp-1', 'mp-2'), 'INVALID_ACTOR_ROLE')
    expectCode(() => setInvestigation(session, 'mp-2', 'mp-2'), 'TARGET_IS_SELF')

    session.match.participants[2].status = PlayerStatus.DEAD
    session.match.participants[2].eliminatedAt = { turn: 1, phase: 'NIGHT' }
    expectCode(() => setInvestigation(session, 'mp-2', 'mp-3'), 'TARGET_NOT_ALIVE')
  })

  it('rejeita detetive morto e conclui fase para DAWN_ANNOUNCEMENT', () => {
    const session = makeSession()
    session.match.participants[1].status = PlayerStatus.DEAD
    session.match.participants[1].eliminatedAt = { turn: 1, phase: 'NIGHT' }

    expectCode(() => setInvestigation(session, 'mp-2', 'mp-1'), 'ACTOR_NOT_ALIVE')

    const next = resolveDetectivesPhase(
      makeValidSession({ phase: MatchPhase.DETECTIVES_ACTIONS }),
    )
    expect(next.phase).toBe(MatchPhase.DAWN_ANNOUNCEMENT)
  })
})
