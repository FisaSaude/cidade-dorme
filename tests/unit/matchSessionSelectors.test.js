import { describe, expect, it } from 'vitest'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import {
  getAliveAssassins,
  getAliveDetectives,
  getAliveParticipants,
  getDeadParticipants,
  getEligibleTargets,
  getParticipantById,
} from '@/entities/match/model/matchSession'
import { makeMatchParticipant, makeSession } from '../fixtures/sessionBuilder'

function makeSelectorsSession() {
  return makeSession({
    participants: [
      makeMatchParticipant({ index: 1, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 2, role: PlayerRole.ASSASSIN }),
      makeMatchParticipant({ index: 3, role: PlayerRole.INNOCENT }),
      makeMatchParticipant({ index: 4, role: PlayerRole.DETECTIVE }),
      makeMatchParticipant({
        index: 5,
        role: PlayerRole.INNOCENT,
        status: PlayerStatus.DEAD,
      }),
    ],
  })
}

describe('matchSession selectors', () => {
  it('separa vivos e mortos', () => {
    const session = makeSelectorsSession()

    expect(getAliveParticipants(session).map((p) => p.id)).toEqual([
      'mp-1',
      'mp-2',
      'mp-3',
      'mp-4',
    ])
    expect(getDeadParticipants(session).map((p) => p.id)).toEqual(['mp-5'])
  })

  it('separa assassinos e detetives vivos', () => {
    const session = makeSelectorsSession()

    expect(getAliveAssassins(session).map((p) => p.id)).toEqual(['mp-1', 'mp-2'])
    expect(getAliveDetectives(session).map((p) => p.id)).toEqual(['mp-4'])
  })

  it('encontra participante por id da participação e por participantId', () => {
    const session = makeSelectorsSession()

    expect(getParticipantById(session, 'mp-3')?.role).toBe(PlayerRole.INNOCENT)
    expect(getParticipantById(session, 'participant-2')?.id).toBe('mp-2')
    expect(getParticipantById(session, 'inexistente')).toBeUndefined()
  })

  it('não oferece mortos nem o próprio ator como alvo', () => {
    const session = makeSelectorsSession()

    expect(getEligibleTargets(session, 'mp-1').map((p) => p.id)).toEqual([
      'mp-2',
      'mp-3',
      'mp-4',
    ])
  })

  it('permite que assassinos tenham outros assassinos como alvo', () => {
    const session = makeSelectorsSession()
    const targets = getEligibleTargets(session, 'mp-1')

    expect(targets.some((p) => p.role === PlayerRole.ASSASSIN)).toBe(true)
  })
})
