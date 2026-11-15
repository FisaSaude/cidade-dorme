import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SCREENS } from '@/app/navigation/screens'
import { useAppNavigation } from '@/app/navigation/useAppNavigation'

describe('useAppNavigation', () => {
  it('inicia na tela de participantes', () => {
    const { result } = renderHook(() => useAppNavigation())
    expect(result.current.activeScreen).toBe(SCREENS.PARTICIPANTS)
    expect(result.current.params).toBeNull()
  })

  it('navega para outra tela com parâmetros simples', () => {
    const { result } = renderHook(() => useAppNavigation())
    let allowed

    act(() => {
      allowed = result.current.navigate(SCREENS.HISTORY, { matchId: 'm-1' })
    })

    expect(allowed).toBe(true)
    expect(result.current.activeScreen).toBe(SCREENS.HISTORY)
    expect(result.current.params).toEqual({ matchId: 'm-1' })
  })

  it('bloqueia nova configuração quando há sessão ativa', () => {
    const { result } = renderHook(() =>
      useAppNavigation({ hasActiveSession: true }),
    )
    let allowed

    act(() => {
      allowed = result.current.navigate(SCREENS.MATCH_SETUP)
    })

    expect(allowed).toBe(false)
    expect(result.current.activeScreen).toBe(SCREENS.PARTICIPANTS)
  })

  it('permite configuração sem sessão ativa', () => {
    const { result } = renderHook(() =>
      useAppNavigation({ hasActiveSession: false }),
    )
    let allowed

    act(() => {
      allowed = result.current.navigate(SCREENS.MATCH_SETUP)
    })

    expect(allowed).toBe(true)
    expect(result.current.activeScreen).toBe(SCREENS.MATCH_SETUP)
  })
})
