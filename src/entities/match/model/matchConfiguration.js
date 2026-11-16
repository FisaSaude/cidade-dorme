import { PLAYER_ROLE_VALUES, PlayerRole } from '@/entities/match-participant/model/playerRole'
import { GameRuleError } from '@/shared/lib/errors'

export const MIN_PARTICIPANTS = 5

/**
 * Normaliza o papel de uma seleção: ausência de papel especial vira INNOCENT.
 * @param {unknown} role
 * @returns {string}
 */
export function normalizeConfigurationRole(role) {
  if (role === undefined || role === null || role === '') {
    return PlayerRole.INNOCENT
  }

  return /** @type {string} */ (role)
}

/**
 * Valida e normaliza uma configuração de partida.
 * @param {{ participants?: Array<{ participantId?: unknown, role?: unknown }> }} [configuration]
 * @returns {{ participants: Array<{ participantId: string, role: string }> }}
 */
export function validateMatchConfiguration(configuration) {
  const participants = configuration?.participants

  if (!Array.isArray(participants) || participants.length < MIN_PARTICIPANTS) {
    throw new GameRuleError(
      'MIN_PARTICIPANTS',
      `At least ${MIN_PARTICIPANTS} participants are required.`,
    )
  }

  const seenParticipantIds = new Set()
  const normalized = participants.map((entry) => {
    const participantId = entry?.participantId

    if (typeof participantId !== 'string' || !participantId.trim()) {
      throw new GameRuleError(
        'INVALID_PARTICIPANT',
        'Every configuration entry requires a participantId.',
      )
    }

    const role = normalizeConfigurationRole(entry?.role)

    if (!PLAYER_ROLE_VALUES.includes(role)) {
      throw new GameRuleError('INVALID_ROLE', `Invalid player role: ${String(role)}.`)
    }

    if (seenParticipantIds.has(participantId)) {
      throw new GameRuleError(
        'DUPLICATE_PARTICIPANT',
        `Participant ${participantId} appears more than once.`,
      )
    }

    seenParticipantIds.add(participantId)

    return { participantId, role }
  })

  if (!normalized.some((entry) => entry.role === PlayerRole.ASSASSIN)) {
    throw new GameRuleError('NO_ASSASSIN', 'At least one assassin is required.')
  }

  return { participants: normalized }
}

/**
 * Constrói a configuração a partir das seleções do formulário.
 * @param {Array<{ participantId?: unknown, role?: unknown }>} [selections]
 * @returns {{ participants: Array<{ participantId: string, role: string }> }}
 */
export function createMatchConfiguration(selections = []) {
  return validateMatchConfiguration({
    participants: (selections ?? []).map((selection) => ({
      participantId: selection?.participantId,
      role: selection?.role,
    })),
  })
}
