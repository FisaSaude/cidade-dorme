import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HistoryPage } from '@/pages/history/HistoryPage'
import {
  makeFinishedMatch,
  makeMatch,
  makeMatchParticipant,
} from '../fixtures/sessionBuilder.js'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana Maria' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
]

function makeParticipants() {
  return [
    makeMatchParticipant({
      index: 1,
      id: 'mp-1',
      participantId: 'p-1',
      role: 'ASSASSIN',
      status: 'DEAD',
      eliminatedAt: { turn: 2, phase: 'VOTE' },
    }),
    makeMatchParticipant({
      index: 2,
      id: 'mp-2',
      participantId: 'p-2',
      role: 'INNOCENT',
      status: 'ALIVE',
    }),
    makeMatchParticipant({
      index: 3,
      id: 'mp-3',
      participantId: 'p-3',
      role: 'DETECTIVE',
      status: 'ALIVE',
    }),
  ]
}

function createRepositories({ matches, participants = PARTICIPANTS }) {
  return {
    matchRepository: {
      listFinished: vi.fn(async () => matches.map((match) => ({ ...match }))),
    },
    participantRepository: {
      list: vi.fn(async () =>
        participants.map((participant) => ({ ...participant })),
      ),
    },
  }
}

function renderPage(repositories) {
  return render(
    <HistoryPage
      matchRepository={repositories.matchRepository}
      participantRepository={repositories.participantRepository}
    />,
  )
}

describe('HistoryPage (integração)', () => {
  it('mostra o estado vazio quando não há partidas finalizadas', async () => {
    renderPage(createRepositories({ matches: [] }))

    expect(
      await screen.findByText('Nenhuma partida finalizada'),
    ).toBeTruthy()
  })

  it('lista uma partida finalizada e apresenta o detalhe completo', async () => {
    const user = userEvent.setup()
    renderPage(
      createRepositories({
        matches: [
          makeFinishedMatch({
            id: 'm-1',
            winner: 'INNOCENTS',
            closureReason: 'VICTORY',
            turnCount: 2,
            endedAt: '2026-02-01T01:00:00.000Z',
            participants: makeParticipants(),
          }),
        ],
      }),
    )

    expect(await screen.findByText('Partidas finalizadas')).toBeTruthy()
    expect(
      screen.getByText('Vitória: Inocentes e Detetives'),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: /Ver detalhes/ }),
    )

    expect(await screen.findByText('Detalhes da partida')).toBeTruthy()
    expect(screen.getByText('Início')).toBeTruthy()
    expect(screen.getByText('Turnos encerrados')).toBeTruthy()

    const table = screen.getByRole('table')
    expect(within(table).getByText('Ana Maria')).toBeTruthy()
    expect(within(table).getByText('Bruno')).toBeTruthy()
    expect(within(table).getByText('Assassino')).toBeTruthy()
    expect(within(table).getByText('Morto')).toBeTruthy()
    expect(within(table).getByText('Turno 2 — Votação')).toBeTruthy()
    expect(within(table).getByText('Detetive')).toBeTruthy()
  })

  it('indica encerramento manual sem vencedor', async () => {
    const user = userEvent.setup()
    renderPage(
      createRepositories({
        matches: [
          makeFinishedMatch({
            id: 'm-manual',
            winner: null,
            closureReason: 'MANUAL',
            endedAt: '2026-02-01T01:00:00.000Z',
            participants: makeParticipants(),
          }),
        ],
      }),
    )

    await user.click(
      await screen.findByRole('button', { name: /Ver detalhes/ }),
    )

    expect(await screen.findByText('Detalhes da partida')).toBeTruthy()
    expect(
      screen.getAllByText('Partida encerrada sem vencedor').length,
    ).toBeGreaterThan(0)
    expect(screen.getByText('Encerramento manual')).toBeTruthy()
    expect(screen.queryByText(/Vitória:/)).toBeNull()
  })

  it('ignora defensivamente documentos que não estão finalizados', async () => {
    renderPage(
      createRepositories({
        matches: [
          makeMatch({ id: 'm-running', status: 'IN_PROGRESS', endedAt: null }),
          makeFinishedMatch({
            id: 'm-done',
            endedAt: '2026-02-01T01:00:00.000Z',
          }),
        ],
      }),
    )

    expect(await screen.findByText('Partidas finalizadas')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Ver detalhes/ })).toHaveLength(
      1,
    )
  })

  it('reflete o nome editado do participante no detalhe', async () => {
    const user = userEvent.setup()
    renderPage(
      createRepositories({
        participants: [{ id: 'p-1', name: 'Ana Maria' }],
        matches: [
          makeFinishedMatch({
            id: 'm-name',
            endedAt: '2026-02-01T01:00:00.000Z',
            participants: [
              makeMatchParticipant({
                index: 1,
                id: 'mp-1',
                participantId: 'p-1',
                role: 'ASSASSIN',
                status: 'ALIVE',
              }),
            ],
          }),
        ],
      }),
    )

    await user.click(
      await screen.findByRole('button', { name: /Ver detalhes/ }),
    )

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Ana Maria')).toBeTruthy()
  })
})
