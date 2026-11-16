import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { MatchSetupPage } from '@/pages/match-setup/MatchSetupPage'

const PARTICIPANTS = [
  { id: 'p-1', name: 'Ana' },
  { id: 'p-2', name: 'Bruno' },
  { id: 'p-3', name: 'Carla' },
  { id: 'p-4', name: 'Davi' },
  { id: 'p-5', name: 'Elisa' },
]

function createParticipantRepository(participants = PARTICIPANTS) {
  return {
    list: vi.fn(async () => participants.map((participant) => ({ ...participant }))),
  }
}

function makeIdFactory() {
  let counter = 0

  return () => {
    counter += 1
    return `generated-${counter}`
  }
}

function SessionProbe() {
  const { session } = useMatchSession()

  if (!session) {
    return <p>Sem sessão iniciada</p>
  }

  return (
    <div>
      <p>Turno {session.currentTurn}</p>
      <ul>
        {session.match.participants.map((participant) => (
          <li key={participant.id} data-testid={`role-${participant.participantId}`}>
            {participant.role}|{participant.status}|
            {participant.eliminatedAt === null ? 'sem-eliminacao' : 'eliminado'}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SetupHarness({ participantRepository, onStarted }) {
  const { startMatch } = useMatchSession()

  return (
    <>
      <MatchSetupPage
        participantRepository={participantRepository}
        startMatch={startMatch}
        onStarted={onStarted}
      />
      <SessionProbe />
    </>
  )
}

function renderSetup({ participantRepository, onStarted = vi.fn() }) {
  return render(
    <AppProviders
      services={{
        participantRepository,
        idFactory: makeIdFactory(),
        now: () => '2026-05-01T10:00:00.000Z',
      }}
    >
      <MatchSessionProvider>
        <SetupHarness
          participantRepository={participantRepository}
          onStarted={onStarted}
        />
      </MatchSessionProvider>
    </AppProviders>,
  )
}

async function selectParticipants(user, names) {
  for (const name of names) {
    await user.click(await screen.findByRole('checkbox', { name }))
  }
}

describe('Configuração da partida (integração)', () => {
  it('bloqueia o início com menos de cinco participantes', async () => {
    const user = userEvent.setup()
    renderSetup({ participantRepository: createParticipantRepository() })

    await selectParticipants(user, ['Ana', 'Bruno', 'Carla', 'Davi'])

    expect(
      screen.getByText('Selecione pelo menos cinco participantes.'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Iniciar partida' }).disabled).toBe(true)
    expect(screen.getByText('Sem sessão iniciada')).toBeTruthy()
  })

  it('bloqueia o início sem assassino', async () => {
    const user = userEvent.setup()
    renderSetup({ participantRepository: createParticipantRepository() })

    await selectParticipants(user, ['Ana', 'Bruno', 'Carla', 'Davi', 'Elisa'])

    expect(screen.getByText('Inclua pelo menos um assassino.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Iniciar partida' }).disabled).toBe(true)
    expect(screen.getByText('Sem sessão iniciada')).toBeTruthy()
  })

  it('permite iniciar sem detetive, com inocentes padrão e todos vivos, sem sorteio', async () => {
    const user = userEvent.setup()
    const onStarted = vi.fn()
    renderSetup({
      participantRepository: createParticipantRepository(),
      onStarted,
    })

    await selectParticipants(user, ['Ana', 'Bruno', 'Carla', 'Davi', 'Elisa'])
    await user.selectOptions(screen.getByLabelText('Papel de Ana'), 'ASSASSIN')

    expect(screen.queryByText('Inclua pelo menos um assassino.')).toBeNull()

    const startButton = screen.getByRole('button', { name: 'Iniciar partida' })
    expect(startButton.disabled).toBe(false)

    await user.click(startButton)

    expect(onStarted).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Turno 1')).toBeTruthy()
    expect(screen.getByTestId('role-p-1').textContent).toBe(
      'ASSASSIN|ALIVE|sem-eliminacao',
    )
    expect(screen.getByTestId('role-p-2').textContent).toBe(
      'INNOCENT|ALIVE|sem-eliminacao',
    )
    expect(screen.getByTestId('role-p-3').textContent).toBe(
      'INNOCENT|ALIVE|sem-eliminacao',
    )
    expect(screen.getByTestId('role-p-4').textContent).toBe(
      'INNOCENT|ALIVE|sem-eliminacao',
    )
    expect(screen.getByTestId('role-p-5').textContent).toBe(
      'INNOCENT|ALIVE|sem-eliminacao',
    )
  })

  it('atribui exatamente um papel por participante selecionado', async () => {
    const user = userEvent.setup()
    renderSetup({ participantRepository: createParticipantRepository() })

    await selectParticipants(user, ['Ana', 'Bruno', 'Carla', 'Davi', 'Elisa'])
    await user.selectOptions(screen.getByLabelText('Papel de Ana'), 'ASSASSIN')
    await user.selectOptions(screen.getByLabelText('Papel de Bruno'), 'DETECTIVE')

    await user.click(screen.getByRole('button', { name: 'Iniciar partida' }))

    expect(screen.getByTestId('role-p-1').textContent).toContain('ASSASSIN|')
    expect(screen.getByTestId('role-p-2').textContent).toContain('DETECTIVE|')
    expect(screen.getByTestId('role-p-3').textContent).toContain('INNOCENT|')
    expect(screen.getByTestId('role-p-4').textContent).toContain('INNOCENT|')
    expect(screen.getByTestId('role-p-5').textContent).toContain('INNOCENT|')
  })
})
