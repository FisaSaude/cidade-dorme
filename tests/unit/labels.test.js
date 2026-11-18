import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ERROR_MESSAGE,
  gameRuleErrorMessages,
  getGameRuleErrorMessage,
  getLabel,
  matchClosureReasonLabels,
  matchPhaseLabels,
  matchStatusLabels,
  matchWinnerLabels,
  playerRoleLabels,
  playerStatusLabels,
  uiMessages,
} from '@/shared/config/labels'

describe('labels', () => {
  it('traduz papéis e status', () => {
    expect(playerRoleLabels.INNOCENT).toBe('Inocente')
    expect(playerRoleLabels.ASSASSIN).toBe('Assassino')
    expect(playerRoleLabels.DETECTIVE).toBe('Detetive')
    expect(playerStatusLabels.ALIVE).toBe('Vivo')
    expect(playerStatusLabels.DEAD).toBe('Morto')
  })

  it('traduz fases, vencedores, encerramento e status da partida', () => {
    expect(matchPhaseLabels.TURN_START).toBe('Início do turno')
    expect(matchPhaseLabels.VOTING).toBe('Votação')
    expect(matchWinnerLabels.INNOCENTS).toBe('Inocentes e Detetives')
    expect(matchWinnerLabels.ASSASSINS).toBe('Assassinos')
    expect(matchClosureReasonLabels.VICTORY).toBe('Vitória')
    expect(matchClosureReasonLabels.MANUAL).toBe('Encerramento manual')
    expect(matchStatusLabels.FINISHED).toBe('Encerrada')
  })

  it('traduz códigos de erro conhecidos e usa fallback seguro', () => {
    expect(getGameRuleErrorMessage('MIN_PARTICIPANTS')).toBe(
      'Selecione pelo menos cinco participantes.',
    )
    expect(getGameRuleErrorMessage('MATCH_ALREADY_FINISHED')).toBe(
      'A partida já foi encerrada.',
    )
    expect(getGameRuleErrorMessage('CODIGO_DESCONHECIDO')).toBe(
      DEFAULT_ERROR_MESSAGE,
    )
    expect(getGameRuleErrorMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE)
  })

  it('cobre todos os códigos de erro do contrato', () => {
    const contractCodes = [
      'MIN_PARTICIPANTS',
      'NO_ASSASSIN',
      'INVALID_ROLE',
      'DUPLICATE_PARTICIPANT',
      'INVALID_PARTICIPANT',
      'INVALID_PHASE',
      'INVALID_ACTOR_ROLE',
      'ACTOR_NOT_ALIVE',
      'TARGET_NOT_ALIVE',
      'TARGET_IS_SELF',
      'VOTE_ALREADY_REGISTERED',
      'MATCH_ALREADY_FINISHED',
      'INVALID_VOTE_RESULT',
      'PARTICIPANT_IN_ACTIVE_MATCH',
      'MATCH_NOT_FINISHED',
    ]

    for (const code of contractCodes) {
      expect(gameRuleErrorMessages[code]).toBeTruthy()
    }
  })

  it('cobre mensagens de interface do delta de exclusões e status em massa', () => {
    const expectedKeys = [
      'participantArchiveConfirmTitle',
      'participantArchiveConfirmDescription',
      'participantArchiveSuccess',
      'participantArchiveFailure',
      'participantArchiveBlockedActiveMatch',
      'matchDeletionConfirmTitle',
      'matchDeletionConfirmDescription',
      'matchDeletionSuccess',
      'matchDeletionAlreadyRemoved',
      'matchDeletionFailure',
      'assassinsVictoryBulkStatus',
    ]

    for (const key of expectedKeys) {
      expect(uiMessages[key]).toBeTruthy()
    }
  })

  it('getLabel retorna rótulo ou fallback', () => {
    expect(getLabel(playerRoleLabels, 'ASSASSIN')).toBe('Assassino')
    expect(getLabel(playerRoleLabels, 'UNKNOWN', 'Desconhecido')).toBe(
      'Desconhecido',
    )
    expect(getLabel(playerRoleLabels, null, 'Vazio')).toBe('Vazio')
  })
})
