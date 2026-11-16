import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useHistoryViewModel } from '@/pages/history/useHistoryViewModel'
import { ApiError } from '@/shared/lib/errors'
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

function makeMatchParticipants() {
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

async function renderViewModel(repositories) {
  const hook = renderHook(() => useHistoryViewModel(repositories))
  await waitFor(() => expect(hook.result.current.viewState.loading).toBe(false))
  return hook
}

describe('useHistoryViewModel', () => {
  it('lista apenas partidas finalizadas em ordem decrescente de encerramento', async () => {
    const repositories = createRepositories({
      matches: [
        makeFinishedMatch({
          id: 'm-old',
          endedAt: '2026-01-01T01:00:00.000Z',
        }),
        makeMatch({ id: 'm-running', status: 'IN_PROGRESS', endedAt: null }),
        makeFinishedMatch({
          id: 'm-new',
          endedAt: '2026-02-01T01:00:00.000Z',
        }),
      ],
    })

    const { result } = await renderViewModel(repositories)

    expect(result.current.viewState.items.map((item) => item.id)).toEqual([
      'm-new',
      'm-old',
    ])
    expect(result.current.viewState.empty).toBe(false)
  })

  it('monta o detalhe com papéis, status, turnos e resultado', async () => {
    const repositories = createRepositories({
      matches: [
        makeFinishedMatch({
          id: 'm-detail',
          winner: 'INNOCENTS',
          closureReason: 'VICTORY',
          turnCount: 2,
          endedAt: '2026-02-01T01:00:00.000Z',
          participants: makeMatchParticipants(),
        }),
      ],
    })

    const { result } = await renderViewModel(repositories)

    act(() => {
      result.current.actions.selectMatch('m-detail')
    })

    const detail = result.current.viewState.detail

    expect(detail.turnCount).toBe(2)
    expect(detail.outcomeLabel).toBe('Vitória: Inocentes e Detetives')
    expect(detail.participants).toEqual([
      expect.objectContaining({
        participantId: 'p-1',
        name: 'Ana Maria',
        roleLabel: 'Assassino',
        statusLabel: 'Morto',
        eliminationLabel: 'Turno 2 — Votação',
      }),
      expect.objectContaining({
        participantId: 'p-2',
        name: 'Bruno',
        roleLabel: 'Inocente',
        statusLabel: 'Vivo',
        eliminationLabel: '',
      }),
      expect.objectContaining({
        participantId: 'p-3',
        name: 'Carla',
        roleLabel: 'Detetive',
        statusLabel: 'Vivo',
      }),
    ])
  })

  it('indica encerramento manual sem vencedor', async () => {
    const repositories = createRepositories({
      matches: [
        makeFinishedMatch({
          id: 'm-manual',
          winner: null,
          closureReason: 'MANUAL',
          endedAt: '2026-02-01T01:00:00.000Z',
          participants: makeMatchParticipants(),
        }),
      ],
    })

    const { result } = await renderViewModel(repositories)

    act(() => {
      result.current.actions.selectMatch('m-manual')
    })

    expect(result.current.viewState.detail.winner).toBeNull()
    expect(result.current.viewState.detail.outcomeLabel).toBe(
      'Partida encerrada sem vencedor',
    )
    expect(result.current.viewState.detail.closureReasonLabel).toBe(
      'Encerramento manual',
    )
  })

  it('resolve o nome atual do participante a partir do cadastro', async () => {
    const repositories = createRepositories({
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
    })

    const { result } = await renderViewModel(repositories)

    act(() => {
      result.current.actions.selectMatch('m-name')
    })

    expect(result.current.viewState.detail.participants[0].name).toBe(
      'Ana Maria',
    )
  })

  it('traduz falhas de carregamento e permite nova tentativa', async () => {
    const repositories = createRepositories({ matches: [] })
    repositories.matchRepository.listFinished
      .mockRejectedValueOnce(
        new ApiError('Não foi possível conectar ao servidor.', null),
      )
      .mockResolvedValueOnce([])

    const { result } = await renderViewModel(repositories)

    expect(result.current.viewState.error).toBe(
      'Não foi possível conectar ao servidor.',
    )

    await act(async () => {
      result.current.actions.retry()
    })

    await waitFor(() => expect(result.current.viewState.loading).toBe(false))
    expect(result.current.viewState.error).toBe('')
    expect(repositories.matchRepository.listFinished).toHaveBeenCalledTimes(2)
  })
})
