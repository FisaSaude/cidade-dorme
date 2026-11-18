import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { useMatchSetupViewModel } from '@/pages/match-setup/useMatchSetupViewModel'
import { GameRuleError } from '@/shared/lib/errors'

function createParticipantRepository(participants = []) {
  const snapshot = participants.map((participant) => ({
    deletedAt: null,
    ...participant,
  }))
  const active = snapshot.filter((participant) => !participant.deletedAt)

  return {
    list: vi.fn(async () => snapshot.map((participant) => ({ ...participant }))),
    listActive: vi.fn(async () =>
      active.map((participant) => ({ ...participant })),
    ),
  }
}

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Davi' },
  { id: 'p-5', name: 'Elisa' },
  { id: 'p-6', name: 'Fabio' },
]

async function renderViewModel(overrides = {}) {
  const participantRepository =
    overrides.participantRepository ?? createParticipantRepository(PARTICIPANTS)
  const startMatch = overrides.startMatch ?? vi.fn(() => ({}))
  const onStarted = overrides.onStarted ?? vi.fn()
  const hook = renderHook(() =>
    useMatchSetupViewModel({ participantRepository, startMatch, onStarted }),
  )

  await waitFor(() => expect(hook.result.current.viewState.loading).toBe(false))
  await waitFor(() =>
    expect(hook.result.current.viewState.rows.length).toBeGreaterThanOrEqual(0),
  )

  return { ...hook, startMatch, onStarted, participantRepository }
}

describe('useMatchSetupViewModel', () => {
  it('carrega apenas ativos e os seleciona por padrão', async () => {
    const participantRepository = createParticipantRepository([
      ...PARTICIPANTS,
      { id: 'p-7', name: 'Gabi', deletedAt: '2026-11-17T21:00:00.000Z' },
    ])

    const { result } = await renderViewModel({ participantRepository })

    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    expect(participantRepository.listActive).toHaveBeenCalledTimes(1)
    expect(result.current.viewState.rows.map((row) => row.name)).toEqual([
      'Ana',
      'Bruno',
      'Carla',
      'Davi',
      'Elisa',
      'Fabio',
    ])
    expect(result.current.viewState.rows.every((row) => row.selected)).toBe(true)
    expect(result.current.viewState.counts).toEqual({
      selectedCount: 6,
      totalCount: 6,
    })
  })

  it('desmarca e seleciona todos mantendo os papéis', async () => {
    const { result } = await renderViewModel()
    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    act(() => {
      result.current.actions.setParticipantRole('p-1', PlayerRole.ASSASSIN)
      result.current.actions.deselectAll()
    })

    expect(result.current.viewState.summary.selectedCount).toBe(0)
    expect(result.current.viewState.blockingMessage).toBe(
      'Selecione pelo menos cinco participantes.',
    )

    act(() => {
      result.current.actions.selectAll()
    })

    expect(result.current.viewState.summary.selectedCount).toBe(6)
    expect(
      result.current.viewState.rows.find((row) => row.participantId === 'p-1').role,
    ).toBe(PlayerRole.ASSASSIN)
  })

  it('preserva o papel ao desmarcar e remarcar um participante', async () => {
    const { result } = await renderViewModel()
    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    act(() => {
      result.current.actions.setParticipantRole('p-1', PlayerRole.ASSASSIN)
      result.current.actions.toggleParticipant('p-1')
    })

    expect(result.current.viewState.counts.selectedCount).toBe(5)

    act(() => {
      result.current.actions.toggleParticipant('p-1')
    })

    expect(
      result.current.viewState.rows.find((row) => row.participantId === 'p-1').role,
    ).toBe(PlayerRole.ASSASSIN)
  })

  it('atualiza o contador e valida o mínimo após cada alteração', async () => {
    const { result } = await renderViewModel()
    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    act(() => {
      result.current.actions.toggleParticipant('p-6')
      result.current.actions.toggleParticipant('p-5')
    })

    expect(result.current.viewState.counts.selectedCount).toBe(4)
    expect(result.current.viewState.blockingMessage).toBe(
      'Selecione pelo menos cinco participantes.',
    )
  })

  it('bloqueia configuração sem assassino', async () => {
    const { result, startMatch } = await renderViewModel()
    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    expect(result.current.viewState.blockingMessage).toBe(
      'Inclua pelo menos um assassino.',
    )

    act(() => {
      result.current.actions.submit()
    })

    expect(startMatch).not.toHaveBeenCalled()
  })

  it('inicia a sessão apenas com os selecionados e papéis escolhidos', async () => {
    const startMatch = vi.fn(() => ({ id: 'session-1' }))
    const onStarted = vi.fn()
    const { result } = await renderViewModel({ startMatch, onStarted })
    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    act(() => {
      result.current.actions.deselectAll()
      result.current.actions.toggleParticipant('p-1')
      result.current.actions.toggleParticipant('p-2')
      result.current.actions.toggleParticipant('p-3')
      result.current.actions.toggleParticipant('p-4')
      result.current.actions.toggleParticipant('p-5')
      result.current.actions.setParticipantRole('p-1', PlayerRole.ASSASSIN)
      result.current.actions.setParticipantRole('p-2', PlayerRole.DETECTIVE)
    })

    expect(result.current.viewState.blockingMessage).toBe('')

    let started

    act(() => {
      started = result.current.actions.submit()
    })

    expect(started).toBe(true)
    expect(startMatch).toHaveBeenCalledTimes(1)
    expect(startMatch.mock.calls[0][0]).toEqual({
      participants: [
        { participantId: 'p-1', role: PlayerRole.ASSASSIN },
        { participantId: 'p-2', role: PlayerRole.DETECTIVE },
        { participantId: 'p-3', role: PlayerRole.INNOCENT },
        { participantId: 'p-4', role: PlayerRole.INNOCENT },
        { participantId: 'p-5', role: PlayerRole.INNOCENT },
      ],
    })
    expect(onStarted).toHaveBeenCalledTimes(1)
    expect(result.current.viewState.error).toBe('')
  })

  it('traduz erros de domínio lançados ao iniciar a partida', async () => {
    const startMatch = vi.fn(() => {
      throw new GameRuleError('MATCH_ALREADY_FINISHED')
    })
    const onStarted = vi.fn()
    const { result } = await renderViewModel({ startMatch, onStarted })
    await waitFor(() =>
      expect(result.current.viewState.summary.selectedCount).toBe(6),
    )

    act(() => {
      result.current.actions.setParticipantRole('p-1', PlayerRole.ASSASSIN)
    })

    act(() => {
      result.current.actions.submit()
    })

    expect(result.current.viewState.error).toBe('A partida já foi encerrada.')
    expect(onStarted).not.toHaveBeenCalled()
  })

  it('traduz erros de carregamento em mensagem segura', async () => {
    const participantRepository = {
      listActive: vi.fn(async () => {
        throw new Error('falha interna')
      }),
    }

    const { result } = await renderViewModel({ participantRepository })

    await waitFor(() => expect(result.current.viewState.loading).toBe(false))

    expect(result.current.viewState.loadError).toBe(
      'Não foi possível concluir a operação. Tente novamente.',
    )
  })
})
