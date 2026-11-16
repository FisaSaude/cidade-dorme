import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { createMatchRepository } from '@/entities/match/api/matchRepository'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { createParticipantRepository } from '@/entities/participant/api/participantRepository'
import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'
import { ParticipantsPage } from '@/pages/participants/ParticipantsPage'

const STARTED_AT = '2026-01-01T01:00:00.000Z'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Davi' },
  { id: 'p-5', name: 'Elisa' },
]

const CONFIGURATION = {
  participants: [
    { participantId: 'p-1', role: PlayerRole.ASSASSIN },
    { participantId: 'p-2', role: PlayerRole.ASSASSIN },
    { participantId: 'p-3', role: PlayerRole.INNOCENT },
    { participantId: 'p-4', role: PlayerRole.INNOCENT },
    { participantId: 'p-5', role: PlayerRole.INNOCENT },
  ],
}

/**
 * Cliente HTTP falso que persiste apenas participantes e partidas finalizadas.
 * @param {Array<{ id: string, name: string }>} [initialParticipants]
 */
function createFakeClient(initialParticipants = []) {
  let participants = initialParticipants.map((participant) => ({
    ...participant,
  }))
  const matches = new Map()
  const calls = []

  const client = {
    get: vi.fn(async (path) => {
      calls.push({ method: 'GET', path })

      if (path === '/participants') {
        return participants.map((participant) => ({ ...participant }))
      }

      throw new Error(`Unexpected GET ${path}`)
    }),
    post: vi.fn(async (path, body) => {
      calls.push({ method: 'POST', path, body })

      if (path === '/participants') {
        const created = { id: body.id, name: body.name }
        participants = [...participants, created]
        return { ...created }
      }

      throw new Error(`Unexpected POST ${path}`)
    }),
    patch: vi.fn(async (path, body) => {
      calls.push({ method: 'PATCH', path, body })
      const id = path.replace('/participants/', '')
      participants = participants.map((participant) =>
        participant.id === id
          ? { ...participant, name: body.name }
          : participant,
      )
      return { ...participants.find((participant) => participant.id === id) }
    }),
    put: vi.fn(async (path, body) => {
      calls.push({ method: 'PUT', path, body })
      matches.set(body.id, body)
      return body
    }),
  }

  return {
    client,
    calls,
    writeCalls: () =>
      calls.filter((call) => call.method !== 'GET'),
    matches,
  }
}

function makeIdFactory() {
  let counter = 0

  return () => {
    counter += 1
    return `generated-${counter}`
  }
}

function Harness({ participantRepository }) {
  const sessionApi = useMatchSession()

  return (
    <div>
      <button type="button" onClick={() => sessionApi.startMatch(CONFIGURATION)}>
        iniciar
      </button>
      <LiveMatchPage
        session={sessionApi.session}
        participantRepository={participantRepository}
        actions={sessionApi}
      />
    </div>
  )
}

function renderMatch(fake) {
  const idFactory = makeIdFactory()
  const participantRepository = createParticipantRepository({
    client: fake.client,
    idFactory,
  })
  const matchRepository = createMatchRepository({ client: fake.client })
  const view = render(
    <AppProviders
      services={{
        participantRepository,
        matchRepository,
        idFactory,
        now: () => STARTED_AT,
      }}
    >
      <MatchSessionProvider>
        <Harness participantRepository={participantRepository} />
      </MatchSessionProvider>
    </AppProviders>,
  )

  return { ...view, participantRepository }
}

async function startMatch(user) {
  await user.click(screen.getByRole('button', { name: 'iniciar' }))
  await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
  await user.click(
    await screen.findByRole('dialog', { name: 'Assassinos Acordem' }),
  )
}

describe('Consistência da persistência (integração)', () => {
  it('envia um único PUT final com os MatchParticipant embutidos', async () => {
    const user = userEvent.setup()
    const fake = createFakeClient(PARTICIPANTS)
    renderMatch(fake)

    await startMatch(user)

    const anaSelect = await screen.findByLabelText('Alvo de Ana')
    await user.selectOptions(
      anaSelect,
      within(anaSelect).getByRole('option', { name: 'Carla' }),
    )
    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    expect(await screen.findByText('Partida salva no histórico.')).toBeTruthy()

    await waitFor(() => expect(fake.client.put).toHaveBeenCalledTimes(1))

    const writes = fake.writeCalls()
    expect(writes).toHaveLength(1)
    expect(writes[0].method).toBe('PUT')
    expect(writes[0].path).toBe('/matches/generated-1')
    expect(writes[0].body.status).toBe('FINISHED')
    expect(writes[0].body.participants).toHaveLength(5)

    expect(fake.client.post).not.toHaveBeenCalled()
    expect(fake.client.patch).not.toHaveBeenCalled()
  })

  it('não grava nada enquanto a partida está em andamento e não deixa registro órfão ao abandonar', async () => {
    const user = userEvent.setup()
    const fake = createFakeClient(PARTICIPANTS)
    const { unmount } = renderMatch(fake)

    await startMatch(user)

    const anaSelect = await screen.findByLabelText('Alvo de Ana')
    await user.selectOptions(
      anaSelect,
      within(anaSelect).getByRole('option', { name: 'Carla' }),
    )

    expect(fake.writeCalls()).toEqual([])

    unmount()

    fake.matches.clear()
    renderMatch(fake)

    await waitFor(() =>
      expect(fake.client.get).toHaveBeenCalledWith('/participants'),
    )
    expect(fake.writeCalls()).toEqual([])
    expect(fake.matches.size).toBe(0)
  })

  it('persiste apenas CRUD de participantes, sem recursos de turnos, ações ou votos', async () => {
    const user = userEvent.setup()
    const fake = createFakeClient()
    const participantRepository = createParticipantRepository({
      client: fake.client,
      idFactory: makeIdFactory(),
    })

    render(<ParticipantsPage participantRepository={participantRepository} />)

    await screen.findByText('Nenhum participante cadastrado')

    await user.type(screen.getByLabelText(/Nome do participante/), 'Ana')
    await user.click(
      screen.getByRole('button', { name: 'Adicionar participante' }),
    )

    expect(await screen.findByText('Ana')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Editar Ana' }))
    const nameField = screen.getByLabelText(/Nome do participante/)
    await user.clear(nameField)
    await user.type(nameField, 'Ana Maria')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Ana Maria')).toBeTruthy()

    const writes = fake.writeCalls()
    expect(writes.map((call) => call.method)).toEqual(['POST', 'PATCH'])
    expect(writes[0].path).toBe('/participants')
    expect(writes[1].path).toBe('/participants/generated-1')

    for (const call of writes) {
      expect(call.path).not.toMatch(/turns|actions|votes|investigations/)
    }
  })
})
