import { describe, expect, it } from 'vitest'
import {
  createMatchParticipant,
  eliminateMatchParticipant,
  isMatchParticipantAlive,
  validateEliminatedAt,
} from '@/entities/match-participant/model/matchParticipant'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'

describe('matchParticipant', () => {
  it('cria participante vivo com eliminatedAt nulo', () => {
    const matchParticipant = createMatchParticipant({
      id: 'mp-1',
      participantId: 'p-1',
      role: PlayerRole.ASSASSIN,
    })

    expect(matchParticipant).toEqual({
      id: 'mp-1',
      participantId: 'p-1',
      role: PlayerRole.ASSASSIN,
      status: PlayerStatus.ALIVE,
      eliminatedAt: null,
    })
    expect(isMatchParticipantAlive(matchParticipant)).toBe(true)
  })

  it('mantém o papel imutável', () => {
    const matchParticipant = createMatchParticipant({
      id: 'mp-1',
      participantId: 'p-1',
      role: PlayerRole.DETECTIVE,
    })

    expect(Object.getOwnPropertyDescriptor(matchParticipant, 'role')?.writable).toBe(
      false,
    )
    expect(() => {
      matchParticipant.role = PlayerRole.INNOCENT
    }).toThrow()
    expect(matchParticipant.role).toBe(PlayerRole.DETECTIVE)
  })

  it('elimina preservando o papel e registrando o momento', () => {
    const matchParticipant = createMatchParticipant({
      id: 'mp-1',
      participantId: 'p-1',
      role: PlayerRole.ASSASSIN,
    })

    const eliminated = eliminateMatchParticipant(matchParticipant, {
      turn: 2,
      phase: 'VOTE',
    })

    expect(eliminated.status).toBe(PlayerStatus.DEAD)
    expect(eliminated.eliminatedAt).toEqual({ turn: 2, phase: 'VOTE' })
    expect(eliminated.role).toBe(PlayerRole.ASSASSIN)
    expect(isMatchParticipantAlive(eliminated)).toBe(false)
    expect(matchParticipant.status).toBe(PlayerStatus.ALIVE)

    const roleDescriptor = Object.getOwnPropertyDescriptor(eliminated, 'role')
    expect(roleDescriptor?.writable).toBe(false)
    expect(roleDescriptor?.configurable).toBe(false)
    expect(() => {
      eliminated.role = PlayerRole.INNOCENT
    }).toThrow()
    expect(eliminated.role).toBe(PlayerRole.ASSASSIN)
  })

  it('garante status DEAD se e somente se eliminatedAt não for nulo', () => {
    const alive = createMatchParticipant({
      id: 'mp-1',
      participantId: 'p-1',
      role: PlayerRole.INNOCENT,
    })
    const dead = eliminateMatchParticipant(alive, { turn: 1, phase: 'NIGHT' })

    expect(alive.status === PlayerStatus.DEAD).toBe(alive.eliminatedAt !== null)
    expect(dead.status === PlayerStatus.DEAD).toBe(dead.eliminatedAt !== null)
  })

  it('rejeita eliminatedAt inválido', () => {
    expect(() => validateEliminatedAt(null)).toThrow(TypeError)
    expect(() => validateEliminatedAt({ turn: 0, phase: 'NIGHT' })).toThrow(TypeError)
    expect(() => validateEliminatedAt({ turn: 1.5, phase: 'NIGHT' })).toThrow(
      TypeError,
    )
    expect(() => validateEliminatedAt({ turn: 1, phase: 'DAWN' })).toThrow(TypeError)
  })

  it('rejeita papel inválido e identificadores ausentes', () => {
    expect(() =>
      createMatchParticipant({ id: 'mp-1', participantId: 'p-1', role: 'MAYOR' }),
    ).toThrow(TypeError)
    expect(() =>
      createMatchParticipant({ id: '', participantId: 'p-1' }),
    ).toThrow(TypeError)
    expect(() =>
      createMatchParticipant({ id: 'mp-1', participantId: '' }),
    ).toThrow(TypeError)
  })
})
