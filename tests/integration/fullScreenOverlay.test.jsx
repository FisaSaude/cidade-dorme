import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MatchPhase } from '@/entities/match'
import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'
import { makeSession } from '../fixtures/sessionBuilder'

const PARTICIPANTS = [
  { id: 'participant-1', name: 'Ana' },
  { id: 'participant-2', name: 'Bruno' },
  { id: 'participant-3', name: 'Carla' },
  { id: 'participant-4', name: 'Davi' },
  { id: 'participant-5', name: 'Elisa' },
]

const ANNOUNCEMENTS = [
  [MatchPhase.TURN_START, 'Cidade Dorme'],
  [MatchPhase.ASSASSINS_ANNOUNCEMENT, 'Assassinos Acordem'],
  [MatchPhase.DETECTIVES_ANNOUNCEMENT, 'Detetives Acordem'],
  [MatchPhase.DAWN_ANNOUNCEMENT, 'Cidade Acorda'],
]

const EMPTY_ACTIONS = {
  dismissAnnouncement: vi.fn(),
  setAssassinTarget: vi.fn(),
  resolveAssassinsPhase: vi.fn(),
  setInvestigation: vi.fn(),
  resolveDetectivesPhase: vi.fn(),
  startVoting: vi.fn(),
  registerVote: vi.fn(),
  finishManually: vi.fn(),
  retryPersistMatch: vi.fn(),
  persistence: { state: 'idle', error: null, savedMatchId: null },
}

function renderPage(session, actions = EMPTY_ACTIONS) {
  return render(
    <LiveMatchPage
      session={session}
      participantRepository={{ list: async () => PARTICIPANTS }}
      actions={actions}
    />,
  )
}

describe('Sobreposição de tela cheia isolada (integração)', () => {
  it.each(ANNOUNCEMENTS)(
    'mantém apenas a sobreposição e o encerramento visíveis em %s',
    async (phase, title) => {
      const { container } = renderPage(makeSession({ phase }))

      const overlay = await screen.findByRole('dialog', { name: title })

      expect(overlay.parentElement).toBe(document.body)
      expect(overlay.dataset.layer).toBe('announcement')
      expect(container.contains(overlay)).toBe(false)

      expect(screen.queryByText('Partida em andamento')).toBeNull()
      expect(screen.queryByText('Turno')).toBeNull()
      expect(screen.queryByText('Próxima etapa')).toBeNull()
      expect(screen.queryByText('Vivos')).toBeNull()
      expect(screen.queryByText('Mortos')).toBeNull()

      expect(screen.getAllByRole('button', { name: 'Encerrar partida' })).toHaveLength(1)
      expect(
        screen.queryByRole('button', { name: 'Processar noite' }),
      ).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Concluir investigações' }),
      ).toBeNull()
      expect(screen.queryByText('Resultado da noite')).toBeNull()
      expect(screen.queryByText('Votação')).toBeNull()
    },
  )

  it('restaura o conteúdo da partida após a dispensa do anúncio', async () => {
    const session = makeSession({ phase: MatchPhase.TURN_START })
    const { rerender } = renderPage(session)

    await screen.findByRole('dialog', { name: 'Cidade Dorme' })
    expect(screen.queryByText('Turno')).toBeNull()

    const resolvedSession = makeSession({
      phase: MatchPhase.ASSASSINS_ACTIONS,
      match: { participants: session.match.participants },
    })

    rerender(
      <LiveMatchPage
        session={resolvedSession}
        participantRepository={{ list: async () => PARTICIPANTS }}
        actions={EMPTY_ACTIONS}
      />,
    )

    expect(
      screen.queryByRole('dialog', { name: 'Cidade Dorme' }),
    ).toBeNull()
    expect(screen.getByText('Partida em andamento')).toBeTruthy()
    expect(screen.getByText('Turno')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Processar noite' }),
    ).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Encerrar partida' })).toHaveLength(1)
  })

  it('mantém o ponto único de encerramento na camada persistente', async () => {
    renderPage(makeSession({ phase: MatchPhase.TURN_START }))

    const overlay = await screen.findByRole('dialog', { name: 'Cidade Dorme' })
    const finishButton = screen.getByRole('button', {
      name: 'Encerrar partida',
    })
    const layer = finishButton.closest('[data-layer="persistent-closure"]')

    expect(layer).toBeTruthy()
    expect(overlay.contains(finishButton)).toBe(false)
    expect(finishButton.closest('[data-layer="announcement"]')).toBeNull()
  })
})
