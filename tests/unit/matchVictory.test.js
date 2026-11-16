import { describe, expect, it } from 'vitest'
import {
  registerVote,
  resolveAssassinsPhase,
  setAssassinTarget,
} from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import {
  MatchClosureReason,
  MatchStatus,
} from '@/entities/match/model/matchStatus'
import { MatchWinner } from '@/entities/match/model/victory'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

const ENDED_AT = '2026-01-01T02:00:00.000Z'

function makeNightSession(roles, overrides = {}) {
  return makeValidSession({
    phase: MatchPhase.ASSASSINS_ACTIONS,
    currentTurn: 3,
    participants: makeParticipants(roles),
    match: { turnCount: 2 },
    ...overrides,
  })
}

function makeVotingSession(roles, overrides = {}) {
  return makeValidSession({
    phase: MatchPhase.VOTING,
    currentTurn: 3,
    participants: makeParticipants(roles),
    match: { turnCount: 2 },
    ...overrides,
  })
}

describe('vitória automática', () => {
  it('encerra com inocentes quando o último assassino é eliminado à noite', () => {
    let session = makeNightSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])

    session = setAssassinTarget(session, 'mp-1', 'mp-2')
    session = setAssassinTarget(session, 'mp-2', 'mp-1')

    const next = resolveAssassinsPhase(session, ENDED_AT)

    expect(next.match.status).toBe(MatchStatus.FINISHED)
    expect(next.match.closureReason).toBe(MatchClosureReason.VICTORY)
    expect(next.match.winner).toBe(MatchWinner.INNOCENTS)
    expect(next.phase).toBe(MatchPhase.FINISHED)
    expect(next.match.endedAt).toBe(ENDED_AT)
    expect(next.match.turnCount).toBe(3)
    expect(next.currentTurn).toBe(3)
    expect(next.nightResult).toEqual({
      eliminatedParticipantIds: ['participant-1', 'participant-2'],
    })
    expect(next.voteResult).toBeNull()
  })

  it('não executa detetives nem votação após vitória noturna', () => {
    let session = makeNightSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    session = setAssassinTarget(session, 'mp-1', 'mp-4')

    const next = resolveAssassinsPhase(session, ENDED_AT)

    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.phase).toBe(MatchPhase.FINISHED)
    expect(next.phase).not.toBe(MatchPhase.DETECTIVES_ANNOUNCEMENT)
    expect(next.phase).not.toBe(MatchPhase.VOTING)
  })

  it('considera vitória dos assassinos em paridade após a noite', () => {
    let session = makeNightSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.DETECTIVE,
    ])
    session = setAssassinTarget(session, 'mp-1', 'mp-3')

    const next = resolveAssassinsPhase(session, ENDED_AT)

    const aliveAssassins = next.match.participants.filter(
      (participant) =>
        participant.role === PlayerRole.ASSASSIN &&
        participant.status === PlayerStatus.ALIVE,
    )
    const aliveOthers = next.match.participants.filter(
      (participant) =>
        participant.role !== PlayerRole.ASSASSIN &&
        participant.status === PlayerStatus.ALIVE,
    )

    expect(aliveAssassins).toHaveLength(2)
    expect(aliveOthers).toHaveLength(2)
    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.match.turnCount).toBe(3)
  })

  it('considera vitória dos assassinos em superioridade após a noite', () => {
    let session = makeNightSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.DETECTIVE,
    ])
    session = setAssassinTarget(session, 'mp-1', 'mp-4')

    const next = resolveAssassinsPhase(session, ENDED_AT)

    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.match.status).toBe(MatchStatus.FINISHED)
  })

  it('encerra com inocentes quando o último assassino é eliminado na votação', () => {
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
    expect(next.match.closureReason).toBe(MatchClosureReason.VICTORY)
    expect(next.match.winner).toBe(MatchWinner.INNOCENTS)
    expect(next.phase).toBe(MatchPhase.FINISHED)
    expect(next.match.endedAt).toBe(ENDED_AT)
    expect(next.match.turnCount).toBe(3)
    expect(next.currentTurn).toBe(3)
    expect(next.voteResult).toEqual({
      type: 'ELIMINATION',
      participantId: 'participant-1',
    })
  })

  it('não inicia novo turno após vitória na votação', () => {
    const session = makeVotingSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.DETECTIVE,
    ])

    const next = registerVote(
      session,
      { type: 'ELIMINATION', participantId: 'mp-3' },
      ENDED_AT,
    )

    expect(next.match.winner).toBe(MatchWinner.ASSASSINS)
    expect(next.phase).toBe(MatchPhase.FINISHED)
    expect(next.phase).not.toBe(MatchPhase.TURN_START)
    expect(next.currentTurn).toBe(3)
    expect(next.match.turnCount).toBe(3)
  })
})
