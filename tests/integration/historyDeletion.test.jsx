import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HistoryPage } from '@/pages/history/HistoryPage'
import { RankingPage } from '@/pages/ranking/RankingPage'
import { ApiError } from '@/shared/lib/errors'
import {
  makeFinishedMatch,
  makeMatchParticipant,
} from '../fixtures/sessionBuilder.js'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
]

function makeParticipants(anaStatus = 'ALIVE', brunoStatus = 'ALIVE') {
  return [
    makeMatchParticipant({
      index: 1,
      id: 'mp-1',
      participantId: 'p-1',
      role: 'INNOCENT',
      status: anaStatus,
    }),
    makeMatchParticipant({
      index: 2,
      id: 'mp-2',
      participantId: 'p-2',
      role: 'INNOCENT',
      status: brunoStatus,
    }),
  ]
}

function createRepositories(matches) {
  let currentMatches = matches.map((match) => ({ ...match }))

  return {
    matchRepository: {
      listFinished: vi.fn(async () =>
        currentMatches.map((match) => ({ ...match })),
      ),
      deleteMatch: vi.fn(async (id) => {
        currentMatches = currentMatches.filter((match) => match.id !== id)
      }),
    },
    participantRepository: {
      list: vi.fn(async () =>
        PARTICIPANTS.map((participant) => ({ ...participant })),
      ),
      listAll: vi.fn(async () =>
        PARTICIPANTS.map((participant) => ({ ...participant })),
      ),
    },
    getMatches: () => currentMatches,
  }
}

function renderHistory(repositories) {
  return render(
    <HistoryPage
      matchRepository={repositories.matchRepository}
      participantRepository={repositories.participantRepository}
    />,
  )
}

const MATCH_OLD = makeFinishedMatch({
  id: 'm-old',
  endedAt: '2026-01-01T01:00:00.000Z',
  participants: makeParticipants(),
})
const MATCH_NEW = makeFinishedMatch({
  id: 'm-new',
  endedAt: '2026-02-01T01:00:00.000Z',
  participants: makeParticipants(),
})

describe('Exclusão de partida do histórico (integração)', () => {
  it('cancela sem remover a partida', async () => {
    const user = userEvent.setup()
    const repositories = createRepositories([MATCH_NEW])
    renderHistory(repositories)

    await user.click(
      await screen.findByRole('button', { name: /Excluir partida de/ }),
    )
    expect(
      await screen.findByText('Excluir partida do histórico?'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(repositories.matchRepository.deleteMatch).not.toHaveBeenCalled()
    expect(screen.getByText('Partidas finalizadas')).toBeTruthy()
  })

  it('exclui com confirmação, remove da lista e preserva outras partidas e participantes', async () => {
    const user = userEvent.setup()
    const repositories = createRepositories([MATCH_OLD, MATCH_NEW])
    renderHistory(repositories)

    const deleteButtons = await screen.findAllByRole('button', {
      name: /Excluir partida de/,
    })
    await user.click(deleteButtons[1])
    await user.click(
      await screen.findByRole('button', { name: 'Excluir partida' }),
    )

    await waitFor(() =>
      expect(repositories.matchRepository.deleteMatch).toHaveBeenCalledWith(
        'm-old',
      ),
    )
    expect(await screen.findByText('Partida excluída do histórico.')).toBeTruthy()

    await waitFor(() => expect(repositories.getMatches()).toHaveLength(1))
    expect(repositories.getMatches()[0].id).toBe('m-new')
    expect(repositories.participantRepository.list).not.toHaveBeenCalled()
    expect(screen.queryByText(/01\/01/)).toBeNull()
  })

  it('fecha o detalhe ao excluir a partida selecionada e recarrega o ranking', async () => {
    const user = userEvent.setup()
    const repositories = createRepositories([MATCH_OLD, MATCH_NEW])
    const history = renderHistory(repositories)

    const detailButtons = await screen.findAllByRole('button', {
      name: /Ver detalhes/,
    })
    await user.click(detailButtons[0])
    await user.click(
      await screen.findByRole('button', { name: 'Excluir partida' }),
    )
    const confirmDialog = await screen.findByRole('dialog', {
      name: 'Excluir partida do histórico?',
    })
    await user.click(
      within(confirmDialog).getByRole('button', { name: 'Excluir partida' }),
    )

    await screen.findByText('Partida excluída do histórico.')
    await waitFor(() =>
      expect(screen.queryByText('Detalhes da partida')).toBeNull(),
    )
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /Ver detalhes/ })).toHaveLength(
        1,
      ),
    )

    history.unmount()

    render(
      <RankingPage
        matchRepository={repositories.matchRepository}
        participantRepository={repositories.participantRepository}
      />,
    )

    const table = await screen.findByRole('table')
    const anaRow = within(table).getByText('Ana').closest('tr')
    const brunoRow = within(table).getByText('Bruno').closest('tr')

    expect(within(anaRow).getByLabelText('1 sobrevivência')).toBeTruthy()
    expect(within(brunoRow).getByLabelText('1 sobrevivência')).toBeTruthy()
  })

  it('trata 404 como já removida e atualiza a lista', async () => {
    const user = userEvent.setup()
    const repositories = createRepositories([MATCH_NEW])
    repositories.matchRepository.deleteMatch.mockImplementationOnce(async (id) => {
      repositories.getMatches().splice(
        repositories.getMatches().findIndex((match) => match.id === id),
        1,
      )
      throw new ApiError('O recurso solicitado não foi encontrado.', 404)
    })
    renderHistory(repositories)

    await user.click(
      await screen.findByRole('button', { name: /Excluir partida de/ }),
    )
    await user.click(
      await screen.findByRole('button', { name: 'Excluir partida' }),
    )

    expect(
      await screen.findByText(
        'A partida já havia sido removida. O histórico foi atualizado.',
      ),
    ).toBeTruthy()
    expect(
      await screen.findByText('Nenhuma partida finalizada'),
    ).toBeTruthy()
  })
})
