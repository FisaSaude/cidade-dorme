import { describe, expect, it } from 'vitest'
import { GameRuleError } from '@/shared/lib/errors'
import {
  ANNOUNCEMENT_TRANSITIONS,
  EliminationPhase,
  getNextAnnouncementPhase,
  MatchPhase,
} from '@/entities/match/model/matchPhases'

function expectInvalidPhase(phase) {
  try {
    getNextAnnouncementPhase(phase)
    throw new Error('Era esperado um GameRuleError')
  } catch (error) {
    expect(error).toBeInstanceOf(GameRuleError)
    expect(error.code).toBe('INVALID_PHASE')
  }
}

describe('matchPhases', () => {
  it('mantém enums congelados', () => {
    expect(Object.isFrozen(MatchPhase)).toBe(true)
    expect(Object.isFrozen(EliminationPhase)).toBe(true)
    expect(Object.isFrozen(ANNOUNCEMENT_TRANSITIONS)).toBe(true)
  })

  it('contém exatamente as fases do contrato', () => {
    expect(Object.values(MatchPhase)).toEqual([
      'TURN_START',
      'ASSASSINS_ANNOUNCEMENT',
      'ASSASSINS_ACTIONS',
      'DETECTIVES_ANNOUNCEMENT',
      'DETECTIVES_ACTIONS',
      'DAWN_ANNOUNCEMENT',
      'DAWN_RESULT',
      'VOTING',
      'FINISHED',
    ])
  })

  it('mapeia as quatro transições de sobreposição', () => {
    expect(getNextAnnouncementPhase(MatchPhase.TURN_START)).toBe(
      MatchPhase.ASSASSINS_ANNOUNCEMENT,
    )
    expect(getNextAnnouncementPhase(MatchPhase.ASSASSINS_ANNOUNCEMENT)).toBe(
      MatchPhase.ASSASSINS_ACTIONS,
    )
    expect(getNextAnnouncementPhase(MatchPhase.DETECTIVES_ANNOUNCEMENT)).toBe(
      MatchPhase.DETECTIVES_ACTIONS,
    )
    expect(getNextAnnouncementPhase(MatchPhase.DAWN_ANNOUNCEMENT)).toBe(
      MatchPhase.DAWN_RESULT,
    )
  })

  it('rejeita fases sem sobreposição com INVALID_PHASE', () => {
    expectInvalidPhase(MatchPhase.ASSASSINS_ACTIONS)
    expectInvalidPhase(MatchPhase.DETECTIVES_ACTIONS)
    expectInvalidPhase(MatchPhase.DAWN_RESULT)
    expectInvalidPhase(MatchPhase.VOTING)
    expectInvalidPhase(MatchPhase.FINISHED)
    expectInvalidPhase('UNKNOWN_PHASE')
  })
})
