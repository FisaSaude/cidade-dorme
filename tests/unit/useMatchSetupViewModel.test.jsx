import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { useMatchSetupViewModel } from '@/pages/match-setup/useMatchSetupViewModel'
import { GameRuleError } from '@/shared/lib/errors'

function createParticipantRepository(participants = []) {
  const snapshot = participants.map((participant) => ({ ...participant }))

  return {
    list: vi.fn(async () => snapshot.map((participant) => ({ ...participant }))),
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

  return { ...hook, startMatch, onStarted, participantRepository }
}

describe('useMatchSetupViewModel', () => {
  it('carrega participantes como linhas não selecionadas', async () => {
    const { result } = await renderViewModel()

    expect(result.current.viewState.rows).toHaveLength(6)
    expect(result.current.viewState.rows.map((row) => row.name)).toEqual([
      'Ana',
      'Bruno',
      'Carla',
      'Davi',
      'Elisa',
      'Fabio',
    ])
    expect(result.current.viewState.rows.every((row) => !row.selected)).toBe(true)
    expect(result.current.viewState.summary).toEqual({
      selectedCount: 0,
      assassinCount: 0,
      detectiveCount: 0,
      innocentCount: 0,
    })
  })

  it('seleciona e desseleciona participantes mantendo uma linha por pessoa', async () => {
    const { result } = await renderViewModel()

    act(() => {
      result.current.actions.toggleParticipant('p-1')
      result.current.actions.toggleParticipant('p-2')
    })

    expect(result.current.viewState.summary.selectedCount).toBe(2)
    expect(result.current.viewState.rows[0].selected).toBe(true)
    expect(result.current.viewState.rows[0].role).toBe(PlayerRole.INNOCENT)

    act(() => {
      result.current.actions.toggleParticipant('p-1')
    })

    expect(result.current.viewState.summary.selectedCount).toBe(1)
    expect(result.current.viewState.rows[0].selected).toBe(false)
  })

  it('atribui um único papel por participante e atualiza as contagens', async () => {
    const { result } = await renderViewModel()

    act(() => {
      ;['p-1', 'p-2', 'p-3', 'p-4', 'p-5'].forEach((participantId) =>
        result.current.actions.toggleParticipant(participantId),
      )
    })

    act(() => {
      result.current.actions.setParticipantRole('p-1', PlayerRole.ASSASSIN)
      result.current.actions.setParticipantRole('p-2', PlayerRole.DETECTIVE)
    })

    expect(result.current.viewState.summary).toEqual({
      selectedCount: 5,
      assassinCount: 1,
      detectiveCount: 1,
      innocentCount: 3,
    })
    expect(result.current.viewState.rows[0].role).toBe(PlayerRole.ASSASSIN)
    expect(result.current.viewState.rows[1].role).toBe(PlayerRole.DETECTIVE)
    expect(result.current.viewState.rows[2].role).toBe(PlayerRole.INNOCENT)
  })

  it('bloqueia menos de cinco participantes com mensagem em português', async () => {
    const { result, startMatch } = await renderViewModel()

    act(() => {
      ;['p-1', 'p-2', 'p-3', 'p-4'].forEach((participantId) =>
        result.current.actions.toggleParticipant(participantId),
      )
    })

    expect(result.current.viewState.blockingMessage).toBe(
      'Selecione pelo menos cinco participantes.',
    )

    act(() => {
      result.current.actions.submit()
    })

    expect(startMatch).not.toHaveBeenCalled()
  })

  it('bloqueia configuração sem assassino', async () => {
    const { result, startMatch } = await renderViewModel()

    act(() => {
      ;['p-1', 'p-2', 'p-3', 'p-4', 'p-5'].forEach((participantId) =>
        result.current.actions.toggleParticipant(participantId),
      )
    })

    expect(result.current.viewState.blockingMessage).toBe(
      'Inclua pelo menos um assassino.',
    )

    act(() => {
      result.current.actions.submit()
    })

    expect(startMatch).not.toHaveBeenCalled()
  })

  it('inicia a sessão válida com os papéis escolhidos e sem sorteio', async () => {
    const startMatch = vi.fn(() => ({ id: 'session-1' }))
    const onStarted = vi.fn()
    const { result } = await renderViewModel({ startMatch, onStarted })

    act(() => {
      ;['p-1', 'p-2', 'p-3', 'p-4', 'p-5'].forEach((participantId) =>
        result.current.actions.toggleParticipant(participantId),
      )
    })

    act(() => {
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

    act(() => {
      ;['p-1', 'p-2', 'p-3', 'p-4', 'p-5'].forEach((participantId) =>
        result.current.actions.toggleParticipant(participantId),
      )
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
      list: vi.fn(async () => {
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
