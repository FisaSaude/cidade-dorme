import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'
import { ApiError } from '@/shared/lib/errors'

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

function renderMatch(matchRepository = {}) {
  const participantRepository = {
    list: vi.fn(async () =>
      PARTICIPANTS.map((participant) => ({ ...participant })),
    ),
  }

  render(
    <AppProviders
      services={{
        participantRepository,
        matchRepository,
        idFactory: makeIdFactory(),
        now: () => STARTED_AT,
      }}
    >
      <MatchSessionProvider>
        <Harness participantRepository={participantRepository} />
      </MatchSessionProvider>
    </AppProviders>,
  )

  return { participantRepository }
}

async function startMatch(user) {
  await user.click(screen.getByRole('button', { name: 'iniciar' }))
  await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
  await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))
}

async function selectNightTarget(user) {
  const anaSelect = await screen.findByLabelText('Alvo de Ana')
  await user.selectOptions(
    anaSelect,
    within(anaSelect).getByRole('option', { name: 'Carla' }),
  )
}

async function achieveNightVictory(user) {
  await selectNightTarget(user)
  await user.click(screen.getByRole('button', { name: 'Processar noite' }))
}

describe('Resultado e persistência da partida (integração)', () => {
  it('mostra o vencedor na mesma interação e grava a partida uma única vez', async () => {
    const user = userEvent.setup()
    const saveFinishedMatch = vi.fn(async (match) => match)
    renderMatch({ saveFinishedMatch })

    await startMatch(user)
    await achieveNightVictory(user)

    expect(await screen.findByText('Vitória: Assassinos')).toBeTruthy()
    expect(screen.getByText('Resumo da partida')).toBeTruthy()
    expect(screen.getByText('Carla')).toBeTruthy()
    expect(screen.getByText('Eliminação em massa')).toBeTruthy()
    expect(
      screen.getByText(/Todos os não assassinos foram eliminados/),
    ).toBeTruthy()

    expect(await screen.findByText('Partida salva no histórico.')).toBeTruthy()
    expect(saveFinishedMatch).toHaveBeenCalledTimes(1)

    const savedMatch = saveFinishedMatch.mock.calls[0][0]
    expect(savedMatch.status).toBe('FINISHED')
    expect(savedMatch.winner).toBe('ASSASSINS')
    expect(savedMatch.endedAt).toBe(STARTED_AT)
    expect(savedMatch.participants).toHaveLength(5)

    const byParticipant = Object.fromEntries(
      savedMatch.participants.map((participant) => [
        participant.participantId,
        participant,
      ]),
    )

    expect(byParticipant['p-1'].status).toBe('ALIVE')
    expect(byParticipant['p-2'].status).toBe('ALIVE')
    expect(byParticipant['p-3'].status).toBe('DEAD')
    expect(byParticipant['p-4']).toMatchObject({
      status: 'DEAD',
      eliminatedAt: { turn: 1, phase: 'NIGHT' },
    })
    expect(byParticipant['p-5']).toMatchObject({
      status: 'DEAD',
      eliminatedAt: { turn: 1, phase: 'NIGHT' },
    })
  })

  it('não grava nada antes do encerramento', async () => {
    const user = userEvent.setup()
    const saveFinishedMatch = vi.fn(async (match) => match)
    renderMatch({ saveFinishedMatch })

    await startMatch(user)

    expect(saveFinishedMatch).not.toHaveBeenCalled()

    await selectNightTarget(user)

    expect(saveFinishedMatch).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    expect(await screen.findByText('Vitória: Assassinos')).toBeTruthy()
    await waitFor(() => expect(saveFinishedMatch).toHaveBeenCalledTimes(1))
  })

  it('mantém o resultado visível e oferece nova tentativa quando a gravação falha', async () => {
    const user = userEvent.setup()
    const saveFinishedMatch = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError('Não foi possível conectar ao servidor.', null),
      )
      .mockImplementation(async (match) => match)
    renderMatch({ saveFinishedMatch })

    await startMatch(user)
    await achieveNightVictory(user)

    expect(await screen.findByText('Vitória: Assassinos')).toBeTruthy()
    expect(
      await screen.findByText('Não foi possível salvar a partida.'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Partida salva no histórico.')).toBeTruthy()
    expect(saveFinishedMatch).toHaveBeenCalledTimes(2)
    expect(saveFinishedMatch.mock.calls[1][0]).toEqual(
      saveFinishedMatch.mock.calls[0][0],
    )
    expect(screen.getByText('Vitória: Assassinos')).toBeTruthy()
  })
})
