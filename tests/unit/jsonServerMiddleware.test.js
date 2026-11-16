import { describe, expect, it, vi } from 'vitest'
import middleware from '../../json-server.middleware.cjs'

const [upsertMatchOnPut] = middleware

function createRequest({ method = 'PUT', path = '/matches/m-1', existingId } = {}) {
  return {
    method,
    path,
    url: path,
    app: {
      db: {
        get: vi.fn(() => ({
          getById: vi.fn(() => ({
            value: vi.fn(() => (existingId ? { id: existingId } : undefined)),
          })),
        })),
      },
    },
  }
}

describe('middleware de upsert de partidas', () => {
  it('converte o primeiro PUT de uma partida nova em POST', () => {
    const req = createRequest({ existingId: null })
    const next = vi.fn()

    upsertMatchOnPut(req, {}, next)

    expect(req.method).toBe('POST')
    expect(req.url).toBe('/matches')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('mantém o PUT quando a partida já existe', () => {
    const req = createRequest({ existingId: 'm-1' })
    const next = vi.fn()

    upsertMatchOnPut(req, {}, next)

    expect(req.method).toBe('PUT')
    expect(req.url).toBe('/matches/m-1')
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('ignora outros métodos e outros recursos', () => {
    const postRequest = createRequest({ method: 'POST' })
    const participantsRequest = createRequest({ path: '/participants/p-1' })
    const next = vi.fn()

    upsertMatchOnPut(postRequest, {}, next)
    upsertMatchOnPut(participantsRequest, {}, next)

    expect(postRequest.method).toBe('POST')
    expect(participantsRequest.method).toBe('PUT')
    expect(next).toHaveBeenCalledTimes(2)
  })
})
