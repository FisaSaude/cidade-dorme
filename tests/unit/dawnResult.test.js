import { describe, expect, it } from 'vitest'
import {
  NO_DEATHS_MESSAGE,
  getDawnResult,
} from '@/features/dawn-and-voting/model/dawnResult'
import { getVotingOptions } from '@/features/dawn-and-voting/model/votingOptions'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { makeParticipants, makeValidSession } from '../fixtures/sessionBuilder'

const NAMES = {
  'participant-1': 'Ana',
  'participant-2': 'Bruno',
  'participant-3': 'Carla',
  'participant-4': 'Davi',
  'participant-5': 'Elisa',
}

describe('dawnResult', () => {
  it('deriva os nomes dos eliminados da noite', () => {
    const session = makeValidSession({
      nightResult: {
        eliminatedParticipantIds: ['participant-3', 'participant-5'],
      },
    })

    const result = getDawnResult(session, NAMES)

    expect(result.eliminatedNames).toEqual(['Carla', 'Elisa'])
    expect(result.hasDeaths).toBe(true)
    expect(result.message).toContain('Carla')
    expect(result.message).toContain('Elisa')
  })

  it('usa a mensagem de nenhuma morte quando não há eliminados', () => {
    const session = makeValidSession({ nightResult: { eliminatedParticipantIds: [] } })

    expect(getDawnResult(session, NAMES)).toEqual({
      eliminatedNames: [],
      hasDeaths: false,
      message: NO_DEATHS_MESSAGE,
    })
    expect(NO_DEATHS_MESSAGE).toBe('Ninguém foi assassinado nesta noite')
  })

  it('trata ausência de resultado noturno como nenhuma morte', () => {
    const session = makeValidSession({ nightResult: null })

    expect(getDawnResult(session, NAMES).hasDeaths).toBe(false)
  })
})

describe('votingOptions', () => {
  it('oferece apenas participantes vivos', () => {
    const participants = makeParticipants([
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.DETECTIVE,
      PlayerRole.INNOCENT,
    ])
    participants[2].status = PlayerStatus.DEAD
    participants[2].eliminatedAt = { turn: 1, phase: 'NIGHT' }

    const session = makeValidSession({ participants })
    const options = getVotingOptions(session, NAMES)

    expect(options.map((option) => option.label)).toEqual([
      'Ana',
      'Bruno',
      'Davi',
      'Elisa',
    ])
    expect(options.map((option) => option.value)).toEqual([
      'mp-1',
      'mp-2',
      'mp-4',
      'mp-5',
    ])
  })

  it('usa o participantId como fallback quando não há nome', () => {
    const session = makeValidSession()

    expect(getVotingOptions(session)[0]).toEqual({
      value: 'mp-1',
      label: 'participant-1',
    })
  })
})
