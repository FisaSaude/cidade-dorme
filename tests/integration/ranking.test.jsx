import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RankingPage } from '@/pages/ranking/RankingPage'
import {
  makeFinishedMatch,
  makeMatch,
  makeMatchParticipant,
} from '../fixtures/sessionBuilder.js'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Dora' },
]

function makeMatchParticipants(matchId, entries) {
  return entries.map(([participantId, status], index) =>
    makeMatchParticipant({
      index: index + 1,
      id: `${matchId}-mp-${index + 1}`,
      participantId,
      status,
    }),
  )
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
    <RankingPage
      matchRepository={repositories.matchRepository}
      participantRepository={repositories.participantRepository}
    />,
  )
}

async function readRows() {
  const table = await screen.findByRole('table')
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    )
}

describe('RankingPage (integração)', () => {
  it('ordena por sobrevivências de vitória e encerramento manual, incluindo zeros e ignorando partidas em andamento', async () => {
    const repositories = createRepositories({
      matches: [
        makeFinishedMatch({
          id: 'm-victory',
          winner: 'INNOCENTS',
          closureReason: 'VICTORY',
          participants: makeMatchParticipants('m-victory', [
            ['p-1', 'ALIVE'],
            ['p-2', 'ALIVE'],
            ['p-3', 'DEAD'],
          ]),
        }),
        makeFinishedMatch({
          id: 'm-manual',
          winner: null,
          closureReason: 'MANUAL',
          participants: makeMatchParticipants('m-manual', [
            ['p-1', 'ALIVE'],
            ['p-2', 'DEAD'],
            ['p-3', 'DEAD'],
            ['p-4', 'ALIVE'],
          ]),
        }),
        makeMatch({
          id: 'm-running',
          status: 'IN_PROGRESS',
          endedAt: null,
          participants: makeMatchParticipants('m-running', [
            ['p-4', 'ALIVE'],
          ]),
        }),
      ],
    })

    renderPage(repositories)

    const rows = await readRows()

    expect(rows.map((row) => row[1])).toEqual([
      'Ana',
      'Bruno',
      'Dora',
      'Carla',
    ])
    expect(rows.map((row) => row[2])).toEqual(['2', '1', '1', '0'])
  })

  it('reflete o nome editado do participante', async () => {
    const repositories = createRepositories({
      participants: [{ id: 'p-1', name: 'Ana Editada' }],
      matches: [
        makeFinishedMatch({
          id: 'm-name',
          participants: makeMatchParticipants('m-name', [['p-1', 'ALIVE']]),
        }),
      ],
    })

    renderPage(repositories)

    const rows = await readRows()

    expect(rows).toEqual([['1º', 'Ana Editada', '1']])
  })

  it('mostra estado vazio quando não há participantes cadastrados', async () => {
    renderPage(createRepositories({ matches: [], participants: [] }))

    expect(
      await screen.findByText('Nenhum participante cadastrado'),
    ).toBeTruthy()
  })
})
