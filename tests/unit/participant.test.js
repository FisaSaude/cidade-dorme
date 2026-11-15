import { describe, expect, it } from 'vitest'
import {
  createParticipant,
  isDuplicateParticipantName,
  normalizeParticipantName,
  renameParticipant,
  validateParticipantName,
} from '@/entities/participant/model/participant'
import { GameRuleError } from '@/shared/lib/errors'

const participants = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
]

describe('participant', () => {
  it('normaliza o nome removendo espaços nas extremidades', () => {
    expect(normalizeParticipantName('  Ana Maria  ')).toBe('Ana Maria')
    expect(normalizeParticipantName(null)).toBe('')
    expect(normalizeParticipantName(undefined)).toBe('')
  })

  it('exige nome obrigatório e não vazio após trim', () => {
    expect(() => validateParticipantName('', participants)).toThrow(GameRuleError)
    expect(() => validateParticipantName('   ', participants)).toThrow(GameRuleError)

    try {
      validateParticipantName('   ', participants)
    } catch (error) {
      expect(error.code).toBe('PARTICIPANT_NAME_REQUIRED')
    }
  })

  it('detecta duplicado sem diferenciar maiúsculas e minúsculas', () => {
    expect(isDuplicateParticipantName(participants, 'ana')).toBe(true)
    expect(isDuplicateParticipantName(participants, ' ANA ')).toBe(true)
    expect(isDuplicateParticipantName(participants, 'Carla')).toBe(false)
  })

  it('ignora o próprio id na detecção de duplicado', () => {
    expect(isDuplicateParticipantName(participants, 'ana', 'p-1')).toBe(false)
    expect(isDuplicateParticipantName(participants, 'bruno', 'p-1')).toBe(true)
  })

  it('bloqueia nome duplicado com código de domínio', () => {
    try {
      validateParticipantName('ANA', participants)
    } catch (error) {
      expect(error).toBeInstanceOf(GameRuleError)
      expect(error.code).toBe('PARTICIPANT_NAME_DUPLICATED')
    }
  })

  it('preserva a grafia informada ao criar o participante', () => {
    const participant = createParticipant({ id: 'p-3', name: '  Carla Souza  ' })

    expect(participant).toEqual({ id: 'p-3', name: 'Carla Souza' })
  })

  it('preserva o id ao renomear', () => {
    const renamed = renameParticipant(participants[0], ' Ana Maria ')

    expect(renamed).toEqual({ id: 'p-1', name: 'Ana Maria' })
    expect(participants[0]).toEqual({ id: 'p-1', name: 'Ana' })
  })

  it('rejeita id ausente ao criar', () => {
    expect(() => createParticipant({ name: 'Ana' })).toThrow(TypeError)
    expect(() => createParticipant({ id: '   ', name: 'Ana' })).toThrow(TypeError)
  })
})
