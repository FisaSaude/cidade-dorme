export const playerRoleLabels = Object.freeze({
  INNOCENT: 'Inocente',
  ASSASSIN: 'Assassino',
  DETECTIVE: 'Detetive',
})

export const playerStatusLabels = Object.freeze({
  ALIVE: 'Vivo',
  DEAD: 'Morto',
})

export const matchStatusLabels = Object.freeze({
  IN_PROGRESS: 'Em andamento',
  FINISHED: 'Encerrada',
})

export const matchPhaseLabels = Object.freeze({
  TURN_START: 'Início do turno',
  ASSASSINS_ANNOUNCEMENT: 'Anúncio dos assassinos',
  ASSASSINS_ACTIONS: 'Ações dos assassinos',
  DETECTIVES_ANNOUNCEMENT: 'Anúncio dos detetives',
  DETECTIVES_ACTIONS: 'Investigações dos detetives',
  DAWN_ANNOUNCEMENT: 'Amanhecer',
  DAWN_RESULT: 'Resultado da noite',
  VOTING: 'Votação',
  FINISHED: 'Encerrada',
})

export const matchWinnerLabels = Object.freeze({
  INNOCENTS: 'Inocentes e Detetives',
  ASSASSINS: 'Assassinos',
})

export const matchClosureReasonLabels = Object.freeze({
  VICTORY: 'Vitória',
  MANUAL: 'Encerramento manual',
})

export const gameRuleErrorMessages = Object.freeze({
  MIN_PARTICIPANTS: 'Selecione pelo menos cinco participantes.',
  NO_ASSASSIN: 'Inclua pelo menos um assassino.',
  INVALID_ROLE: 'Um dos papéis selecionados é inválido.',
  DUPLICATE_PARTICIPANT: 'Um participante foi selecionado mais de uma vez.',
  INVALID_PARTICIPANT: 'Participante inválido ou desconhecido.',
  INVALID_PHASE: 'Esta ação não está disponível na fase atual.',
  INVALID_ACTOR_ROLE: 'Este participante não pode executar essa ação.',
  ACTOR_NOT_ALIVE: 'Apenas participantes vivos podem agir.',
  TARGET_NOT_ALIVE: 'Escolha um alvo vivo.',
  TARGET_IS_SELF: 'O participante não pode escolher a si mesmo.',
  VOTE_ALREADY_REGISTERED: 'O resultado da votação deste turno já foi registrado.',
  MATCH_ALREADY_FINISHED: 'A partida já foi encerrada.',
  INVALID_VOTE_RESULT: 'O resultado da votação é inválido.',
})

export const DEFAULT_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente.'

/**
 * Traduz um código de erro de domínio para uma mensagem em português.
 * @param {string | undefined | null} code
 * @returns {string}
 */
export function getGameRuleErrorMessage(code) {
  return gameRuleErrorMessages[code] ?? DEFAULT_ERROR_MESSAGE
}

/**
 * Obtém um rótulo de um mapa com fallback seguro.
 * @param {Record<string, string>} labels
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function getLabel(labels, value, fallback = '') {
  if (!value) {
    return fallback
  }

  return labels[value] ?? fallback
}
