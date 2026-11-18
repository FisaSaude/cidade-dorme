import { MatchStatus } from '@/entities/match'
import { getGameRuleErrorMessage } from '@/shared/config/labels'
import { ApiError } from '@/shared/lib/errors'

export const MATCH_NOT_FINISHED = 'MATCH_NOT_FINISHED'

export const INITIAL_MATCH_DELETION_STATE = Object.freeze({
  pendingMatchId: null,
})

/**
 * @returns {{ pendingMatchId: string | null }}
 */
export function createMatchDeletionState() {
  return { ...INITIAL_MATCH_DELETION_STATE }
}

/**
 * @param {{ status?: string } | null | undefined} match
 * @returns {{ allowed: boolean, code: string | null, message: string }}
 */
export function getMatchDeletionDecision(match) {
  if (match?.status !== MatchStatus.FINISHED) {
    return {
      allowed: false,
      code: MATCH_NOT_FINISHED,
      message: getGameRuleErrorMessage(MATCH_NOT_FINISHED),
    }
  }

  return { allowed: true, code: null, message: '' }
}

/**
 * @param {{ pendingMatchId: string | null }} state
 * @param {string} matchId
 */
export function requestMatchDeletion(state, matchId) {
  if (typeof matchId !== 'string' || !matchId) {
    return state
  }

  return { ...state, pendingMatchId: matchId }
}

/**
 * @param {{ pendingMatchId: string | null }} state
 */
export function cancelMatchDeletion(state) {
  return { ...state, pendingMatchId: null }
}

/**
 * @param {{ deletedMatchId: string, selectedMatchId: string | null }} input
 * @returns {boolean}
 */
export function shouldCloseDetail({ deletedMatchId, selectedMatchId } = {}) {
  return Boolean(deletedMatchId) && deletedMatchId === selectedMatchId
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAlreadyRemoved(error) {
  return error instanceof ApiError && error.status === 404
}

export default createMatchDeletionState
