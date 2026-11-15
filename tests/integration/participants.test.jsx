import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ParticipantsPage } from '@/pages/participants/ParticipantsPage'

function createRepository(initialParticipants = []) {
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

function renderPage(repository) {
  return render(<ParticipantsPage participantRepository={repository} />)
}

describe('ParticipantsPage (integração)', () => {
  it('mostra o estado vazio quando não há participantes', async () => {
    renderPage(createRepository())

    expect(
      await screen.findByText('Nenhum participante cadastrado'),
    ).toBeTruthy()
  })

  it('cadastra um participante e atualiza a lista', async () => {
    const user = userEvent.setup()
    const repository = createRepository()
    renderPage(repository)

    await screen.findByText('Nenhum participante cadastrado')

    await user.type(screen.getByLabelText(/Nome do participante/), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Adicionar participante' }))

    expect(await screen.findByText('Ana')).toBeTruthy()
    expect(repository.create).toHaveBeenCalledWith({ name: 'Ana' })
    expect(screen.getByText('Participante cadastrado com sucesso.')).toBeTruthy()
  })

  it('bloqueia nome duplicado com mensagem explicativa', async () => {
    const user = userEvent.setup()
    const repository = createRepository([{ id: 'p-1', name: 'Ana' }])
    renderPage(repository)

    await screen.findByText('Ana')

    await user.type(screen.getByLabelText(/Nome do participante/), 'ana')
    await user.click(screen.getByRole('button', { name: 'Adicionar participante' }))

    expect(
      await screen.findByText('Já existe um participante com esse nome.'),
    ).toBeTruthy()
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('edita um participante mantendo o mesmo id e o vínculo histórico', async () => {
    const user = userEvent.setup()
    const repository = createRepository([
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
    ])
    const finishedMatches = [
      { id: 'm-1', participantIds: ['p-1', 'p-2'] },
      { id: 'm-2', participantIds: ['p-1'] },
    ]

    renderPage(repository)

    await screen.findByText('Ana')

    await user.click(screen.getByRole('button', { name: 'Editar Ana' }))

    const nameField = screen.getByLabelText(/Nome do participante/)
    expect(nameField.value).toBe('Ana')

    await user.clear(nameField)
    await user.type(nameField, 'Ana Maria')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Ana Maria')).toBeTruthy()
    expect(repository.update).toHaveBeenCalledWith('p-1', { name: 'Ana Maria' })
    expect(screen.getByRole('button', { name: 'Editar Ana Maria' })).toBeTruthy()

    await waitFor(() => {
      const edited = repository.snapshot().find((participant) => participant.id === 'p-1')
      expect(edited.name).toBe('Ana Maria')
    })

    expect(finishedMatches).toEqual([
      { id: 'm-1', participantIds: ['p-1', 'p-2'] },
      { id: 'm-2', participantIds: ['p-1'] },
    ])
  })
})
