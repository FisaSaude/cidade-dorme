import { describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '@/shared/api/httpClient'
import { ApiError } from '@/shared/lib/errors'

function makeResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }
}

describe('httpClient', () => {
  it('lê JSON de um GET bem-sucedido usando a base /api', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse([{ id: '1' }]))
    const client = createHttpClient({ fetchImpl })

    const data = await client.get('/participants')

    expect(data).toEqual([{ id: '1' }])
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/participants',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    )
  })

  it('serializa o corpo JSON em POST', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeResponse({ id: '1', name: 'Ana' }, 201))
    const client = createHttpClient({ fetchImpl })

    await client.post('/participants', { id: '1', name: 'Ana' })

    const [, init] = fetchImpl.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ id: '1', name: 'Ana' }))
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('lança ApiError em resposta 404', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse({}, 404))
    const client = createHttpClient({ fetchImpl })

    await expect(client.get('/participants/missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    })
  })

  it('lança ApiError em resposta 500', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(makeResponse({}, 500))
    const client = createHttpClient({ fetchImpl })

    await expect(client.get('/participants')).rejects.toBeInstanceOf(ApiError)
    await expect(client.get('/participants')).rejects.toMatchObject({ status: 500 })
  })

  it('lança ApiError com status nulo em erro de rede', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('network down'))
    const client = createHttpClient({ fetchImpl })

    await expect(client.get('/participants')).rejects.toMatchObject({
      name: 'ApiError',
      status: null,
    })
  })
})
