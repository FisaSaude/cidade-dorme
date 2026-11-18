import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Davi' },
  { id: 'p-5', name: 'Elisa' },
]

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
    <>
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
    </>
  )
}

function renderPage(matchRepository = {}) {
  const participantRepository = {
    list: vi.fn(async () => PARTICIPANTS.map((participant) => ({ ...participant }))),
  }

  render(
    <AppProviders
      services={{
        participantRepository,
        matchRepository,
        idFactory: makeIdFactory(),
        now: () => '2026-01-01T04:00:00.000Z',
      }}
    >
      <MatchSessionProvider>
        <Harness participantRepository={participantRepository} />
      </MatchSessionProvider>
    </AppProviders>,
  )
}

describe('Encerramento manual (integração)', () => {
  it('abre diálogo, permite cancelar e confirmar sem vencedor', async () => {
    const user = userEvent.setup()
    const saveFinishedMatch = vi.fn(async (match) => match)
    renderPage({ saveFinishedMatch })

    await user.click(screen.getByRole('button', { name: 'iniciar' }))

    await user.click(screen.getAllByRole('button', { name: 'Encerrar partida' })[0])
    expect(await screen.findByText('Encerrar partida manualmente?')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Continuar partida' }))
    expect(screen.queryByText('Encerrar partida manualmente?')).toBeNull()
    expect(screen.getByText('Partida em andamento')).toBeTruthy()

    await user.click(screen.getAllByRole('button', { name: 'Encerrar partida' })[0])
    await user.click(screen.getByRole('button', { name: 'Encerrar agora' }))

    expect(await screen.findByText('Partida encerrada sem vencedor')).toBeTruthy()
    expect(screen.getByText('Encerramento manual')).toBeTruthy()
    expect(saveFinishedMatch).toHaveBeenCalledTimes(1)
  })

  it('mantém overlay ativa ao abrir encerramento pelo footerAction', async () => {
    const user = userEvent.setup()
    const saveFinishedMatch = vi.fn(async (match) => match)
    renderPage({ saveFinishedMatch })

    await user.click(screen.getByRole('button', { name: 'iniciar' }))

    expect(await screen.findByRole('dialog', { name: 'Cidade Dorme' })).toBeTruthy()

    const overlay = await screen.findByRole('dialog', { name: 'Cidade Dorme' })
    await user.click(within(overlay).getByRole('button', { name: 'Encerrar partida' }))
    expect(await screen.findByText('Encerrar partida manualmente?')).toBeTruthy()

    const confirmDialog = screen.getByRole('dialog', {
      name: 'Encerrar partida manualmente?',
    })
    expect(document.body.contains(confirmDialog)).toBe(true)
    expect(overlay.contains(confirmDialog)).toBe(false)

    expect(screen.getByRole('dialog', { name: 'Cidade Dorme' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Encerrar agora' }))

    expect(await screen.findByText('Partida encerrada sem vencedor')).toBeTruthy()
    await waitFor(() => expect(saveFinishedMatch).toHaveBeenCalledTimes(1))
  })
})
