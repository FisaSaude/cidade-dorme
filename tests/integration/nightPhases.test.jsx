import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import {
  MatchSessionProvider,
  useMatchSession,
} from '@/app/providers/MatchSessionProvider'
import { PlayerRole } from '@/entities/match-participant/model/playerRole'
import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'

function makeIdFactory() {
  let counter = 0
  return () => {
    counter += 1
    return `id-${counter}`
  }
}

const DEFAULT_CONFIGURATION = Object.freeze({
  participants: [
    { participantId: 'p-1', role: PlayerRole.ASSASSIN },
    { participantId: 'p-2', role: PlayerRole.DETECTIVE },
    { participantId: 'p-3', role: PlayerRole.INNOCENT },
    { participantId: 'p-4', role: PlayerRole.INNOCENT },
    { participantId: 'p-5', role: PlayerRole.INNOCENT },
  ],
})

const TWO_ASSASSINS_CONFIGURATION = Object.freeze({
  participants: [
    { participantId: 'p-1', role: PlayerRole.ASSASSIN },
    { participantId: 'p-2', role: PlayerRole.ASSASSIN },
    { participantId: 'p-3', role: PlayerRole.DETECTIVE },
    { participantId: 'p-4', role: PlayerRole.INNOCENT },
    { participantId: 'p-5', role: PlayerRole.INNOCENT },
    { participantId: 'p-6', role: PlayerRole.INNOCENT },
  ],
})

function Harness({ participantRepository, configuration = DEFAULT_CONFIGURATION }) {
  const sessionApi = useMatchSession()

  return (
    <div>
      <button
        type="button"
        onClick={() => sessionApi.startMatch(configuration)}
      >
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

function renderNight(configuration = DEFAULT_CONFIGURATION) {
  const participantRepository = {
    list: async () => [
      { id: 'p-1', name: 'Ana' },
      { id: 'p-2', name: 'Bruno' },
      { id: 'p-3', name: 'Carla' },
      { id: 'p-4', name: 'Davi' },
      { id: 'p-5', name: 'Elisa' },
      { id: 'p-6', name: 'Fábio' },
    ],
  }

  return render(
    <AppProviders
      services={{
        participantRepository,
        idFactory: makeIdFactory(),
        now: () => '2026-01-01T01:00:00.000Z',
      }}
    >
      <MatchSessionProvider>
        <Harness
          participantRepository={participantRepository}
          configuration={configuration}
        />
      </MatchSessionProvider>
    </AppProviders>,
  )
}

describe('Night phases integration', () => {
  it('mostra overlay dialog e avança por ação explícita (clique/teclado)', async () => {
    const user = userEvent.setup()
    renderNight()

    await user.click(screen.getByRole('button', { name: 'iniciar' }))

    const firstOverlay = await screen.findByRole('dialog', { name: 'Cidade Dorme' })
    expect(firstOverlay).toBeTruthy()

    await user.click(firstOverlay)
    expect(await screen.findByRole('dialog', { name: 'Assassinos Acordem' })).toBeTruthy()

    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Ações dos assassinos' })).toBeTruthy()
  })

  it('omite a fase dos detetives quando o único detetive é assassinado na noite', async () => {
    const user = userEvent.setup()
    renderNight()

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
    await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))

    const assassinSelect = await screen.findByLabelText('Alvo de Ana')
    const assassinOptions = within(assassinSelect).getAllByRole('option')
    expect(assassinOptions.map((option) => option.textContent)).toContain('Bruno')
    expect(assassinOptions.map((option) => option.textContent)).not.toContain('Ana')

    const detectiveOption = within(assassinSelect).getByRole('option', {
      name: 'Bruno',
    })
    expect(detectiveOption.textContent).toBe('Bruno')

    await user.selectOptions(assassinSelect, detectiveOption.value)
    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    expect(await screen.findByRole('dialog', { name: 'Cidade Acorda' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Detetives Acordem' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Investigações dos detetives' })).toBeNull()
  })

  it('não oferece executores nem alvos mortos em turnos posteriores', async () => {
    const user = userEvent.setup()
    renderNight(TWO_ASSASSINS_CONFIGURATION)

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
    await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))

    const anaSelect = await screen.findByLabelText('Alvo de Ana')
    expect(screen.getByLabelText('Alvo de Bruno')).toBeTruthy()

    const detectiveOption = within(anaSelect).getByRole('option', {
      name: 'Carla',
    })
    await user.selectOptions(anaSelect, detectiveOption.value)
    await user.selectOptions(screen.getByLabelText('Alvo de Bruno'), '')
    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    expect(await screen.findByRole('dialog', { name: 'Cidade Acorda' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Detetives Acordem' })).toBeNull()

    await user.click(screen.getByRole('dialog', { name: 'Cidade Acorda' }))
    await user.click(await screen.findByRole('button', { name: 'Ir para a votação' }))

    const voteSelect = await screen.findByLabelText('Resultado da votação')
    const voteOptions = within(voteSelect).getAllByRole('option')
    expect(voteOptions.map((option) => option.textContent)).not.toContain('Carla')

    const brunoOption = within(voteSelect).getByRole('option', { name: 'Bruno' })
    await user.selectOptions(voteSelect, brunoOption.value)
    await user.click(screen.getByRole('button', { name: 'Registrar votação' }))

    await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
    await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))

    expect(screen.queryByLabelText('Alvo de Bruno')).toBeNull()
    expect(screen.queryByLabelText('Alvo de Carla')).toBeNull()

    const remainingSelect = screen.getByLabelText('Alvo de Ana')
    const remainingOptions = within(remainingSelect)
      .getAllByRole('option')
      .map((option) => option.textContent)

    expect(remainingOptions).not.toContain('Ana')
    expect(remainingOptions).not.toContain('Bruno')
    expect(remainingOptions).not.toContain('Carla')
    expect(remainingOptions).toContain('Davi')
    expect(remainingOptions).toContain('Elisa')
    expect(remainingOptions).toContain('Fábio')
    expect(screen.getAllByLabelText(/^Alvo de /)).toHaveLength(1)
  })

  it('mostra investigação com revelação de papel para o narrador', async () => {
    const user = userEvent.setup()
    renderNight()

    await user.click(screen.getByRole('button', { name: 'iniciar' }))
    await user.click(await screen.findByRole('dialog', { name: 'Cidade Dorme' }))
    await user.click(await screen.findByRole('dialog', { name: 'Assassinos Acordem' }))

    await user.selectOptions(await screen.findByLabelText('Alvo de Ana'), '')
    await user.click(screen.getByRole('button', { name: 'Processar noite' }))

    const detectivesOverlay = await screen.findByRole('dialog', {
      name: 'Detetives Acordem',
    })
    await user.click(detectivesOverlay)

    await user.selectOptions(
      await screen.findByLabelText('Investigação de Bruno'),
      'id-2',
    )

    expect(await screen.findByText('Papel revelado: Assassino')).toBeTruthy()
  })
})
