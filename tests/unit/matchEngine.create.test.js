import { describe, expect, it } from 'vitest'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { createMatchSession } from '@/entities/match/model/matchEngine'
import { MatchStatus } from '@/entities/match/model/matchStatus'
import { evaluateVictory } from '@/entities/match/model/victory'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { GameRuleError } from '@/shared/lib/errors'

function makeEntries(roles, prefix = 'p') {
  return roles.map((role, index) => ({
    participantId: `${prefix}-${index + 1}`,
    role,
  }))
}

function makeContext() {
  let counter = 0

  return {
    matchId: 'match-1',
    startedAt: '2026-01-01T00:00:00.000Z',
    idFactory: () => {
      counter += 1
      return `mp-${counter}`
    },
  }
}

function makeConfiguration(roles = [
  PlayerRole.ASSASSIN,
  PlayerRole.DETECTIVE,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
]) {
  return { participants: makeEntries(roles) }
}

function expectCode(action, code) {
  try {
    action()
  } catch (error) {
    expect(error).toBeInstanceOf(GameRuleError)
    expect(error.code).toBe(code)
    return
  }

  throw new Error(`Expected GameRuleError with code ${code}.`)
}

describe('createMatchSession', () => {
  it('cria a sessão inicial no turno 1 com todos vivos', () => {
    const session = createMatchSession(makeConfiguration(), makeContext())

    expect(session.match.id).toBe('match-1')
    expect(session.match.status).toBe(MatchStatus.IN_PROGRESS)
    expect(session.match.closureReason).toBeNull()
    expect(session.match.winner).toBeNull()
    expect(session.match.startedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(session.match.endedAt).toBeNull()
    expect(session.match.turnCount).toBe(0)

    expect(session.phase).toBe(MatchPhase.TURN_START)
    expect(session.currentTurn).toBe(1)
    expect(session.assassinTargets).toEqual({})
    expect(session.investigations).toEqual({})
    expect(session.nightResult).toBeNull()
    expect(session.voteResult).toBeNull()

    expect(session.match.participants).toHaveLength(5)
    expect(
      session.match.participants.every(
        (participant) =>
          participant.status === PlayerStatus.ALIVE && participant.eliminatedAt === null,
      ),
    ).toBe(true)
  })

  it('atribui exatamente um papel por participante', () => {
    const session = createMatchSession(makeConfiguration(), makeContext())

    expect(session.match.participants.map((participant) => participant.role)).toEqual([
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    expect(
      session.match.participants.map((participant) => participant.participantId),
    ).toEqual(['p-1', 'p-2', 'p-3', 'p-4', 'p-5'])
    expect(
      new Set(session.match.participants.map((participant) => participant.participantId))
        .size,
    ).toBe(5)
  })

  it('gera MatchParticipant.id únicos com o gerador injetado', () => {
    const session = createMatchSession(makeConfiguration(), makeContext())
    const ids = session.match.participants.map((participant) => participant.id)

    expect(ids).toEqual(['mp-1', 'mp-2', 'mp-3', 'mp-4', 'mp-5'])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('rejeita menos de cinco participantes', () => {
    expectCode(
      () =>
        createMatchSession(
          makeConfiguration([
            PlayerRole.ASSASSIN,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
          ]),
          makeContext(),
        ),
      'MIN_PARTICIPANTS',
    )
  })

  it('rejeita configuração sem assassino', () => {
    expectCode(
      () =>
        createMatchSession(
          makeConfiguration([
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
          ]),
          makeContext(),
        ),
      'NO_ASSASSIN',
    )
  })

  it('rejeita papel inválido', () => {
    expectCode(
      () =>
        createMatchSession(
          {
            participants: makeEntries([
              PlayerRole.ASSASSIN,
              'MAYOR',
              PlayerRole.INNOCENT,
              PlayerRole.INNOCENT,
              PlayerRole.INNOCENT,
            ]),
          },
          makeContext(),
        ),
      'INVALID_ROLE',
    )
  })

  it('rejeita participante repetido', () => {
    const entries = makeEntries([
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    entries[4] = { participantId: entries[0].participantId, role: PlayerRole.INNOCENT }

    expectCode(
      () => createMatchSession({ participants: entries }, makeContext()),
      'DUPLICATE_PARTICIPANT',
    )
  })

  it('permite configuração com todos os assassinos (D7)', () => {
    const session = createMatchSession(
      makeConfiguration(Array.from({ length: 5 }, () => PlayerRole.ASSASSIN)),
      makeContext(),
    )

    expect(
      session.match.participants.every(
        (participant) => participant.role === PlayerRole.ASSASSIN,
      ),
    ).toBe(true)
    expect(evaluateVictory(session)).toBe('ASSASSINS')
  })
})
