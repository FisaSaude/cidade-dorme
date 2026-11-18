import { getGameRuleErrorMessage } from '@/shared/config/labels'

export const PARTICIPANT_IN_ACTIVE_MATCH = 'PARTICIPANT_IN_ACTIVE_MATCH'

export const INITIAL_PARTICIPANT_DELETION_STATE = Object.freeze({
  pendingParticipantId: null,
})

/**
 * @returns {{ pendingParticipantId: string | null }}
 */
export function createParticipantDeletionState() {
  return { ...INITIAL_PARTICIPANT_DELETION_STATE }
}

/**
 * Decide se o participante pode ser arquivado sem consultar a interface.
 * @param {{ participantId: string, activeParticipantIds?: string[] }} input
 * @returns {{ allowed: boolean, code: string | null, message: string }}
 */
export function getParticipantDeletionDecision({
  participantId,
  activeParticipantIds = [],
} = {}) {
  const isInActiveMatch = (activeParticipantIds ?? []).includes(participantId)

  if (isInActiveMatch) {
    return {
      allowed: false,
      code: PARTICIPANT_IN_ACTIVE_MATCH,
      message: getGameRuleErrorMessage(PARTICIPANT_IN_ACTIVE_MATCH),
    }
  }

  return { allowed: true, code: null, message: '' }
}

/**
 * @param {{ pendingParticipantId: string | null }} state
 * @param {string} participantId
 */
export function requestParticipantDeletion(state, participantId) {
  if (typeof participantId !== 'string' || !participantId) {
    return state
  }

  return { ...state, pendingParticipantId: participantId }
}

/**
 * @param {{ pendingParticipantId: string | null }} state
 */
export function cancelParticipantDeletion(state) {
  return { ...state, pendingParticipantId: null }
}

export default createParticipantDeletionState
