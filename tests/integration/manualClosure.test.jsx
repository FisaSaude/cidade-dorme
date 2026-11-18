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

function getFinishButtons() {
  return screen.getAllByRole('button', { name: 'Encerrar partida' })
}

describe('Encerramento manual (integração)', () => {
  it('mantém um único botão persistente durante a sobreposição', async () => {
    const user = userEvent.setup()
    renderPage({ saveFinishedMatch: vi.fn(async (match) => match) })

    await user.click(screen.getByRole('button', { name: 'iniciar' }))

    const announcement = await screen.findByRole('dialog', {
      name: 'Cidade Dorme',
    })
    expect(announcement).toBeTruthy()
    expect(getFinishButtons()).toHaveLength(1)
    expect(within(announcement).queryByRole('button')).toBeNull()
  })

  it('abre a confirmação acima do overlay e preserva a sobreposição ao cancelar', async () => {
    const user = userEvent.setup()
    renderPage({ saveFinishedMatch: vi.fn(async (match) => match) })

    await user.click(screen.getByRole('button', { name: 'iniciar' }))

    const announcement = await screen.findByRole('dialog', {
      name: 'Cidade Dorme',
    })
    expect(announcement.dataset.layer).toBe('announcement')

    const finishButton = getFinishButtons()[0]
    expect(
      finishButton.closest('[data-layer="persistent-closure"]'),
    ).toBeTruthy()
    expect(announcement.contains(finishButton)).toBe(false)

    await user.click(finishButton)

    const confirmDialog = await screen.findByRole('dialog', {
      name: 'Encerrar partida manualmente?',
    })
    expect(overlayContains(announcement, confirmDialog)).toBe(false)
    expect(confirmDialog.closest('[data-layer="confirm"]')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Cidade Dorme' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Continuar partida' }))
    expect(screen.queryByText('Encerrar partida manualmente?')).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Cidade Dorme' })).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(finishButton))
  })

  it('aciona o encerramento por teclado durante a sobreposição', async () => {
    const user = userEvent.setup()
    renderPage({ saveFinishedMatch: vi.fn(async (match) => match) })

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await screen.findByRole('dialog', { name: 'Cidade Dorme' })

    const finishButton = getFinishButtons()[0]
    finishButton.focus()
    expect(document.activeElement).toBe(finishButton)

    await user.keyboard('{Enter}')

    expect(
      await screen.findByRole('dialog', {
        name: 'Encerrar partida manualmente?',
      }),
    ).toBeTruthy()
  })

  it('confirma o encerramento sem vencedor e desabilita o ponto único', async () => {
    const user = userEvent.setup()
    const saveFinishedMatch = vi.fn(async (match) => match)
    renderPage({ saveFinishedMatch })

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await screen.findByRole('dialog', { name: 'Cidade Dorme' })

    await user.click(getFinishButtons()[0])
    await user.click(screen.getByRole('button', { name: 'Encerrar agora' }))

    expect(await screen.findByText('Partida encerrada sem vencedor')).toBeTruthy()
    expect(screen.getByText('Encerramento manual')).toBeTruthy()
    expect(saveFinishedMatch).toHaveBeenCalledTimes(1)

    await waitFor(() => expect(getFinishButtons()).toHaveLength(1))
    expect(getFinishButtons()[0].disabled).toBe(true)
  })
})

function overlayContains(announcement, confirmDialog) {
  return announcement.contains(confirmDialog)
}
