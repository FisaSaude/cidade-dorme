import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useParticipantsViewModel } from '@/pages/participants/useParticipantsViewModel'

function createMemoryRepository(initialParticipants = []) {
  let participants = initialParticipants.map((participant) => ({ ...participant }))
  let counter = 0

  return {
    list: vi.fn(async () => participants.map((participant) => ({ ...participant }))),
    listActive: vi.fn(async () =>
      participants
        .filter((participant) => !participant.deletedAt)
        .map((participant) => ({ ...participant })),
    ),
    listAll: vi.fn(async () =>
      participants.map((participant) => ({ ...participant })),
    ),
    archive: vi.fn(async (id, deletedAt) => {
      participants = participants.map((participant) =>
        participant.id === id ? { ...participant, deletedAt } : participant,
      )
      return { ...participants.find((participant) => participant.id === id) }
    }),
    create: vi.fn(async ({ name }) => {
      counter += 1
      const created = { id: `p-new-${counter}`, name }
      participants = [...participants, created]
      return { ...created }
    }),
    update: vi.fn(async (id, { name }) => {
      participants = participants.map((participant) =>
        participant.id === id ? { ...participant, name } : participant,
      )
      return { ...participants.find((participant) => participant.id === id) }
    }),
    snapshot: () => participants,
  }
}

async function renderViewModel(repository, options) {
  const hook = renderHook(() => useParticipantsViewModel(repository, options))
  await waitFor(() => expect(hook.result.current.viewState.loading).toBe(false))
  return hook
}

const NOW = '2026-11-17T21:00:00.000Z'

