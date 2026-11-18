import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useBodyScrollLock } from '@/shared/lib/useBodyScrollLock'

afterEach(() => {
  document.body.style.overflow = ''
})

describe('useBodyScrollLock', () => {
  it('bloqueia o scroll e restaura o overflow anterior ao desmontar', () => {
    document.body.style.overflow = 'scroll'

    const { unmount } = renderHook(() => useBodyScrollLock(true))

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('scroll')
  })

  it('mantém o bloqueio enquanto múltiplos consumidores estão ativos', () => {
    document.body.style.overflow = ''

    const first = renderHook(() => useBodyScrollLock(true))
    const second = renderHook(() => useBodyScrollLock(true))

    expect(document.body.style.overflow).toBe('hidden')

    first.unmount()

    expect(document.body.style.overflow).toBe('hidden')

    second.unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('não altera o overflow quando inativo', () => {
    document.body.style.overflow = 'auto'

    const { unmount } = renderHook(() => useBodyScrollLock(false))

    expect(document.body.style.overflow).toBe('auto')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
  })

  it('não lança quando não há documento disponível', () => {
    expect(() => {
      renderHook(() => useBodyScrollLock(true, null))
    }).not.toThrow()
  })
})
