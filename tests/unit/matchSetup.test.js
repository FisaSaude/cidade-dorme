import { describe, expect, it } from 'vitest'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import {
  createMatchSetupDraft,
  deselectAll,
  getMatchSetupCounts,
  getMatchSetupRows,
  getMatchSetupSummary,
  selectAll,
  setParticipantRole,
  toggleSelection,
  toMatchConfiguration,
} from '@/features/match-configuration/model/matchSetup'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Davi' },
  { id: 'p-5', name: 'Elisa' },
]

describe('rascunho de configuração da partida', () => {
  it('inicia com todos os participantes ativos selecionados', () => {
    const draft = createMatchSetupDraft(PARTICIPANTS)

    expect(draft.selectedIds).toEqual(['p-1', 'p-2', 'p-3', 'p-4', 'p-5'])
    expect(draft.roles).toEqual({})
  })

  it('seleciona e desmarca todos', () => {
    const draft = createMatchSetupDraft(PARTICIPANTS)

    expect(deselectAll(draft).selectedIds).toEqual([])
    expect(selectAll(deselectAll(draft), PARTICIPANTS).selectedIds).toEqual([
      'p-1',
      'p-2',
      'p-3',
      'p-4',
      'p-5',
    ])
  })

  it('alterna seleção individual e mantém uma linha por pessoa', () => {
    let draft = createMatchSetupDraft(PARTICIPANTS)

    draft = toggleSelection(draft, 'p-1')
    expect(draft.selectedIds).not.toContain('p-1')
    expect(getMatchSetupRows(PARTICIPANTS, draft)).toHaveLength(5)

    draft = toggleSelection(draft, 'p-1')
    expect(draft.selectedIds).toContain('p-1')
  })

  it('preserva o papel especial ao desmarcar e remarcar', () => {
    let draft = setParticipantRole(
      createMatchSetupDraft(PARTICIPANTS),
      'p-1',
      PlayerRole.ASSASSIN,
    )

    draft = toggleSelection(draft, 'p-1')
    expect(draft.roles['p-1']).toBe(PlayerRole.ASSASSIN)

    draft = toggleSelection(draft, 'p-1')
    const row = getMatchSetupRows(PARTICIPANTS, draft).find(
      (item) => item.participantId === 'p-1',
    )

    expect(row.selected).toBe(true)
    expect(row.role).toBe(PlayerRole.ASSASSIN)
  })

  it('usa INNOCENT como papel padrão quando não há papel definido', () => {
    const rows = getMatchSetupRows(PARTICIPANTS, createMatchSetupDraft(PARTICIPANTS))

    expect(rows.every((row) => row.selected)).toBe(true)
    expect(rows.every((row) => row.role === PlayerRole.INNOCENT)).toBe(true)
  })

  it('calcula o contador de selecionados e o total', () => {
    let draft = deselectAll(createMatchSetupDraft(PARTICIPANTS))
    draft = toggleSelection(draft, 'p-2')

    expect(getMatchSetupCounts(getMatchSetupRows(PARTICIPANTS, draft))).toEqual({
      selectedCount: 1,
      totalCount: 5,
    })
  })

  it('resume apenas os papéis selecionados', () => {
    let draft = deselectAll(createMatchSetupDraft(PARTICIPANTS))
    draft = toggleSelection(toggleSelection(draft, 'p-1'), 'p-2')
    draft = setParticipantRole(draft, 'p-1', PlayerRole.ASSASSIN)

    expect(getMatchSetupSummary(getMatchSetupRows(PARTICIPANTS, draft))).toEqual({
      selectedCount: 2,
      assassinCount: 1,
      detectiveCount: 0,
      innocentCount: 1,
    })
  })

  it('converte apenas os selecionados em configuração de partida', () => {
    let draft = deselectAll(createMatchSetupDraft(PARTICIPANTS))
    draft = toggleSelection(toggleSelection(draft, 'p-1'), 'p-2')
    draft = setParticipantRole(draft, 'p-1', PlayerRole.ASSASSIN)

    expect(toMatchConfiguration(getMatchSetupRows(PARTICIPANTS, draft))).toEqual({
      participants: [
        { participantId: 'p-1', role: PlayerRole.ASSASSIN },
        { participantId: 'p-2', role: PlayerRole.INNOCENT },
      ],
    })
  })
})
