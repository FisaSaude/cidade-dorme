import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { MatchStatus } from '@/entities/match/model/matchStatus'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { GameRuleError } from '@/shared/lib/errors'

function makeConfiguration(roles = [
  PlayerRole.ASSASSIN,
  PlayerRole.DETECTIVE,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
]) {
  return {
    participants: roles.map((role, index) => ({
      participantId: `p-${index + 1}`,
      role,
    })),
  }
}

function makeIdFactory() {
  let counter = 0

  return () => {
    counter += 1
    return `generated-${counter}`
  }
}

function wrapperWith(services) {
  return function Wrapper({ children }) {
    return (
      <AppProviders services={services}>
        <MatchSessionProvider>{children}</MatchSessionProvider>
      </AppProviders>
    )
  }
}

describe('MatchSessionProvider', () => {
  it('inicia sem sessão ativa', () => {
    const { result } = renderHook(() => useMatchSession(), {
      wrapper: wrapperWith({}),
    })

    expect(result.current.session).toBeNull()
    expect(result.current.hasActiveSession).toBe(false)
    expect(result.current.activeParticipantIds).toEqual([])
  })

  it('cria a sessão usando idFactory e now injetados', () => {
    const idFactory = makeIdFactory()
    const { result } = renderHook(() => useMatchSession(), {
      wrapper: wrapperWith({
        idFactory,
        now: () => '2026-05-01T10:00:00.000Z',
      }),
    })

    let session

    act(() => {
      session = result.current.startMatch(makeConfiguration())
    })

    expect(session.match.id).toBe('generated-1')
    expect(session.match.startedAt).toBe('2026-05-01T10:00:00.000Z')
    expect(session.match.status).toBe(MatchStatus.IN_PROGRESS)
    expect(session.phase).toBe(MatchPhase.TURN_START)
    expect(session.currentTurn).toBe(1)
    expect(session.match.participants).toHaveLength(5)
    expect(
      session.match.participants.every(
        (participant) =>
          participant.status === PlayerStatus.ALIVE && participant.eliminatedAt === null,
      ),
    ).toBe(true)
    expect(
      session.match.participants.map((participant) => participant.id),
    ).toEqual([
      'generated-2',
      'generated-3',
      'generated-4',
      'generated-5',
      'generated-6',
    ])

    expect(result.current.session).toBe(session)
    expect(result.current.hasActiveSession).toBe(true)
    expect(result.current.activeParticipantIds).toEqual([
      'p-1',
      'p-2',
      'p-3',
      'p-4',
      'p-5',
    ])
  })

  it('propaga erros de configuração sem criar sessão', () => {
    const { result } = renderHook(() => useMatchSession(), {
      wrapper: wrapperWith({ idFactory: makeIdFactory() }),
    })

    let thrown

    act(() => {
      try {
        result.current.startMatch(
          makeConfiguration([
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
          ]),
        )
      } catch (error) {
        thrown = error
      }
    })

    expect(thrown).toBeInstanceOf(GameRuleError)
    expect(thrown.code).toBe('MIN_PARTICIPANTS')
    expect(result.current.session).toBeNull()
    expect(result.current.hasActiveSession).toBe(false)
  })
})
