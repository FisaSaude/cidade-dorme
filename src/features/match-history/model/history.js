import { MatchStatus } from '@/entities/match/model/matchStatus'
import {
  matchClosureReasonLabels,
  matchWinnerLabels,
  playerRoleLabels,
  playerStatusLabels,
} from '@/shared/config/labels'
import { formatDateTimePtBr } from '@/shared/lib/date'

export const UNKNOWN_PARTICIPANT_NAME = 'Participante sem nome'
export const NO_WINNER_LABEL = 'Partida encerrada sem vencedor'

const ELIMINATION_PHASE_LABELS = Object.freeze({
  NIGHT: 'Noite',
  VOTE: 'Votação',
})

/**
 * @param {unknown} match
 * @returns {boolean}
 */
export function isFinishedMatch(match) {
  return (
    match !== null &&
    typeof match === 'object' &&
    /** @type {{ status?: string }} */ (match).status === MatchStatus.FINISHED
  )
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toTimestamp(value) {
  const time = typeof value === 'string' ? Date.parse(value) : Number.NaN
  return Number.isNaN(time) ? 0 : time
}

/**
 * Filtra partidas finalizadas e ordena por encerramento decrescente.
 * @param {Array<object> | null | undefined} matches
 * @returns {Array<object>}
 */
export function getFinishedMatches(matches) {
  const list = Array.isArray(matches) ? matches : []

  return list
    .filter(isFinishedMatch)
    .sort(
      (left, right) =>
        toTimestamp(right.endedAt) - toTimestamp(left.endedAt),
    )
}

/**
 * Cria o mapa de nomes atuais por `participantId`.
 * @param {Array<{ id: string, name: string }> | null | undefined} participants
 * @returns {Record<string, string>}
 */
export function createParticipantNameMap(participants) {
  const list = Array.isArray(participants) ? participants : []

  return Object.fromEntries(
    list.map((participant) => [participant.id, participant.name]),
  )
}

/**
 * @param {Record<string, string>} nameMap
 * @param {string} participantId
 * @returns {string}
 */
export function resolveParticipantName(nameMap, participantId) {
  return nameMap?.[participantId] ?? UNKNOWN_PARTICIPANT_NAME
}

/**
 * @param {{ winner?: string | null } | null | undefined} match
 * @returns {string}
 */
export function getOutcomeLabel(match) {
  const winner = match?.winner ?? null

  if (!winner) {
    return NO_WINNER_LABEL
  }

  return `Vitória: ${matchWinnerLabels[winner] ?? winner}`
}

/**
 * @param {{ closureReason?: string | null } | null | undefined} match
 * @returns {string}
 */
export function getClosureReasonLabel(match) {
  const reason = match?.closureReason ?? null

  if (!reason) {
    return ''
  }

  return matchClosureReasonLabels[reason] ?? reason
}

/**
 * @param {{ turn?: number, phase?: string } | null | undefined} eliminatedAt
 * @returns {string}
 */
export function describeElimination(eliminatedAt) {
  if (!eliminatedAt) {
    return ''
  }

  const phaseLabel =
    ELIMINATION_PHASE_LABELS[eliminatedAt.phase] ??
    eliminatedAt.phase ??
    ''

  return `Turno ${eliminatedAt.turn ?? '—'} — ${phaseLabel}`
}

/**
 * @param {object} match
 * @param {Record<string, string>} nameMap
 */
export function buildHistoryItem(match, nameMap) {
  const participants = Array.isArray(match.participants)
    ? match.participants
    : []
  const survivorCount = participants.filter(
    (participant) => participant.status === 'ALIVE',
  ).length

  return {
    id: match.id,
    winner: match.winner ?? null,
    closureReason: match.closureReason ?? null,
    closureReasonLabel: getClosureReasonLabel(match),
    outcomeLabel: getOutcomeLabel(match),
    endedAt: match.endedAt ?? null,
    endedAtLabel: match.endedAt ? formatDateTimePtBr(match.endedAt) : '',
    startedAt: match.startedAt ?? null,
    startedAtLabel: match.startedAt
      ? formatDateTimePtBr(match.startedAt)
      : '',
    turnCount: match.turnCount ?? 0,
    participantCount: participants.length,
    survivorCount,
    eliminatedCount: participants.length - survivorCount,
    participants: participants.map((participant) => ({
      id: participant.id,
      participantId: participant.participantId,
      name: resolveParticipantName(nameMap, participant.participantId),
      role: participant.role,
      roleLabel: playerRoleLabels[participant.role] ?? participant.role,
      status: participant.status,
      statusLabel: playerStatusLabels[participant.status] ?? participant.status,
      eliminatedAt: participant.eliminatedAt ?? null,
      eliminationLabel: describeElimination(participant.eliminatedAt),
    })),
  }
}

/**
 * Deriva a lista de partidas finalizadas pronta para a interface.
 * @param {Array<object> | null | undefined} matches
 * @param {Record<string, string>} [nameMap]
 */
export function buildHistoryList(matches, nameMap = {}) {
  return getFinishedMatches(matches).map((match) =>
    buildHistoryItem(match, nameMap),
  )
}

/**
 * Deriva o detalhe de uma partida finalizada.
 * @param {object} match
 * @param {Record<string, string>} [nameMap]
 */
export function buildHistoryDetail(match, nameMap = {}) {
  return buildHistoryItem(match, nameMap)
}

export default buildHistoryList
