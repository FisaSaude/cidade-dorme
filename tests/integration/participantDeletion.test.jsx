import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ParticipantsPage } from '@/pages/participants/ParticipantsPage'

const NOW = '2026-11-17T21:00:00.000Z'
const BLOCKED_MESSAGE =
  'Não é possível excluir um participante da partida em andamento.'

function createRepository(initialParticipants = []) {
  let participants = initialParticipants.map((participant) => ({
    deletedAt: null,
    ...participant,
  }))
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
    create: vi.fn(async ({ name }) => {
      counter += 1
      const created = { id: `p-new-${counter}`, name, deletedAt: null }
      participants = [...participants, created]
      return { ...created }
    }),
    update: vi.fn(async (id, { name }) => {
      participants = participants.map((participant) =>
        participant.id === id ? { ...participant, name } : participant,
      )
      return { ...participants.find((participant) => participant.id === id) }
    }),
    archive: vi.fn(async (id, deletedAt) => {
      participants = participants.map((participant) =>
        participant.id === id ? { ...participant, deletedAt } : participant,
      )
      return { ...participants.find((participant) => participant.id === id) }
    }),
    snapshot: () => participants.map((participant) => ({ ...participant })),
  }
}

function renderPage(repository, props = {}) {
  return render(
    <ParticipantsPage
      participantRepository={repository}
      now={() => NOW}
      {...props}
    />,
  )
}

async function openDeletion(user, name) {
  await screen.findByText(name)
  await user.click(screen.getByRole('button', { name: `Excluir ${name}` }))
  return screen.findByRole('dialog')
}

describe('Exclusão de participante (integração)', () => {
  it('cancela a confirmação sem arquivar', async () => {
    const user = userEvent.setup()
    const repository = createRepository([{ id: 'p-1', name: 'Ana' }])
    renderPage(repository)

    const dialog = await openDeletion(user, 'Ana')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(repository.archive).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Ana')).toBeTruthy()
  })

  it('bloqueia participante da partida ativa e explica o motivo', async () => {
    const user = userEvent.setup()
    const repository = createRepository([{ id: 'p-1', name: 'Ana' }])
    renderPage(repository, { activeParticipantIds: ['p-1'] })

    const dialog = await openDeletion(user, 'Ana')

    expect(within(dialog).getByRole('alert').textContent).toBe(BLOCKED_MESSAGE)
    const confirm = within(dialog).getByRole('button', {
      name: 'Excluir participante',
    })
    expect(confirm.disabled).toBe(true)

    await user.click(confirm)
    expect(repository.archive).not.toHaveBeenCalled()
  })

  it('arquiva via deletedAt, remove da lista ativa e preserva o histórico', async () => {
    const user = userEvent.setup()
    const repository = createRepository([
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
    ])
    renderPage(repository)

    const dialog = await openDeletion(user, 'Ana')
    await user.click(
      within(dialog).getByRole('button', { name: 'Excluir participante' }),
    )

    await waitFor(() => {
      expect(repository.archive).toHaveBeenCalledWith('p-1', NOW)
    })

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Excluir Ana' })).toBeNull()
    })

    expect(screen.getByText('Bruno')).toBeTruthy()
    expect(
      screen.getByText('Participante excluído do cadastro ativo.'),
    ).toBeTruthy()

    const snapshot = repository.snapshot()
    expect(snapshot).toEqual([
      { id: 'p-1', name: 'Ana', deletedAt: NOW },
      { id: 'p-2', name: 'Bruno', deletedAt: null },
    ])
    expect(repository).not.toHaveProperty('delete')
  })

  it('permite recadastrar o nome de um participante arquivado', async () => {
    const user = userEvent.setup()
    const repository = createRepository([{ id: 'p-1', name: 'Ana' }])
    renderPage(repository)

    const dialog = await openDeletion(user, 'Ana')
    await user.click(
      within(dialog).getByRole('button', { name: 'Excluir participante' }),
    )

    await screen.findByText('Participante excluído do cadastro ativo.')
    expect(screen.queryByText('Ana')).toBeNull()

    await user.type(screen.getByLabelText(/Nome do participante/), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Adicionar participante' }))

    await waitFor(() => {
      expect(repository.create).toHaveBeenCalledWith({ name: 'Ana' })
    })
    expect(await screen.findByText('Ana')).toBeTruthy()
  })
})
