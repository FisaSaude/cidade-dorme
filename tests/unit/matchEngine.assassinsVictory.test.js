import { describe, expect, it } from 'vitest'
import {
  registerVote,
  resolveAssassinsPhase,
  setAssassinTarget,
} from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { MatchStatus } from '@/entities/match/model/matchStatus'
import { MatchWinner } from '@/entities/match/model/victory'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

const ENDED_AT = '2026-01-01T02:00:00.000Z'
const CURRENT_TURN = 3

function makeNightSession(roles) {
  return makeValidSession({
    phase: MatchPhase.ASSASSINS_ACTIONS,
    currentTurn: CURRENT_TURN,
    participants: makeParticipants(roles),
    match: { turnCount: CURRENT_TURN - 1 },
  })
}

function makeVotingSession(roles) {
  return makeValidSession({
    phase: MatchPhase.VOTING,
    currentTurn: CURRENT_TURN,
    participants: makeParticipants(roles),
    match: { turnCount: CURRENT_TURN - 1 },
  })
}

function expectBulkStatuses(session, phase) {
  for (const participant of session.match.participants) {
    if (participant.role === PlayerRole.ASSASSIN) {
      expect(participant.status).toBe(PlayerStatus.ALIVE)
    } else {
      expect(participant.status).toBe(PlayerStatus.DEAD)
      expect(participant.eliminatedAt).toEqual({
        turn: CURRENT_TURN,
        phase,
      })
    }
  }
}

describe('vitória dos assassinos com status em massa', () => {
  it('aplica status em massa na fase noturna antes de finalizar', () => {
    let session = makeNightSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    session = setAssassinTarget(session, 'mp-1', 'mp-3')

    const next = resolveAssassinsPhase(session, ENDED_AT)

    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.match.status).toBe(MatchStatus.FINISHED)
    expect(next.phase).toBe(MatchPhase.FINISHED)
    expectBulkStatuses(next, 'NIGHT')
  })

  it('aplica status em massa na votação antes de finalizar', () => {
    const session = makeVotingSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])

    const next = registerVote(
      session,
      { type: 'ELIMINATION', participantId: 'mp-4' },
      ENDED_AT,
    )

    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.match.status).toBe(MatchStatus.FINISHED)
    expect(next.phase).toBe(MatchPhase.FINISHED)
    expectBulkStatuses(next, 'VOTE')
  })

  it('não aplica status em massa na vitória dos inocentes', () => {
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

    expect(next.match.winner).toBe(MatchWinner.INNOCENTS)
    expect(
      next.match.participants
        .filter((participant) => participant.role !== PlayerRole.ASSASSIN)
        .every((participant) => participant.status === PlayerStatus.ALIVE),
    ).toBe(true)
  })
})
