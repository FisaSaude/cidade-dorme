export const EMPTY_PARTICIPANT_FORM = Object.freeze({ id: null, name: '' })

/**
 * Cria o estado do formulário a partir de um participante existente ou vazio.
 * @param {{ id: string, name: string } | null} [participant]
 * @returns {{ id: string | null, name: string }}
 */
export function createParticipantForm(participant = null) {
  if (!participant) {
    return { ...EMPTY_PARTICIPANT_FORM }
  }

  return { id: participant.id, name: participant.name }
}

/**
 * @param {{ id: string | null, name: string }} form
 * @param {string} name
 * @returns {{ id: string | null, name: string }}
 */
export function updateParticipantFormName(form, name) {
  return { ...form, name }
}

/**
 * @param {{ id: string | null } | null} form
 * @returns {boolean}
 */
export function isEditingParticipantForm(form) {
  return Boolean(form?.id)
}

/**
 * @param {{ id: string | null } | null} form
 * @returns {string}
 */
export function getParticipantFormTitle(form) {
  return isEditingParticipantForm(form) ? 'Editar participante' : 'Novo participante'
}

/**
 * @param {{ id: string | null } | null} form
 * @returns {string}
 */
export function getParticipantFormSubmitLabel(form) {
  return isEditingParticipantForm(form) ? 'Salvar alterações' : 'Adicionar participante'
}
