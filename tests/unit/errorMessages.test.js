import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ERROR_MESSAGE,
  gameRuleErrorMessages,
  getGameRuleErrorMessage,
} from '@/shared/config/labels'

const GAME_RULE_ERROR_CODES = [
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
  'PARTICIPANT_NAME_REQUIRED',
  'PARTICIPANT_NAME_DUPLICATED',
]

const TECHNICAL_PATTERNS = [
  /Game rule violation/i,
  /Expected phase/i,
  /participantId/i,
  /TypeError/i,
  /undefined/i,
  /\bcode\b/i,
]

describe('mensagens de erro do domínio', () => {
  it('cobre todos os códigos de GameRuleError com mensagens em português', () => {
    for (const code of GAME_RULE_ERROR_CODES) {
      expect(gameRuleErrorMessages[code], code).toBeTruthy()
      expect(getGameRuleErrorMessage(code)).toBe(gameRuleErrorMessages[code])
    }
  })

  it('não expõe mensagens técnicas ao narrador', () => {
    for (const code of GAME_RULE_ERROR_CODES) {
      const message = getGameRuleErrorMessage(code)

      for (const pattern of TECHNICAL_PATTERNS) {
        expect(message).not.toMatch(pattern)
      }
    }
  })

  it('usa fallback seguro para códigos desconhecidos', () => {
    expect(getGameRuleErrorMessage('UNKNOWN_CODE')).toBe(DEFAULT_ERROR_MESSAGE)
    expect(getGameRuleErrorMessage(null)).toBe(DEFAULT_ERROR_MESSAGE)
    expect(getGameRuleErrorMessage(undefined)).toBe(DEFAULT_ERROR_MESSAGE)
  })
})
