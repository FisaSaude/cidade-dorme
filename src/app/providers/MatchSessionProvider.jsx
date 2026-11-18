import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  createMatchSession,
  dismissAnnouncement,
  MatchStatus,
  registerVote,
  resolveAssassinsPhase,
  resolveDetectivesPhase,
  setAssassinTarget,
  finishManually,
  setInvestigation,
  startVoting,
} from '@/entities/match'
import { useAppServices } from './appServices'

export const MatchSessionContext = createContext(null)

const INITIAL_PERSISTENCE = Object.freeze({
  state: 'idle',
  error: null,
  savedMatchId: null,
})

/**
 * Mantém a sessão da partida em memória e expõe os comandos globais.
 * A persistência final ocorre uma única vez ao entrar em FINISHED e pode
 * ser repetida por ação explícita do narrador (PUT idempotente).
 * @param {{ children?: React.ReactNode }} props
 */
export function MatchSessionProvider({ children }) {
  const { idFactory, now, matchRepository } = useAppServices()
  const [session, setSession] = useState(null)
  const [persistence, setPersistence] = useState(INITIAL_PERSISTENCE)
  const attemptedMatchIdRef = useRef(null)
  const inFlightRef = useRef(false)

  const startMatch = useCallback(
    (configuration) => {
      const nextSession = createMatchSession(configuration, {
        matchId: idFactory(),
        startedAt: now(),
        idFactory,
      })

      attemptedMatchIdRef.current = null
      inFlightRef.current = false
      setPersistence(INITIAL_PERSISTENCE)
      setSession(nextSession)
      return nextSession
    },
    [idFactory, now],
  )

  const persistFinishedMatch = useCallback(
    async (match) => {
      if (inFlightRef.current) {
        return
      }

      inFlightRef.current = true
      setPersistence({ state: 'saving', error: null, savedMatchId: null })

      try {
        const saved = await matchRepository.saveFinishedMatch(match)
        setPersistence({
          state: 'saved',
          error: null,
          savedMatchId: saved?.id ?? match.id,
        })
      } catch (error) {
        setPersistence({ state: 'error', error, savedMatchId: null })
      } finally {
        inFlightRef.current = false
      }
    },
    [matchRepository],
  )

  useEffect(() => {
    if (!session || session.match.status !== MatchStatus.FINISHED) {
      return
    }

    const matchId = session.match.id

    if (attemptedMatchIdRef.current === matchId) {
      return
    }

    attemptedMatchIdRef.current = matchId
    persistFinishedMatch(session.match)
  }, [persistFinishedMatch, session])

  const retryPersistMatch = useCallback(() => {
    if (!session || session.match.status !== MatchStatus.FINISHED) {
      return
    }

    return persistFinishedMatch(session.match)
  }, [persistFinishedMatch, session])

  const hasActiveSession = Boolean(
    session && session.match.status === MatchStatus.IN_PROGRESS,
  )

  const activeParticipantIds = hasActiveSession
    ? session.match.participants.map((participant) => participant.participantId)
    : []

  const runSessionCommand = useCallback((command) => {
    let nextSnapshot = null
    setSession((current) => {
      if (!current) {
        return current
      }
      nextSnapshot = command(current)
      return nextSnapshot
    })
    return nextSnapshot
  }, [])

  const dismissCurrentAnnouncement = useCallback(
    () => runSessionCommand((current) => dismissAnnouncement(current)),
    [runSessionCommand],
  )

  const setCurrentAssassinTarget = useCallback(
    (actorId, targetId) =>
      runSessionCommand((current) => setAssassinTarget(current, actorId, targetId)),
    [runSessionCommand],
  )

  const resolveCurrentAssassinsPhase = useCallback(
    () => runSessionCommand((current) => resolveAssassinsPhase(current, now())),
    [now, runSessionCommand],
  )

  const setCurrentInvestigation = useCallback(
    (detectiveId, targetId) =>
      runSessionCommand((current) => setInvestigation(current, detectiveId, targetId)),
    [runSessionCommand],
  )

  const resolveCurrentDetectivesPhase = useCallback(
    () => runSessionCommand((current) => resolveDetectivesPhase(current)),
    [runSessionCommand],
  )

  const startCurrentVoting = useCallback(
    () => runSessionCommand((current) => startVoting(current)),
    [runSessionCommand],
  )

  const registerCurrentVote = useCallback(
    (result) =>
      runSessionCommand((current) => registerVote(current, result, now())),
    [now, runSessionCommand],
  )

  const finishCurrentMatchManually = useCallback(
    () => runSessionCommand((current) => finishManually(current, now())),
    [now, runSessionCommand],
  )

  const value = useMemo(
    () => ({
      session,
      hasActiveSession,
      activeParticipantIds,
      persistence,
      startMatch,
      persistFinishedMatch,
      retryPersistMatch,
      dismissAnnouncement: dismissCurrentAnnouncement,
      setAssassinTarget: setCurrentAssassinTarget,
      resolveAssassinsPhase: resolveCurrentAssassinsPhase,
      setInvestigation: setCurrentInvestigation,
      resolveDetectivesPhase: resolveCurrentDetectivesPhase,
      startVoting: startCurrentVoting,
      registerVote: registerCurrentVote,
      finishManually: finishCurrentMatchManually,
    }),
    [
      activeParticipantIds,
      dismissCurrentAnnouncement,
      finishCurrentMatchManually,
      hasActiveSession,
      persistence,
      persistFinishedMatch,
      registerCurrentVote,
      resolveCurrentAssassinsPhase,
      resolveCurrentDetectivesPhase,
      retryPersistMatch,
      session,
      setCurrentAssassinTarget,
      setCurrentInvestigation,
      startCurrentVoting,
      startMatch,
    ],
  )

  return (
    <MatchSessionContext.Provider value={value}>{children}</MatchSessionContext.Provider>
  )
}

/**
 * Acessa a sessão da partida e seus comandos.
 */
export function useMatchSession() {
  const context = useContext(MatchSessionContext)

  if (!context) {
    throw new Error('useMatchSession must be used within MatchSessionProvider.')
  }

  return context
}

export default MatchSessionProvider
