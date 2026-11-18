import { describe, expect, it } from 'vitest'
import {
  MATCH_NOT_FINISHED,
  cancelMatchDeletion,
  createMatchDeletionState,
  getMatchDeletionDecision,
  isAlreadyRemoved,
  requestMatchDeletion,
  shouldCloseDetail,
} from '@/features/match-deletion/model/matchDeletion'
import { ApiError } from '@/shared/lib/errors'
import { makeFinishedMatch, makeMatch } from '../fixtures/sessionBuilder'

describe('decisão de exclusão de partida', () => {
  it('permite excluir apenas partidas finalizadas', () => {
    const allowed = getMatchDeletionDecision(makeFinishedMatch())
    const blocked = getMatchDeletionDecision(
      makeMatch({ status: 'IN_PROGRESS' }),
    )

    expect(allowed).toEqual({ allowed: true, code: null, message: '' })
    expect(blocked.allowed).toBe(false)
    expect(blocked.code).toBe(MATCH_NOT_FINISHED)
    expect(blocked.message).toBe(
      'Apenas partidas finalizadas podem ser excluídas.',
    )
  })

  it('abre e cancela a confirmação', () => {
    const opened = requestMatchDeletion(
      createMatchDeletionState(),
      'match-1',
    )

    expect(opened.pendingMatchId).toBe('match-1')
    expect(cancelMatchDeletion(opened).pendingMatchId).toBeNull()
  })

  it('fecha o detalhe apenas quando a partida excluída é a selecionada', () => {
    expect(
      shouldCloseDetail({ deletedMatchId: 'match-1', selectedMatchId: 'match-1' }),
    ).toBe(true)
    expect(
      shouldCloseDetail({ deletedMatchId: 'match-1', selectedMatchId: 'match-2' }),
    ).toBe(false)
    expect(
      shouldCloseDetail({ deletedMatchId: 'match-1', selectedMatchId: null }),
    ).toBe(false)
  })

  it('reconhece 404 como remoção já concluída', () => {
    expect(isAlreadyRemoved(new ApiError('Não encontrado.', 404))).toBe(true)
    expect(isAlreadyRemoved(new ApiError('Falha.', 500))).toBe(false)
    expect(isAlreadyRemoved(new Error('404'))).toBe(false)
  })
})
