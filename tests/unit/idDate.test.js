import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDatePtBr, formatDateTimePtBr, nowIso } from '@/shared/lib/date'
import { createId } from '@/shared/lib/id'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('gera um UUID v4', () => {
    expect(createId()).toMatch(UUID_PATTERN)
  })

  it('usa fallback quando crypto.randomUUID não está disponível', () => {
    vi.stubGlobal('crypto', {})
    expect(createId()).toMatch(UUID_PATTERN)
  })
})

describe('datas', () => {
  it('gera ISO 8601 UTC', () => {
    expect(nowIso(new Date('2026-11-14T20:00:00Z'))).toBe('2026-11-14T20:00:00.000Z')
  })

  it('formata data em pt-BR', () => {
    expect(formatDatePtBr('2026-11-14T12:00:00Z', { timeZone: 'UTC' })).toBe(
      '14/11/2026',
    )
  })

  it('formata data e hora em pt-BR', () => {
    expect(
      formatDateTimePtBr('2026-11-14T20:30:00Z', { timeZone: 'UTC' }),
    ).toContain('14/11/2026')
  })

  it('retorna string vazia para data inválida', () => {
    expect(formatDatePtBr('data-invalida')).toBe('')
    expect(formatDateTimePtBr('data-invalida')).toBe('')
  })

  it('rejeita data inválida na geração ISO', () => {
    expect(() => nowIso('data-invalida')).toThrow(TypeError)
  })
})
