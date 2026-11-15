import { describe, expect, it, vi } from 'vitest'
import { createParticipantRepository } from '@/entities/participant/api/participantRepository'
import { ApiError, GameRuleError } from '@/shared/lib/errors'

function createClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  }
}

function createRepository(client) {
  return createParticipantRepository({
    client,
    idFactory: () => 'generated-id',
  })
}

describe('participantRepository', () => {
  it('lista participantes via GET /participants', async () => {
    const client = createClient()
    client.get.mockResolvedValue([
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
    ])

    const repository = createRepository(client)
    const participants = await repository.list()

    expect(client.get).toHaveBeenCalledWith('/participants')
    expect(participants).toEqual([
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
    ])
  })

  it('cria participante com UUID gerado no cliente', async () => {
    const client = createClient()
    client.post.mockImplementation(async (path, body) => body)

    const repository = createRepository(client)
    const participant = await repository.create({ name: '  Ana  ' })

    expect(client.post).toHaveBeenCalledWith('/participants', {
      id: 'generated-id',
      name: 'Ana',
    })
    expect(participant).toEqual({ id: 'generated-id', name: 'Ana' })
  })

  it('edita participante via PATCH /participants/:id preservando o id', async () => {
    const client = createClient()
    client.patch.mockResolvedValue({ id: 'p-1', name: 'Ana Maria' })

    const repository = createRepository(client)
    const participant = await repository.update('p-1', { name: 'Ana Maria' })

    expect(client.patch).toHaveBeenCalledWith('/participants/p-1', {
      name: 'Ana Maria',
    })
    expect(participant).toEqual({ id: 'p-1', name: 'Ana Maria' })
  })

  it('valida minimamente o formato das respostas', async () => {
    const client = createClient()
    client.get.mockResolvedValue({ items: [] })

    const repository = createRepository(client)

    await expect(repository.list()).rejects.toBeInstanceOf(ApiError)
  })

  it('rejeita item de participante sem nome', async () => {
    const client = createClient()
    client.get.mockResolvedValue([{ id: 'p-1' }])

    const repository = createRepository(client)

    await expect(repository.list()).rejects.toBeInstanceOf(ApiError)
  })

  it('propaga ApiError em falhas da API', async () => {
    const client = createClient()
    const apiError = new ApiError('Servidor indisponível.', 500)
    client.get.mockRejectedValue(apiError)

    const repository = createRepository(client)

    await expect(repository.list()).rejects.toBe(apiError)
  })

  it('bloqueia criação com nome vazio antes de chamar a API', async () => {
    const client = createClient()
    const repository = createRepository(client)

    await expect(repository.create({ name: '   ' })).rejects.toBeInstanceOf(
      GameRuleError,
    )
    expect(client.post).not.toHaveBeenCalled()
  })
})
