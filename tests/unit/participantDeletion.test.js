import { describe, expect, it } from 'vitest'
import {
  cancelParticipantDeletion,
  createParticipantDeletionState,
  getParticipantDeletionDecision,
  requestParticipantDeletion,
} from '@/features/participant-deletion/model/participantDeletion'

const ACTIVE_IDS = ['p-1', 'p-2']

describe('decisão de exclusão de participante', () => {
  it('bloqueia a exclusão quando o participante está na partida ativa', () => {
    const decision = getParticipantDeletionDecision({
      participantId: 'p-2',
      activeParticipantIds: ACTIVE_IDS,
    })

    expect(decision.allowed).toBe(false)
    expect(decision.code).toBe('PARTICIPANT_IN_ACTIVE_MATCH')
    expect(decision.message).toBe(
      'Não é possível excluir um participante da partida em andamento.',
    )
  })

  it('permite a exclusão fora da partida ativa', () => {
    const decision = getParticipantDeletionDecision({
      participantId: 'p-3',
      activeParticipantIds: ACTIVE_IDS,
    })

    expect(decision.allowed).toBe(true)
    expect(decision.code).toBeNull()
    expect(decision.message).toBe('')
  })

  it('permite a exclusão quando não há partida ativa', () => {
    expect(
      getParticipantDeletionDecision({ participantId: 'p-3' }).allowed,
    ).toBe(true)
  })

  it('abre a confirmação para o participante pendente', () => {
    const state = requestParticipantDeletion(
      createParticipantDeletionState(),
      'p-3',
    )

    expect(state.pendingParticipantId).toBe('p-3')
  })

  it('cancela a confirmação sem alterar dados', () => {
    const state = requestParticipantDeletion(
      createParticipantDeletionState(),
      'p-3',
    )
    const canceled = cancelParticipantDeletion(state)

    expect(canceled.pendingParticipantId).toBeNull()
  })
})
