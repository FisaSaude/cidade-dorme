import { describe, expect, it } from 'vitest'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import {
  MIN_PARTICIPANTS,
  createMatchConfiguration,
  validateMatchConfiguration,
} from '@/entities/match/model/matchConfiguration'
import { GameRuleError } from '@/shared/lib/errors'

function makeEntries(roles, prefix = 'p') {
  return roles.map((role, index) => ({
    participantId: `${prefix}-${index + 1}`,
    role,
  }))
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

const VALID_ROLES = [
  PlayerRole.ASSASSIN,
  PlayerRole.DETECTIVE,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
  PlayerRole.INNOCENT,
]

describe('matchConfiguration', () => {
  it('exige o mínimo de cinco participantes', () => {
    expect(MIN_PARTICIPANTS).toBe(5)

    expectCode(
      () => createMatchConfiguration(makeEntries(VALID_ROLES.slice(0, 4))),
      'MIN_PARTICIPANTS',
    )
  })

  it('exige pelo menos um assassino', () => {
    expectCode(
      () =>
        createMatchConfiguration(
          makeEntries([
            PlayerRole.DETECTIVE,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
            PlayerRole.INNOCENT,
          ]),
        ),
      'NO_ASSASSIN',
    )
  })

  it('bloqueia participante repetido', () => {
    const entries = makeEntries(VALID_ROLES)
    entries[4] = { participantId: entries[0].participantId, role: PlayerRole.INNOCENT }

    expectCode(() => createMatchConfiguration(entries), 'DUPLICATE_PARTICIPANT')
  })

  it('bloqueia papel inválido', () => {
    const entries = makeEntries(VALID_ROLES)
    entries[2] = { ...entries[2], role: 'VILLAGER' }

    expectCode(() => createMatchConfiguration(entries), 'INVALID_ROLE')
  })

  it('normaliza papel ausente para inocente', () => {
    const entries = makeEntries(VALID_ROLES)
    entries[1] = { participantId: entries[1].participantId }
    entries[2] = { participantId: entries[2].participantId, role: null }
    entries[3] = { participantId: entries[3].participantId, role: undefined }

    const configuration = createMatchConfiguration(entries)

    expect(configuration.participants.map((entry) => entry.role)).toEqual([
      PlayerRole.ASSASSIN,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
      PlayerRole.INNOCENT,
    ])
  })

  it('mantém um único papel por participantId e preserva a ordem', () => {
    const configuration = createMatchConfiguration(makeEntries(VALID_ROLES))

    expect(configuration.participants).toHaveLength(5)
    expect(configuration.participants.map((entry) => entry.participantId)).toEqual([
      'p-1',
      'p-2',
      'p-3',
      'p-4',
      'p-5',
    ])
    expect(new Set(configuration.participants.map((entry) => entry.participantId)).size).toBe(
      5,
    )
  })

  it('permite configuração com todos os participantes assassinos', () => {
    const configuration = createMatchConfiguration(
      makeEntries(Array.from({ length: 5 }, () => PlayerRole.ASSASSIN)),
    )

    expect(
      configuration.participants.every((entry) => entry.role === PlayerRole.ASSASSIN),
    ).toBe(true)
  })

  it('valida e normaliza uma configuração existente', () => {
    const configuration = validateMatchConfiguration({
      participants: makeEntries(VALID_ROLES),
    })

    expect(configuration.participants).toHaveLength(5)
    expect(configuration.participants[0]).toEqual({
      participantId: 'p-1',
      role: PlayerRole.ASSASSIN,
    })
  })

  it('bloqueia participante sem identificador', () => {
    const entries = makeEntries(VALID_ROLES)
    entries[0] = { participantId: '   ', role: PlayerRole.ASSASSIN }

    expectCode(() => createMatchConfiguration(entries), 'INVALID_PARTICIPANT')
  })
})
