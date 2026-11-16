import {
  isPlayerRole,
  PLAYER_ROLE_VALUES,
  PlayerRole,
} from '@/entities/match-participant/model/playerRole'
import { playerRoleLabels } from '@/shared/config/labels'

export const MATCH_SETUP_ROLE_OPTIONS = Object.freeze(
  PLAYER_ROLE_VALUES.map((value) =>
    Object.freeze({ value, label: playerRoleLabels[value] ?? value }),
  ),
)

/**
 * Estado local da configuração manual de papéis.
 * @returns {{ selections: Record<string, { role: string }> }}
 */
export function createMatchSetupState() {
  return { selections: {} }
}

/**
 * Alterna a seleção de um participante, aplicando INNOCENT como padrão.
 * @param {{ selections: Record<string, { role: string }> }} state
 * @param {string} participantId
 */
export function toggleParticipantSelection(state, participantId) {
  if (typeof participantId !== 'string' || !participantId) {
    return state
  }

  const selections = { ...state.selections }

  if (selections[participantId]) {
    delete selections[participantId]
  } else {
    selections[participantId] = { role: PlayerRole.INNOCENT }
  }

  return { ...state, selections }
}

/**
 * Define o papel de um participante já selecionado.
 * @param {{ selections: Record<string, { role: string }> }} state
 * @param {string} participantId
 * @param {string} role
 */
export function setParticipantRole(state, participantId, role) {
  if (!state.selections[participantId] || !isPlayerRole(role)) {
    return state
  }

  return {
    ...state,
    selections: {
      ...state.selections,
      [participantId]: { role },
    },
  }
}

/**
 * Cruza o cadastro de participantes com as seleções locais.
 * @param {Array<{ id: string, name: string }>} participants
 * @param {{ selections: Record<string, { role: string }> }} state
 */
export function getMatchSetupRows(participants = [], state) {
  const selections = state?.selections ?? {}

  return participants.map((participant) => {
    const selection = selections[participant.id]

    return {
      participantId: participant.id,
      name: participant.name,
      selected: Boolean(selection),
      role: selection?.role ?? PlayerRole.INNOCENT,
    }
  })
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
