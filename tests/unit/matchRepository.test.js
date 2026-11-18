import { describe, expect, it, vi } from 'vitest'
import { createMatchRepository } from '@/entities/match/api/matchRepository'
import { ApiError } from '@/shared/lib/errors'
import { makeFinishedMatch } from '../fixtures/sessionBuilder'

const FINISHED_MATCHES_URL =
  '/matches?status=FINISHED&_sort=endedAt&_order=desc'

function createClient() {
  return {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}

function createRepository(client) {
  return createMatchRepository({ client })
}

describe('matchRepository', () => {
  it('lista partidas finalizadas com ordenação por encerramento', async () => {
    const client = createClient()
    client.get.mockResolvedValue([makeFinishedMatch()])

    const repository = createRepository(client)
    const matches = await repository.listFinished()

    expect(client.get).toHaveBeenCalledWith(FINISHED_MATCHES_URL)
    expect(matches).toHaveLength(1)
    expect(matches[0].id).toBe('match-1')
    expect(matches[0].status).toBe('FINISHED')
  })

  it('consulta uma partida por id e propaga 404 como ApiError', async () => {
    const client = createClient()
    client.get.mockResolvedValueOnce(makeFinishedMatch())

    const repository = createRepository(client)
    const match = await repository.getById('match-1')

    expect(client.get).toHaveBeenCalledWith('/matches/match-1')
    expect(match.id).toBe('match-1')

    const notFound = new ApiError('A resposta do servidor é inválida.', 404)
    client.get.mockRejectedValueOnce(notFound)

    await expect(repository.getById('missing')).rejects.toBe(notFound)
  })

  it('grava a partida finalizada com PUT idempotente e participantes embutidos', async () => {
    const client = createClient()
    client.put.mockImplementation(async (_path, body) => body)

    const repository = createRepository(client)
    const match = makeFinishedMatch()
    const saved = await repository.saveFinishedMatch(match)

    expect(client.put).toHaveBeenCalledWith('/matches/match-1', expect.objectContaining({
      id: 'match-1',
      status: 'FINISHED',
      winner: 'INNOCENTS',
      turnCount: 2,
    }))
    expect(client.put.mock.calls[0][1].participants).toHaveLength(5)
    expect(saved.id).toBe('match-1')
  })

  it('repetir a gravação mantém o mesmo corpo, sem duplicar', async () => {
    const client = createClient()
    client.put.mockImplementation(async (_path, body) => body)

    const repository = createRepository(client)
    const match = makeFinishedMatch()

    await repository.saveFinishedMatch(match)
    await repository.saveFinishedMatch(match)

    expect(client.put).toHaveBeenCalledTimes(2)
    expect(client.put.mock.calls[0][0]).toBe(client.put.mock.calls[1][0])
    expect(client.put.mock.calls[0][1]).toEqual(client.put.mock.calls[1][1])
  })

  it('valida minimamente as respostas do servidor', async () => {
    const client = createClient()
    client.get.mockResolvedValue({ matches: [] })

    const repository = createRepository(client)

    await expect(repository.listFinished()).rejects.toBeInstanceOf(ApiError)

    client.get.mockResolvedValue([{ id: 'match-1', status: 'FINISHED' }])

    await expect(repository.listFinished()).rejects.toBeInstanceOf(ApiError)
  })

  it('exclui uma partida via DELETE /matches/:id', async () => {
    const client = createClient()
    client.delete.mockResolvedValue(null)

    const repository = createRepository(client)

    await repository.deleteMatch('match-1')

    expect(client.delete).toHaveBeenCalledWith('/matches/match-1')
    expect(client.delete).toHaveBeenCalledTimes(1)
    expect(client.put).not.toHaveBeenCalled()
    expect(client.get).not.toHaveBeenCalled()
  })

  it('trata 204 e resposta vazia como exclusão concluída', async () => {
    const client = createClient()
    client.delete.mockResolvedValue(undefined)

    const repository = createRepository(client)

    await expect(repository.deleteMatch('match-1')).resolves.toBeUndefined()
  })

  it('propaga 404 como ApiError para o chamador tratar como já removida', async () => {
    const client = createClient()
    const notFound = new ApiError('O recurso solicitado não foi encontrado.', 404)
    client.delete.mockRejectedValue(notFound)

    const repository = createRepository(client)

    await expect(repository.deleteMatch('missing')).rejects.toBe(notFound)
  })

  it('rejeita id inválido antes de chamar a API', async () => {
    const client = createClient()
    const repository = createRepository(client)

    await expect(repository.deleteMatch('')).rejects.toBeInstanceOf(TypeError)
    await expect(repository.deleteMatch(null)).rejects.toBeInstanceOf(TypeError)
    expect(client.delete).not.toHaveBeenCalled()
  })

  it('rejeita a gravação de partida não finalizada antes de chamar a API', async () => {
    const client = createClient()
    const repository = createRepository(client)

    await expect(
      repository.saveFinishedMatch(makeFinishedMatch({ status: 'IN_PROGRESS' })),
    ).rejects.toBeInstanceOf(TypeError)
    expect(client.put).not.toHaveBeenCalled()
  })
})
