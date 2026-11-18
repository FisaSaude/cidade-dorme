import { describe, expect, it } from 'vitest'
import { rankParticipants } from '@/features/participant-ranking/model/ranking'
import {
  makeFinishedMatch,
  makeMatch,
  makeMatchParticipant,
} from '../fixtures/sessionBuilder.js'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Dora' },
]

/**
 * @param {string} id
 * @param {Array<{ participantId: string, status: string }>} entries
 * @param {object} [overrides]
 */
function makeMatchWithParticipants(id, entries, overrides = {}) {
  return makeFinishedMatch({
    id,
    participants: entries.map((entry, index) =>
      makeMatchParticipant({
        index: index + 1,
        id: `${id}-mp-${index + 1}`,
        participantId: entry.participantId,
        status: entry.status,
      }),
    ),
    ...overrides,
  })
}

describe('rankParticipants', () => {
  it('inclui todos os participantes cadastrados, inclusive com zero sobrevivências', () => {
    const rows = rankParticipants(PARTICIPANTS, [])

    expect(rows).toEqual([
      { participantId: 'p-1', name: 'Ana', survivalCount: 0 },
      { participantId: 'p-2', name: 'Bruno', survivalCount: 0 },
      { participantId: 'p-3', name: 'Carla', survivalCount: 0 },
      { participantId: 'p-4', name: 'Dora', survivalCount: 0 },
    ])
  })

  it('conta uma sobrevivência por participante vivo em partida finalizada', () => {
    const matches = [
      makeMatchWithParticipants('m-1', [
        { participantId: 'p-1', status: 'ALIVE' },
        { participantId: 'p-2', status: 'ALIVE' },
        { participantId: 'p-3', status: 'DEAD' },
        { participantId: 'p-4', status: 'DEAD' },
      ]),
      makeMatchWithParticipants('m-2', [
        { participantId: 'p-1', status: 'ALIVE' },
        { participantId: 'p-2', status: 'DEAD' },
        { participantId: 'p-3', status: 'ALIVE' },
        { participantId: 'p-4', status: 'DEAD' },
      ]),
    ]

    const rows = rankParticipants(PARTICIPANTS, matches)

    expect(rows).toEqual([
      { participantId: 'p-1', name: 'Ana', survivalCount: 2 },
      { participantId: 'p-2', name: 'Bruno', survivalCount: 1 },
      { participantId: 'p-3', name: 'Carla', survivalCount: 1 },
      { participantId: 'p-4', name: 'Dora', survivalCount: 0 },
    ])
  })

  it('exclui participantes mortos da contagem', () => {
    const matches = [
      makeMatchWithParticipants('m-1', [
        { participantId: 'p-1', status: 'DEAD' },
        { participantId: 'p-2', status: 'DEAD' },
      ]),
    ]

    const rows = rankParticipants(PARTICIPANTS, matches)

    expect(rows.every((row) => row.survivalCount === 0)).toBe(true)
  })

  it('contabiliza sobreviventes de encerramento manual', () => {
    const matches = [
      makeMatchWithParticipants(
        'm-manual',
        [
          { participantId: 'p-1', status: 'ALIVE' },
          { participantId: 'p-2', status: 'ALIVE' },
          { participantId: 'p-3', status: 'DEAD' },
        ],
        { winner: null, closureReason: 'MANUAL' },
      ),
    ]

    const rows = rankParticipants(PARTICIPANTS, matches)

    expect(rows).toEqual([
      { participantId: 'p-1', name: 'Ana', survivalCount: 1 },
      { participantId: 'p-2', name: 'Bruno', survivalCount: 1 },
      { participantId: 'p-3', name: 'Carla', survivalCount: 0 },
      { participantId: 'p-4', name: 'Dora', survivalCount: 0 },
    ])
  })

  it('ignora partidas em andamento', () => {
    const matches = [
      makeMatch({
        id: 'm-running',
        status: 'IN_PROGRESS',
        endedAt: null,
        participants: [
          makeMatchParticipant({
            index: 1,
            id: 'running-mp-1',
            participantId: 'p-1',
            status: 'ALIVE',
          }),
        ],
      }),
    ]

    const rows = rankParticipants(PARTICIPANTS, matches)

    expect(rows.every((row) => row.survivalCount === 0)).toBe(true)
  })

  it('desempata pelo nome em ordem alfabética pt-BR sem diferenciar maiúsculas e acentos', () => {
    const participants = [
      { id: 'p-1', name: 'bruno' },
      { id: 'p-2', name: 'Álvaro' },
      { id: 'p-3', name: 'Carla' },
      { id: 'p-4', name: 'alice' },
    ]

    const rows = rankParticipants(participants, [])

    expect(rows.map((row) => row.name)).toEqual([
      'alice',
      'Álvaro',
      'bruno',
      'Carla',
    ])
  })

  it('ordena por quantidade decrescente antes do desempate alfabético', () => {
    const matches = [
      makeMatchWithParticipants('m-1', [
        { participantId: 'p-2', status: 'ALIVE' },
        { participantId: 'p-4', status: 'ALIVE' },
      ]),
      makeMatchWithParticipants('m-2', [
        { participantId: 'p-2', status: 'ALIVE' },
      ]),
    ]

    const rows = rankParticipants(PARTICIPANTS, matches)

    expect(rows.map((row) => [row.name, row.survivalCount])).toEqual([
      ['Bruno', 2],
      ['Dora', 1],
      ['Ana', 0],
      ['Carla', 0],
    ])
  })

  it('inclui arquivados referenciados por partidas finalizadas e omite arquivados sem partidas', () => {
    const participants = [
      { id: 'p-1', name: 'Ana', deletedAt: null },
      {
        id: 'p-2',
        name: 'Bruno',
        deletedAt: '2026-01-10T00:00:00.000Z',
      },
      {
        id: 'p-3',
        name: 'Carla',
        deletedAt: '2026-01-10T00:00:00.000Z',
      },
    ]
    const matches = [
      makeMatchWithParticipants('m-1', [
        { participantId: 'p-1', status: 'DEAD' },
        { participantId: 'p-2', status: 'ALIVE' },
      ]),
    ]

    const rows = rankParticipants(participants, matches)

    expect(rows).toEqual([
      { participantId: 'p-2', name: 'Bruno', survivalCount: 1 },
      { participantId: 'p-1', name: 'Ana', survivalCount: 0 },
    ])
  })

  it('omite arquivado referenciado apenas por partidas em andamento', () => {
    const participants = [
      { id: 'p-1', name: 'Ana', deletedAt: null },
      {
        id: 'p-2',
        name: 'Bruno',
        deletedAt: '2026-01-10T00:00:00.000Z',
      },
    ]
    const matches = [
      makeMatch({
        id: 'm-running',
        status: 'IN_PROGRESS',
        endedAt: null,
        participants: [
          makeMatchParticipant({
            index: 1,
            id: 'running-mp-1',
            participantId: 'p-2',
            status: 'ALIVE',
          }),
        ],
      }),
    ]

    const rows = rankParticipants(participants, matches)

    expect(rows).toEqual([
      { participantId: 'p-1', name: 'Ana', survivalCount: 0 },
    ])
  })

  it('conta apenas assassinos vivos na vitória dos assassinos', () => {
    const participants = [
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
      { id: 'p-3', name: 'Carla' },
    ]
    const matches = [
      makeMatchWithParticipants(
        'm-assassins',
        [
          { participantId: 'p-1', status: 'ALIVE' },
          { participantId: 'p-2', status: 'DEAD' },
          { participantId: 'p-3', status: 'DEAD' },
        ],
        { winner: 'ASSASSINS' },
      ),
    ]
    matches[0].participants[0].role = 'ASSASSIN'
    matches[0].participants[1].role = 'ASSASSIN'
    matches[0].participants[2].role = 'INNOCENT'

    const rows = rankParticipants(participants, matches)

    expect(rows).toEqual([
      { participantId: 'p-1', name: 'Ana', survivalCount: 1 },
      { participantId: 'p-2', name: 'Bruno', survivalCount: 0 },
      { participantId: 'p-3', name: 'Carla', survivalCount: 0 },
    ])
  })

  it('desempata por participantId quando nome e sobrevivências são iguais', () => {
    const participants = [
      { id: 'p-b', name: 'Ana' },
      { id: 'p-a', name: 'Ana' },
      { id: 'p-c', name: 'Ana' },
    ]

    const rows = rankParticipants(participants, [])

    expect(rows.map((row) => row.participantId)).toEqual([
      'p-a',
      'p-b',
      'p-c',
    ])
  })
})
