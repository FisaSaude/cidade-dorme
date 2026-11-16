import { describe, expect, it } from 'vitest'
import {
  resolveAssassinsPhase,
  setAssassinTarget,
} from '@/entities/match/model/matchEngine'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

function makeSession(roles) {
  return makeValidSession({
    phase: MatchPhase.ASSASSINS_ACTIONS,
    participants: makeParticipants(roles),
    currentTurn: 2,
  })
}

describe('matchEngine resolveAssassinsPhase', () => {
  it('elimina alvo repetido apenas uma vez e registra nightResult', () => {
    let session = makeSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])

    session = setAssassinTarget(session, 'mp-1', 'mp-4')
    session = setAssassinTarget(session, 'mp-2', 'mp-4')

    const next = resolveAssassinsPhase(session, '2026-01-01T01:00:00.000Z')

    const eliminated = next.match.participants.find((participant) => participant.id === 'mp-4')
    expect(eliminated.status).toBe(PlayerStatus.DEAD)
    expect(eliminated.eliminatedAt).toEqual({ turn: 2, phase: 'NIGHT' })
    expect(next.nightResult).toEqual({ eliminatedParticipantIds: ['participant-4'] })
  })

  it('elimina alvos distintos em conjunto', () => {
    let session = makeSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    session = setAssassinTarget(session, 'mp-1', 'mp-4')
    session = setAssassinTarget(session, 'mp-2', 'mp-5')

    const next = resolveAssassinsPhase(session, '2026-01-01T01:00:00.000Z')

    expect(next.match.participants.find((participant) => participant.id === 'mp-4').status).toBe(
      PlayerStatus.DEAD,
    )
    expect(next.match.participants.find((participant) => participant.id === 'mp-5').status).toBe(
      PlayerStatus.DEAD,
    )
  })

  it('mantém escolha de assassino que também morre na mesma resolução', () => {
    let session = makeSession([
      PlayerRole.ASSASSIN,
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])

    session = setAssassinTarget(session, 'mp-1', 'mp-2')
    session = setAssassinTarget(session, 'mp-2', 'mp-1')

    const next = resolveAssassinsPhase(session, '2026-01-01T01:00:00.000Z')

    expect(next.match.participants.find((participant) => participant.id === 'mp-1').status).toBe(
      PlayerStatus.DEAD,
    )
    expect(next.match.participants.find((participant) => participant.id === 'mp-2').status).toBe(
      PlayerStatus.DEAD,
    )
  })

  it('segue para detetives quando ainda há detetive vivo', () => {
    let session = makeSession([
      PlayerRole.ASSASSIN,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    session = setAssassinTarget(session, 'mp-1', null)

    const next = resolveAssassinsPhase(session, '2026-01-01T01:00:00.000Z')
    expect(next.phase).toBe(MatchPhase.DETECTIVES_ANNOUNCEMENT)
  })

  it('omite detetives quando não há detetive vivo', () => {
    let session = makeSession([
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    session = setAssassinTarget(session, 'mp-1', null)

    const next = resolveAssassinsPhase(session, '2026-01-01T01:00:00.000Z')
    expect(next.phase).toBe(MatchPhase.DAWN_ANNOUNCEMENT)
  })

  it('encerra por vitória antes de detetives e votação', () => {
    let session = makeSession([
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
    session = setAssassinTarget(session, 'mp-1', 'mp-2')
    session.match.participants[2].status = PlayerStatus.DEAD
    session.match.participants[2].eliminatedAt = { turn: 1, phase: 'NIGHT' }
    session.match.participants[3].status = PlayerStatus.DEAD
    session.match.participants[3].eliminatedAt = { turn: 1, phase: 'NIGHT' }
    session.match.participants[4].status = PlayerStatus.DEAD
    session.match.participants[4].eliminatedAt = { turn: 1, phase: 'NIGHT' }

    const next = resolveAssassinsPhase(session, '2026-01-01T01:00:00.000Z')

    expect(next.phase).toBe(MatchPhase.FINISHED)
    expect(next.match.status).toBe('FINISHED')
    expect(next.match.winner).toBe('ASSASSINS')
    expect(next.match.turnCount).toBe(1)
  })
})
