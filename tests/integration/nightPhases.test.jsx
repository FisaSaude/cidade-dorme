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

function renderNight() {
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

describe('Night phases integration', () => {
  it('mostra overlay dialog e avança por ação explícita (clique/teclado)', async () => {
    const user = userEvent.setup()
    renderNight()

    await user.click(screen.getByRole('button', { name: 'iniciar' }))

    const firstOverlay = await screen.findByRole('dialog', { name: 'Cidade Dorme' })
    expect(firstOverlay).toBeTruthy()

    await user.click(firstOverlay)
    expect(await screen.findByRole('dialog', { name: 'Assassinos Acordem' })).toBeTruthy()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Ações dos assassinos' })).toBeTruthy()
  })

  it('permite ação opcional, revela papel e omite fase dos detetives quando não houver vivo', async () => {
    const user = userEvent.setup()
    renderNight()

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
    await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))

    const assassinSelect = await screen.findByLabelText('Alvo de Ana')
    const assassinOptions = within(assassinSelect).getAllByRole('option')
    expect(assassinOptions.map((option) => option.textContent)).toContain('Bruno')
    expect(assassinOptions.map((option) => option.textContent)).not.toContain('Ana')

    await user.selectOptions(assassinSelect, 'id-3')
    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    expect(await screen.findByRole('dialog', { name: 'Cidade Acorda' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Investigações dos detetives' })).toBeNull()
  })

  it('mostra investigação com revelação de papel para o narrador', async () => {
    const user = userEvent.setup()
    renderNight()

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
    await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))

    await user.selectOptions(await screen.findByLabelText('Alvo de Ana'), '')
    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    const detectivesOverlay = await screen.findByRole('dialog', {
      name: 'Detetives Acordem',
    })
    await user.click(detectivesOverlay)

    await user.selectOptions(
      await screen.findByLabelText('Investigação de Bruno'),
      'id-2',
    )

    expect(await screen.findByText('Papel revelado: Assassino')).toBeTruthy()
  })
})
