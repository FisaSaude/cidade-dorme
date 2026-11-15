import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useParticipantsViewModel } from '@/pages/participants/useParticipantsViewModel'

function createMemoryRepository(initialParticipants = []) {
  let participants = initialParticipants.map((participant) => ({ ...participant }))
  let counter = 0

  return {
    list: vi.fn(async () => participants.map((participant) => ({ ...participant }))),
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

async function renderViewModel(repository) {
  const hook = renderHook(() => useParticipantsViewModel(repository))
  await waitFor(() => expect(hook.result.current.viewState.loading).toBe(false))
  return hook
}

describe('useParticipantsViewModel', () => {
  it('carrega e ordena os participantes alfabeticamente', async () => {
    const repository = createMemoryRepository([
      { id: 'p-2', name: 'Bruno' },
      { id: 'p-1', name: 'Ana' },
    ])

    const { result } = await renderViewModel(repository)

    expect(repository.list).toHaveBeenCalledTimes(1)
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
