import { describe, expect, it } from 'vitest'
import { MatchPhase } from '@/entities/match/model/matchPhases'
import { ANNOUNCEMENT_TEXT } from '@/features/special-announcement/model/announcements'

describe('announcement map', () => {
  it('mantém o mapa exato das fases de anúncio', () => {
    expect(ANNOUNCEMENT_TEXT).toEqual({
      [MatchPhase.TURN_START]: 'Cidade Dorme',
      [MatchPhase.ASSASSINS_ANNOUNCEMENT]: 'Assassinos Acordem',
      [MatchPhase.DETECTIVES_ANNOUNCEMENT]: 'Detetives Acordem',
      [MatchPhase.DAWN_ANNOUNCEMENT]: 'Cidade Acorda',
    })
  })
})
