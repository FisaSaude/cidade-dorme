import { describe, expect, it, vi } from 'vitest'
import { createParticipantRepository } from '@/entities/participant/api/participantRepository'
import { ApiError } from '@/shared/lib/errors'

const ARCHIVED_AT = '2026-11-17T21:00:00.000Z'

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

describe('participantRepository — arquivamento', () => {
  it('lista apenas ativos em listActive', async () => {
    const client = createClient()
    client.get.mockResolvedValue([
      { id: 'p-1', name: 'Ana', deletedAt: null },
      { id: 'p-2', name: 'Bruno', deletedAt: ARCHIVED_AT },
    ])

    const participants = await createRepository(client).listActive()

    expect(participants).toEqual([
      { id: 'p-1', name: 'Ana', deletedAt: null },
    ])
  })

  it('lista ativos e arquivados em listAll normalizando ausência para null', async () => {
    const client = createClient()
    client.get.mockResolvedValue([
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno', deletedAt: ARCHIVED_AT },
    ])

    const participants = await createRepository(client).listAll()

    expect(participants).toEqual([
      { id: 'p-1', name: 'Ana', deletedAt: null },
      { id: 'p-2', name: 'Bruno', deletedAt: ARCHIVED_AT },
    ])
  })

  it('arquiva via PATCH /participants/:id com o payload deletedAt', async () => {
    const client = createClient()
    client.patch.mockResolvedValue({
      id: 'p-1',
      name: 'Ana',
      deletedAt: ARCHIVED_AT,
    })

    const archived = await createRepository(client).archive('p-1', ARCHIVED_AT)

    expect(client.patch).toHaveBeenCalledWith('/participants/p-1', {
      deletedAt: ARCHIVED_AT,
    })
    expect(archived).toEqual({
      id: 'p-1',
      name: 'Ana',
      deletedAt: ARCHIVED_AT,
    })
  })

  it('traduz 404 em participante não encontrado', async () => {
    const client = createClient()
    client.patch.mockRejectedValue(new ApiError('Não encontrado.', 404))

    await expect(
      createRepository(client).archive('missing', ARCHIVED_AT),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Participante não encontrado',
    })
  })

  it('rejeita resposta inválida do arquivamento', async () => {
    const client = createClient()
    client.patch.mockResolvedValue({ id: 'p-1' })

    await expect(
      createRepository(client).archive('p-1', ARCHIVED_AT),
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('rejeita deletedAt inválido antes de chamar a API', async () => {
    const client = createClient()

    await expect(
      createRepository(client).archive('p-1', ''),
    ).rejects.toBeInstanceOf(TypeError)
    expect(client.patch).not.toHaveBeenCalled()
  })
})
