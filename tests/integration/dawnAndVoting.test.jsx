import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'

function makeIdFactory() {
  let counter = 0
  return () => {
    counter += 1
    return `id-${counter}`
  }
}

function Harness({ participantRepository }) {
  const sessionApi = useMatchSession()

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          sessionApi.startMatch({
            participants: [
              { participantId: 'p-1', role: PlayerRole.ASSASSIN },
              { participantId: 'p-2', role: PlayerRole.DETECTIVE },
              { participantId: 'p-3', role: PlayerRole.INNOCENT },
              { participantId: 'p-4', role: PlayerRole.INNOCENT },
              { participantId: 'p-5', role: PlayerRole.INNOCENT },
            ],
          })
        }
      >
        iniciar
      </button>
      <LiveMatchPage
        session={sessionApi.session}
        participantRepository={participantRepository}
        actions={sessionApi}
      />
    </div>
  )
}

function renderMatch() {
  const participantRepository = {
    list: async () => [
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
      { id: 'p-3', name: 'Carla' },
      { id: 'p-4', name: 'Davi' },
      { id: 'p-5', name: 'Elisa' },
    ],
  }

  return render(
    <AppProviders
      services={{
        participantRepository,
        idFactory: makeIdFactory(),
        now: () => '2026-01-01T01:00:00.000Z',
      }}
    >
      <MatchSessionProvider>
        <Harness participantRepository={participantRepository} />
      </MatchSessionProvider>
    </AppProviders>,
  )
}

function getStatusValue(label) {
  return screen.getByText(label).parentElement.querySelector('dd').textContent
}

async function reachAssassinsActions(user) {
  await user.click(screen.getByRole('button', { name: 'iniciar' }))
  await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
  await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))
}

async function reachDawnResult(user, targetValue) {
  await user.selectOptions(await screen.findByLabelText('Alvo de Ana'), targetValue)
  await user.click(screen.getByRole('button', { name: 'Processar noite' }))
  await user.click(await screen.findByRole('dialog', { name: 'Detetives Acordem' }))
  await user.selectOptions(
    await screen.findByLabelText('Investigação de Bruno'),
    '',
  )
  await user.click(screen.getByRole('button', { name: 'Concluir investigações' }))
  await user.click(await screen.findByRole('dialog', { name: 'Cidade Acorda' }))
}

describe('Dawn and voting integration', () => {
  it('mostra eliminados nominais, vota em vivo e inicia novo turno', async () => {
    const user = userEvent.setup()
    renderMatch()

    await reachAssassinsActions(user)
    await reachDawnResult(user, 'id-4')

    expect(await screen.findByRole('heading', { name: 'Resultado da noite' })).toBeTruthy()
    expect(screen.getByText('Participantes assassinados: Carla')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ir para a votação' }))

    const votingSelect = await screen.findByLabelText('Resultado da votação')
    const votingOptions = within(votingSelect)
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(votingOptions).not.toContain('Carla')
    expect(votingOptions).toContain('Davi')

    await user.selectOptions(votingSelect, 'id-5')
    await user.click(screen.getByRole('button', { name: 'Registrar votação' }))

    expect(await screen.findByRole('dialog', { name: 'Cidade Dorme' })).toBeTruthy()
    expect(getStatusValue('Turno')).toBe('2')
    expect(getStatusValue('Mortos')).toBe('2')
  })

  it('mostra mensagem de nenhuma morte e registra empate sem eliminar', async () => {
    const user = userEvent.setup()
    renderMatch()

    await reachAssassinsActions(user)
    await reachDawnResult(user, '')

    expect(
      await screen.findByText('Ninguém foi assassinado nesta noite'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Ir para a votação' }))
    await user.selectOptions(
      await screen.findByLabelText('Resultado da votação'),
      'TIE',
    )
    await user.click(screen.getByRole('button', { name: 'Registrar votação' }))

    expect(await screen.findByRole('dialog', { name: 'Cidade Dorme' })).toBeTruthy()
    expect(getStatusValue('Turno')).toBe('2')
    expect(getStatusValue('Mortos')).toBe('0')
  })

  it('não oferece votos individuais, apenas eliminado vivo ou empate', async () => {
    const user = userEvent.setup()
    renderMatch()

    await reachAssassinsActions(user)
    await reachDawnResult(user, '')
    await user.click(await screen.findByRole('button', { name: 'Ir para a votação' }))

    expect(screen.queryByText(/votos individuais/i)).toBeNull()

    const votingSelect = await screen.findByLabelText('Resultado da votação')
    const optionValues = within(votingSelect)
      .getAllByRole('option')
      .map((option) => option.value)

    expect(optionValues).toEqual(['', 'TIE', 'id-2', 'id-3', 'id-4', 'id-5', 'id-6'])
    expect(
      screen.getByRole('button', { name: 'Registrar votação' }).disabled,
    ).toBe(true)
  })
})
