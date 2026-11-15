import { isPlayerRole, PlayerRole } from './playerRole'
import { PlayerStatus } from './playerStatus'

export const ELIMINATION_PHASES = Object.freeze(['NIGHT', 'VOTE'])

/**
 * @typedef {Object} EliminatedAt
 * @property {number} turn
 * @property {'NIGHT' | 'VOTE'} phase
 */

/**
 * @typedef {Object} MatchParticipant
 * @property {string} id
 * @property {string} participantId
 * @property {'INNOCENT' | 'ASSASSIN' | 'DETECTIVE'} role
 * @property {'ALIVE' | 'DEAD'} status
 * @property {EliminatedAt | null} eliminatedAt
 */

/**
 * Valida o momento de eliminação de um participante.
 * @param {unknown} eliminatedAt
 * @returns {EliminatedAt}
 */
export function validateEliminatedAt(eliminatedAt) {
  if (!eliminatedAt || typeof eliminatedAt !== 'object') {
    throw new TypeError('eliminatedAt must be an object.')
  }

  const { turn, phase } = /** @type {{ turn?: unknown, phase?: unknown }} */ (
    eliminatedAt
  )

  if (!Number.isInteger(turn) || /** @type {number} */ (turn) < 1) {
    throw new TypeError('eliminatedAt.turn must be an integer >= 1.')
  }

  if (!ELIMINATION_PHASES.includes(/** @type {string} */ (phase))) {
    throw new TypeError('eliminatedAt.phase must be NIGHT or VOTE.')
  }

  return { turn: /** @type {number} */ (turn), phase: /** @type {'NIGHT' | 'VOTE'} */ (phase) }
}

/**
 * Cria um participante de partida vivo, com papel imutável.
 * @param {{ id: string, participantId: string, role?: 'INNOCENT' | 'ASSASSIN' | 'DETECTIVE' }} input
 * @returns {MatchParticipant}
 */
export function createMatchParticipant({ id, participantId, role = PlayerRole.INNOCENT }) {
  if (!id || typeof id !== 'string') {
    throw new TypeError('MatchParticipant id is required.')
  }

  if (!participantId || typeof participantId !== 'string') {
    throw new TypeError('MatchParticipant participantId is required.')
  }

  if (!isPlayerRole(role)) {
    throw new TypeError(`Invalid player role: ${String(role)}`)
  }

  const matchParticipant = {
    id,
    participantId,
    role,
    status: PlayerStatus.ALIVE,
    eliminatedAt: null,
  }

  Object.defineProperty(matchParticipant, 'role', {
    value: role,
    enumerable: true,
    writable: false,
    configurable: false,
  })

  return matchParticipant
}

/**
 * Indica se o participante da partida está vivo.
 * @param {MatchParticipant} matchParticipant
 * @returns {boolean}
 */
export function isMatchParticipantAlive(matchParticipant) {
  return matchParticipant.status === PlayerStatus.ALIVE
}

/**
 * Elimina um participante da partida, preservando o papel.
 * @param {MatchParticipant} matchParticipant
 * @param {EliminatedAt} eliminatedAt
 * @returns {MatchParticipant}
 */
export function eliminateMatchParticipant(matchParticipant, eliminatedAt) {
  if (matchParticipant.status === PlayerStatus.DEAD) {
    throw new TypeError('MatchParticipant is already eliminated.')
  }

  const validEliminatedAt = validateEliminatedAt(eliminatedAt)

  return {
    ...matchParticipant,
    status: PlayerStatus.DEAD,
    eliminatedAt: validEliminatedAt,
  }
}
