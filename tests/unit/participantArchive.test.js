import { describe, expect, it } from 'vitest'
import {
  archiveParticipant,
  createParticipant,
  isParticipantActive,
  normalizeParticipantDeletedAt,
  validateParticipantName,
} from '@/entities/participant/model/participant'
import { GameRuleError } from '@/shared/lib/errors'

const ARCHIVED_AT = '2026-11-17T21:00:00.000Z'

describe('arquivamento de participante', () => {
  it('considera ativo quando deletedAt é null ou ausente', () => {
    expect(isParticipantActive({ id: 'p-1', name: 'Ana', deletedAt: null })).toBe(
      true,
    )
    expect(isParticipantActive({ id: 'p-1', name: 'Ana' })).toBe(true)
    expect(normalizeParticipantDeletedAt(undefined)).toBeNull()
    expect(normalizeParticipantDeletedAt(null)).toBeNull()
  })

  it('considera arquivado quando deletedAt é uma data ISO', () => {
    const participant = { id: 'p-1', name: 'Ana', deletedAt: ARCHIVED_AT }

    expect(isParticipantActive(participant)).toBe(false)
    expect(normalizeParticipantDeletedAt(ARCHIVED_AT)).toBe(ARCHIVED_AT)
  })

  it('rejeita deletedAt com tipo inválido', () => {
    expect(() => normalizeParticipantDeletedAt(42)).toThrow(TypeError)
    expect(() => normalizeParticipantDeletedAt('')).toThrow(TypeError)
  })

  it('arquiva preservando id e o último nome informado', () => {
    const participant = { id: 'p-1', name: 'Ana Maria', deletedAt: null }
    const archived = archiveParticipant(participant, ARCHIVED_AT)

    expect(archived).toEqual({
      id: 'p-1',
      name: 'Ana Maria',
      deletedAt: ARCHIVED_AT,
    })
    expect(participant.deletedAt).toBeNull()
  })

  it('exige data ISO ao arquivar', () => {
    const participant = { id: 'p-1', name: 'Ana', deletedAt: null }

    expect(() => archiveParticipant(participant, '')).toThrow(TypeError)
    expect(() => archiveParticipant(participant, null)).toThrow(TypeError)
  })

  it('valida unicidade apenas entre participantes ativos', () => {
    const participants = [
      { id: 'p-1', name: 'Ana', deletedAt: ARCHIVED_AT },
      { id: 'p-2', name: 'Bruno', deletedAt: null },
    ]

    expect(() => validateParticipantName('Ana', participants)).not.toThrow()
    expect(() => validateParticipantName('ana', participants)).not.toThrow()
    expect(() => validateParticipantName('bruno', participants)).toThrow(
      GameRuleError,
    )
  })

  it('permite reutilizar o nome de um arquivado com identidades distintas', () => {
    const archived = archiveParticipant(
      { id: 'p-1', name: 'Ana', deletedAt: null },
      ARCHIVED_AT,
    )
    const reused = createParticipant({ id: 'p-2', name: 'Ana' })

    expect(reused.id).not.toBe(archived.id)
    expect(reused.deletedAt).toBeNull()
    expect(() =>
      validateParticipantName('Ana', [archived, reused], reused.id),
    ).not.toThrow()
  })
})
