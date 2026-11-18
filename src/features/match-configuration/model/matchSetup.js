import {
  isPlayerRole,
  PLAYER_ROLE_VALUES,
  PlayerRole,
} from '@/entities/match-participant'
import { playerRoleLabels } from '@/shared/config/labels'

export const MATCH_SETUP_ROLE_OPTIONS = Object.freeze(
  PLAYER_ROLE_VALUES.map((value) =>
    Object.freeze({ value, label: playerRoleLabels[value] ?? value }),
  ),
)

/**
 * Estado local da configuração manual de papéis.
 * @typedef {{ selectedIds: string[], roles: Record<string, string> }} MatchSetupDraft
 */

/**
 * Cria o rascunho com todos os participantes informados já selecionados.
 * @param {Array<{ id: string }>} [participants]
 * @returns {MatchSetupDraft}
 */
export function createMatchSetupDraft(participants = []) {
  return {
    selectedIds: participants
      .map((participant) => participant?.id)
      .filter((id) => typeof id === 'string' && id),
    roles: {},
  }
}

/**
 * Aliased legado do rascunho vazio/selecionado.
 * @param {Array<{ id: string }>} [participants]
 * @returns {MatchSetupDraft}
 */
export function createMatchSetupState(participants = []) {
  return createMatchSetupDraft(participants)
}

/**
 * Alterna a seleção preservando o papel especial já escolhido.
 * @param {MatchSetupDraft} draft
 * @param {string} participantId
 * @returns {MatchSetupDraft}
 */
export function toggleSelection(draft, participantId) {
  if (typeof participantId !== 'string' || !participantId) {
    return draft
  }

  const selected = draft.selectedIds.includes(participantId)

  return {
    ...draft,
    selectedIds: selected
      ? draft.selectedIds.filter((id) => id !== participantId)
      : [...draft.selectedIds, participantId],
  }
}

/**
 * @param {MatchSetupDraft} draft
 * @param {string} participantId
 * @returns {MatchSetupDraft}
 */
export function toggleParticipantSelection(draft, participantId) {
  return toggleSelection(draft, participantId)
}

/**
 * Seleciona todos os participantes disponíveis mantendo papéis existentes.
 * @param {MatchSetupDraft} draft
 * @param {Array<{ id: string }>} [participants]
 * @returns {MatchSetupDraft}
 */
export function selectAll(draft, participants = []) {
  return {
    ...draft,
    selectedIds: participants
      .map((participant) => participant?.id)
      .filter((id) => typeof id === 'string' && id),
  }
}

/**
 * Desmarca todos sem apagar os papéis armazenados.
 * @param {MatchSetupDraft} draft
 * @returns {MatchSetupDraft}
 */
export function deselectAll(draft) {
  return { ...draft, selectedIds: [] }
}

/**
 * Define o papel de um participante selecionado.
 * @param {MatchSetupDraft} draft
 * @param {string} participantId
 * @param {string} role
 * @returns {MatchSetupDraft}
 */
export function setParticipantRole(draft, participantId, role) {
  if (
    !draft.selectedIds.includes(participantId) ||
    !isPlayerRole(role)
  ) {
    return draft
  }

  return {
    ...draft,
    roles: { ...draft.roles, [participantId]: role },
  }
}

/**
 * Cruza o cadastro de participantes com o rascunho local.
 * @param {Array<{ id: string, name: string }>} participants
 * @param {MatchSetupDraft} draft
 */
export function getMatchSetupRows(participants = [], draft) {
  const selectedIds = draft?.selectedIds ?? []
  const roles = draft?.roles ?? {}

  return participants.map((participant) => ({
    participantId: participant.id,
    name: participant.name,
    selected: selectedIds.includes(participant.id),
    role: roles[participant.id] ?? PlayerRole.INNOCENT,
  }))
}

/**
 * Quantidade de selecionados em relação ao total exibido.
 * @param {Array<{ selected: boolean }>} rows
 */
export function getMatchSetupCounts(rows = []) {
  return {
    selectedCount: rows.filter((row) => row.selected).length,
    totalCount: rows.length,
  }
}

/**
 * Resume as contagens de seleção e papéis.
 * @param {Array<{ selected: boolean, role: string }>} rows
 */
export function getMatchSetupSummary(rows = []) {
  const selected = rows.filter((row) => row.selected)

  return {
    selectedCount: selected.length,
    assassinCount: selected.filter((row) => row.role === PlayerRole.ASSASSIN).length,
    detectiveCount: selected.filter((row) => row.role === PlayerRole.DETECTIVE).length,
    innocentCount: selected.filter((row) => row.role === PlayerRole.INNOCENT).length,
  }
}

/**
 * Converte as linhas selecionadas na configuração aceita pelo domínio.
 * @param {Array<{ participantId: string, selected: boolean, role: string }>} rows
 */
export function toMatchConfiguration(rows = []) {
  return {
    participants: rows
      .filter((row) => row.selected)
      .map((row) => ({ participantId: row.participantId, role: row.role })),
  }
}