describe('useParticipantsViewModel', () => {
  it('carrega e ordena os participantes alfabeticamente', async () => {
    const repository = createMemoryRepository([
      { id: 'p-2', name: 'Bruno' },
      { id: 'p-1', name: 'Ana' },
    ])

    const { result } = await renderViewModel(repository)

    expect(repository.listActive).toHaveBeenCalledTimes(1)
    expect(result.current.viewState.participants.map((item) => item.name)).toEqual([
      'Ana',
      'Bruno',
    ])
    expect(result.current.viewState.loadError).toBe('')
  })

  it('cria um participante e recarrega a lista', async () => {
    const repository = createMemoryRepository([{ id: 'p-1', name: 'Ana' }])
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.changeName('Carlos')
    })

    await act(async () => {
      await result.current.actions.submit()
    })

    expect(repository.create).toHaveBeenCalledWith({ name: 'Carlos' })
    await waitFor(() =>
      expect(
        result.current.viewState.participants.map((item) => item.name),
      ).toContain('Carlos'),
    )
    expect(result.current.viewState.notice).toBe('Participante cadastrado com sucesso.')
    expect(result.current.viewState.form.name).toBe('')
    expect(result.current.viewState.form.id).toBeNull()
  })

  it('edita um participante preservando o id', async () => {
    const repository = createMemoryRepository([
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
    ])
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.startEdit({ id: 'p-1', name: 'Ana' })
    })

    expect(result.current.viewState.isEditing).toBe(true)
    expect(result.current.viewState.form).toEqual({ id: 'p-1', name: 'Ana' })

    act(() => {
      result.current.actions.changeName('Ana Maria')
    })

    await act(async () => {
      await result.current.actions.submit()
    })

    expect(repository.update).toHaveBeenCalledWith('p-1', { name: 'Ana Maria' })
    await waitFor(() => {
      const edited = result.current.viewState.participants.find(
        (participant) => participant.id === 'p-1',
      )
      expect(edited.name).toBe('Ana Maria')
    })
    expect(result.current.viewState.notice).toBe(
      'Participante atualizado com sucesso.',
    )
  })

  it('bloqueia nome obrigatório com mensagem em português', async () => {
    const repository = createMemoryRepository()
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.changeName('   ')
    })

    await act(async () => {
      await result.current.actions.submit()
    })

    expect(result.current.viewState.formError).toBe(
      'Informe o nome do participante.',
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('bloqueia nome duplicado sem diferenciar maiúsculas e minúsculas', async () => {
    const repository = createMemoryRepository([{ id: 'p-1', name: 'Ana' }])
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.changeName('ana')
    })

    await act(async () => {
      await result.current.actions.submit()
    })

    expect(result.current.viewState.formError).toBe(
      'Já existe um participante com esse nome.',
    )
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('permite salvar o mesmo nome ao editar o próprio participante', async () => {
    const repository = createMemoryRepository([{ id: 'p-1', name: 'Ana' }])
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.startEdit({ id: 'p-1', name: 'Ana' })
    })

    await act(async () => {
      await result.current.actions.submit()
    })

    expect(result.current.viewState.formError).toBe('')
    expect(repository.update).toHaveBeenCalledWith('p-1', { name: 'Ana' })
  })

  it('carrega apenas ativos quando o repositório oferece listActive', async () => {
    const repository = createMemoryRepository([
      { id: 'p-1', name: 'Ana', deletedAt: null },
      { id: 'p-2', name: 'Bruno', deletedAt: NOW },
    ])

    const { result } = await renderViewModel(repository)

    expect(repository.listActive).toHaveBeenCalledTimes(1)
    expect(repository.list).not.toHaveBeenCalled()
    expect(result.current.viewState.participants.map((item) => item.name)).toEqual([
      'Ana',
    ])
  })

  it('arquiva o participante confirmado e expõe estado de exclusão', async () => {
    const repository = createMemoryRepository([{ id: 'p-1', name: 'Ana' }])
    const { result } = await renderViewModel(repository, { now: () => NOW })

    act(() => {
      result.current.actions.requestDelete({ id: 'p-1', name: 'Ana' })
    })

    expect(result.current.viewState.deletion.open).toBe(true)
    expect(result.current.viewState.deletion.participant.name).toBe('Ana')

    await act(async () => {
      await result.current.actions.confirmDelete()
    })

    expect(repository.archive).toHaveBeenCalledWith('p-1', NOW)
    expect(result.current.viewState.deletion.open).toBe(false)
    expect(result.current.viewState.notice).toBe(
      'Participante excluído do cadastro ativo.',
    )
    await waitFor(() =>
      expect(result.current.viewState.participants).toHaveLength(0),
    )
  })

  it('bloqueia exclusão de participante da partida ativa', async () => {
    const repository = createMemoryRepository([{ id: 'p-1', name: 'Ana' }])
    const { result } = await renderViewModel(repository, {
      activeParticipantIds: ['p-1'],
    })

    act(() => {
      result.current.actions.requestDelete({ id: 'p-1', name: 'Ana' })
    })

    expect(result.current.viewState.deletion.blockedMessage).toBe(
      'Não é possível excluir um participante da partida em andamento.',
    )

    await act(async () => {
      await result.current.actions.confirmDelete()
    })

    expect(repository.archive).not.toHaveBeenCalled()
    expect(result.current.viewState.deletion.error).toBe(
      'Não é possível excluir um participante da partida em andamento.',
    )
  })

  it('cancela a confirmação sem arquivar', async () => {
    const repository = createMemoryRepository([{ id: 'p-1', name: 'Ana' }])
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.requestDelete({ id: 'p-1', name: 'Ana' })
      result.current.actions.cancelDelete()
    })

    expect(result.current.viewState.deletion.open).toBe(false)
    expect(repository.archive).not.toHaveBeenCalled()
  })

  it('traduz erros da API para mensagem segura', async () => {
    const repository = createMemoryRepository()
    repository.create.mockRejectedValue(new Error('falha interna do servidor'))
    const { result } = await renderViewModel(repository)

    act(() => {
      result.current.actions.changeName('Ana')
    })

    await act(async () => {
      await result.current.actions.submit()
    })

    expect(result.current.viewState.formError).toBe(
      'Não foi possível concluir a operação. Tente novamente.',
    )
    expect(result.current.viewState.submitting).toBe(false)
  })
})
