import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncData } from '@/shared/lib/useAsyncData'

describe('useAsyncData', () => {
  it('carrega dados e alterna o estado de loading', async () => {
    const load = vi.fn().mockResolvedValue('dados')
    const { result } = renderHook(() => useAsyncData(load))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toBe('dados')
    expect(result.current.error).toBeNull()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('captura erros de carregamento', async () => {
    const error = new Error('falhou')
    const load = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useAsyncData(load))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(error)
    expect(result.current.data).toBeNull()
  })

  it('repete o carregamento ao chamar retry', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce('recuperado')
    const { result } = renderHook(() => useAsyncData(load))

    await waitFor(() => expect(result.current.error).toBeTruthy())

    act(() => {
      result.current.retry()
    })

    await waitFor(() => expect(result.current.data).toBe('recuperado'))
    expect(result.current.error).toBeNull()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
