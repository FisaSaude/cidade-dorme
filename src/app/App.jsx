import { LiveMatchPage } from '@/pages/live-match/LiveMatchPage'
import { MatchSetupPage } from '@/pages/match-setup/MatchSetupPage'
import { ParticipantsPage } from '@/pages/participants/ParticipantsPage'
import {
  ACTIVE_SESSION_NAV_ITEMS,
  NAV_ITEMS,
  SCREEN_LABELS,
  SCREENS,
} from './navigation/screens'
import { useAppNavigation } from './navigation/useAppNavigation'
import { useAppServices } from './providers/appServices'
import {
  MatchSessionProvider,
  useMatchSession,
} from './providers/MatchSessionProvider'
import styles from './App.module.css'

const SCREEN_CONTENT = {
  [SCREENS.PARTICIPANTS]: {
    title: 'Participantes',
    description: 'Cadastre e gerencie as pessoas que participarão das partidas.',
  },
  [SCREENS.MATCH_SETUP]: {
    title: 'Nova partida',
    description:
      'Selecione os participantes e atribua manualmente os papéis antes de iniciar.',
  },
  [SCREENS.LIVE_MATCH]: {
    title: 'Partida',
    description: 'Nenhuma partida em andamento.',
  },
  [SCREENS.HISTORY]: {
    title: 'Histórico',
    description: 'Consulte as partidas já encerradas.',
  },
  [SCREENS.RANKING]: {
    title: 'Ranking',
    description: 'Veja os participantes com mais sobrevivências.',
  },
}

function AppShell() {
  const {
    session,
    hasActiveSession,
    startMatch,
    dismissAnnouncement,
    setAssassinTarget,
    resolveAssassinsPhase,
    setInvestigation,
    resolveDetectivesPhase,
    startVoting,
    registerVote,
  } = useMatchSession()
  const { activeScreen, navigate } = useAppNavigation({ hasActiveSession })
  const { participantRepository } = useAppServices()
  const content = SCREEN_CONTENT[activeScreen] ?? SCREEN_CONTENT[SCREENS.PARTICIPANTS]
  const navItems = hasActiveSession ? ACTIVE_SESSION_NAV_ITEMS : NAV_ITEMS
  const description =
    activeScreen === SCREENS.LIVE_MATCH && session
      ? `Turno ${session.currentTurn} em andamento.`
      : content.description

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            CD
          </span>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Cidade Dorme</span>
            <span className={styles.brandSubtitle}>Apoio ao Narrador</span>
          </div>
        </div>
        <nav className={styles.nav} aria-label="Navegação principal">
          {navItems.map((screen) => {
            const isActive = activeScreen === screen
            return (
              <button
                key={screen}
                type="button"
                className={isActive ? styles.navActive : styles.navButton}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => navigate(screen)}
              >
                {SCREEN_LABELS[screen]}
              </button>
            )
          })}
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.screen} aria-labelledby="screen-title">
          <h1 id="screen-title">{content.title}</h1>
          <p className={styles.screenSubtitle}>{description}</p>
          {activeScreen === SCREENS.PARTICIPANTS ? (
            <ParticipantsPage participantRepository={participantRepository} />
          ) : null}
          {activeScreen === SCREENS.MATCH_SETUP ? (
            <MatchSetupPage
              participantRepository={participantRepository}
              startMatch={startMatch}
              onStarted={() => navigate(SCREENS.LIVE_MATCH)}
            />
          ) : null}
          {activeScreen === SCREENS.LIVE_MATCH ? (
            <LiveMatchPage
              session={session}
              participantRepository={participantRepository}
              actions={{
                dismissAnnouncement,
                setAssassinTarget,
                resolveAssassinsPhase,
                setInvestigation,
                resolveDetectivesPhase,
                startVoting,
                registerVote,
              }}
            />
          ) : null}
        </section>
      </main>
      <footer className={styles.footer}>
        Cidade Dorme — aplicação local de apoio ao narrador.
      </footer>
    </div>
  )
}

function App() {
  return (
    <MatchSessionProvider>
      <AppShell />
    </MatchSessionProvider>
  )
}

export default App
