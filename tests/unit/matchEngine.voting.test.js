import { describe, expect, it } from 'vitest'
import {
  registerVote,
  startVoting,
} from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { MatchClosureReason, MatchStatus } from '@/entities/match/model/matchStatus'
import { MatchWinner } from '@/entities/match/model/victory'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

const ENDED_AT = '2026-01-01T02:00:00.000Z'

function expectCode(action, code) {
  try {
    action()
  } catch (error) {
    expect(error.code).toBe(code)
    return
  }

  throw new Error(`Expected GameRuleError with code ${code}.`)
}

function makeVotingSession(roles, overrides = {}) {
  return makeValidSession({
    phase: MatchPhase.VOTING,
    currentTurn: 2,
    participants: makeParticipants(roles),
    match: { turnCount: 1 },
    ...overrides,
  })
}

const DEFAULT_ROLES = [
  PlayerRole.ASSASSIN,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
  PlayerRole.DETECTIVE,
  PlayerRole.INNOCENT,
]

describe('matchEngine voting phase', () => {
  it('elimina um participante vivo e encerra o turno com novo turno limpo', () => {
    const session = makeVotingSession(DEFAULT_ROLES)
    const next = registerVote(
      session,
      { type: 'ELIMINATION', participantId: 'mp-2' },
      ENDED_AT,
    )

    const eliminated = next.match.participants.find(
      (participant) => participant.id === 'mp-2',
    )

    expect(eliminated.status).toBe(PlayerStatus.DEAD)
    expect(eliminated.eliminatedAt).toEqual({ turn: 2, phase: 'VOTE' })
    expect(next.match.turnCount).toBe(2)
    expect(next.currentTurn).toBe(3)
    expect(next.phase).toBe(MatchPhase.TURN_START)
    expect(next.match.status).toBe(MatchStatus.IN_PROGRESS)
    expect(next.assassinTargets).toEqual({})
    expect(next.investigations).toEqual({})
    expect(next.nightResult).toBeNull()
    expect(next.voteResult).toBeNull()
  })

  it('empate não altera status, mas encerra o turno e inicia o próximo', () => {
    const session = makeVotingSession(DEFAULT_ROLES)
    const next = registerVote(session, { type: 'TIE' }, ENDED_AT)

    expect(
      next.match.participants.every(
        (participant) => participant.status === PlayerStatus.ALIVE,
      ),
    ).toBe(true)
    expect(next.match.turnCount).toBe(2)
    expect(next.currentTurn).toBe(3)
    expect(next.phase).toBe(MatchPhase.TURN_START)
    expect(next.match.status).toBe(MatchStatus.IN_PROGRESS)
  })

  it('rejeita alvo morto e resultado inválido', () => {
    const session = makeVotingSession(DEFAULT_ROLES)
    session.match.participants[2].status = PlayerStatus.DEAD
    session.match.participants[2].eliminatedAt = { turn: 1, phase: 'NIGHT' }

    expectCode(
      () =>
        registerVote(
          session,
          { type: 'ELIMINATION', participantId: 'mp-3' },
          ENDED_AT,
        ),
      'TARGET_NOT_ALIVE',
    )
    expectCode(() => registerVote(session, { type: 'INVALID' }, ENDED_AT), 'INVALID_VOTE_RESULT')
    expectCode(() => registerVote(session, null, ENDED_AT), 'INVALID_VOTE_RESULT')
  })

  it('rejeita um segundo resultado de votação no mesmo turno', () => {
    const session = makeVotingSession(DEFAULT_ROLES, {
      voteResult: { type: 'TIE' },
    })

    expectCode(
      () => registerVote(session, { type: 'TIE' }, ENDED_AT),
      'VOTE_ALREADY_REGISTERED',
    )
  })

  it('encerra com vitória dos assassinos quando a votação gera paridade', () => {
    const session = makeVotingSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])

    const next = registerVote(
      session,
      { type: 'ELIMINATION', participantId: 'mp-3' },
      ENDED_AT,
    )

    expect(next.match.status).toBe(MatchStatus.FINISHED)
    expect(next.match.closureReason).toBe(MatchClosureReason.VICTORY)
    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.match.turnCount).toBe(2)
    expect(next.match.endedAt).toBe(ENDED_AT)
    expect(next.phase).toBe(MatchPhase.FINISHED)
  })

  it('encerra com vitória dos inocentes ao eliminar o último assassino', () => {
    const session = makeVotingSession([
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
    ])

    const next = registerVote(
      session,
      { type: 'ELIMINATION', participantId: 'mp-1' },
      ENDED_AT,
    )

    expect(next.match.status).toBe(MatchStatus.FINISHED)
    expect(next.match.winner).toBe(MatchWinner.INNOCENTS)
    expect(next.match.turnCount).toBe(2)
    expect(next.phase).toBe(MatchPhase.FINISHED)
  })

  it('startVoting avança apenas a partir de DAWN_RESULT', () => {
    const session = makeValidSession({ phase: MatchPhase.DAWN_RESULT })
    expect(startVoting(session).phase).toBe(MatchPhase.VOTING)

    expectCode(
      () => startVoting(makeValidSession({ phase: MatchPhase.DAWN_ANNOUNCEMENT })),
      'INVALID_PHASE',
    )
    expectCode(
      () => startVoting(makeValidSession({ phase: MatchPhase.VOTING })),
      'INVALID_PHASE',
    )
  })

  it('registerVote rejeita fase diferente de VOTING', () => {
    expectCode(
      () =>
        registerVote(
          makeValidSession({ phase: MatchPhase.DAWN_RESULT }),
          { type: 'TIE' },
          ENDED_AT,
        ),
      'INVALID_PHASE',
    )
  })
})
