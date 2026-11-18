import { describe, expect, it } from 'vitest'
import { applyAssassinsVictoryStatuses } from '@/entities/match/model/victory'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import {
  makeMatchParticipant,
  makeValidSession,
} from '../fixtures/sessionBuilder'

const DEAD_AT_TURN_1 = { turn: 1, phase: 'NIGHT' }

function makeSession(participants, currentTurn = 3) {
  return makeValidSession({
    currentTurn,
    participants,
    match: { participants, turnCount: currentTurn - 1 },
  })
}

describe('applyAssassinsVictoryStatuses', () => {
  it('mata em massa os não assassinos vivos no momento informado', () => {
    const participants = [
      makeMatchParticipant({ index: 1, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 2, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 3, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 4, role: PlayerRole.DETECTIVE }),
      makeMatchParticipant({ index: 5, role: PlayerRole.INNOCENT }),
    ]
    const session = makeSession(participants)

    const next = applyAssassinsVictoryStatuses(session, 'NIGHT')

    for (const participant of next.match.participants) {
      if (participant.role === PlayerRole.ASSASSIN) {
        expect(participant.status).toBe(PlayerStatus.ALIVE)
      } else {
        expect(participant.status).toBe(PlayerStatus.DEAD)
        expect(participant.eliminatedAt).toEqual({ turn: 3, phase: 'NIGHT' })
      }
    }
  })

  it('preserva o momento original dos não assassinos já mortos', () => {
    const participants = [
      makeMatchParticipant({ index: 1, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 2, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({
        index: 3,
        role: PlayerRole.DETECTIVE,
        status: PlayerStatus.DEAD,
        eliminatedAt: DEAD_AT_TURN_1,
      }),
      makeMatchParticipant({ index: 4, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 5, role: PlayerRole.INNOCENT }),
    ]

    const next = applyAssassinsVictoryStatuses(makeSession(participants), 'VOTE')
    const alreadyDead = next.match.participants[2]

    expect(alreadyDead.status).toBe(PlayerStatus.DEAD)
    expect(alreadyDead.eliminatedAt).toEqual(DEAD_AT_TURN_1)
  })

  it('não ressuscita assassinos mortos', () => {
    const participants = [
      makeMatchParticipant({
        index: 1,
        role: PlayerRole.ASSASSIN,
        status: PlayerStatus.DEAD,
        eliminatedAt: DEAD_AT_TURN_1,
      }),
      makeMatchParticipant({ index: 2, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 3, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 4, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 5, role: PlayerRole.INNOCENT }),
    ]

    const next = applyAssassinsVictoryStatuses(makeSession(participants), 'NIGHT')
    const deadAssassin = next.match.participants[0]

    expect(deadAssassin.status).toBe(PlayerStatus.DEAD)
    expect(deadAssassin.eliminatedAt).toEqual(DEAD_AT_TURN_1)
  })

  it('não altera papéis e retorna uma nova sessão', () => {
    const session = makeSession([
      makeMatchParticipant({ index: 1, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 2, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 3, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 4, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 5, role: PlayerRole.INNOCENT }),
    ])
    const rolesBefore = session.match.participants.map((item) => item.role)

    const next = applyAssassinsVictoryStatuses(session, 'VOTE')

    expect(next).not.toBe(session)
    expect(next.match).not.toBe(session.match)
    expect(next.match.participants[0]).toBe(session.match.participants[0])
    expect(next.match.participants.map((item) => item.role)).toEqual(rolesBefore)
    expect(session.match.participants[1].status).toBe(PlayerStatus.ALIVE)
  })

  it('rejeita fase inválida', () => {
    const session = makeSession([
      makeMatchParticipant({ index: 1, role: PlayerRole.ASSASSIN }),
    ])

    expect(() => applyAssassinsVictoryStatuses(session, 'DAWN')).toThrow(
      TypeError,
    )
    expect(() => applyAssassinsVictoryStatuses(session, null)).toThrow(TypeError)
  })
})
