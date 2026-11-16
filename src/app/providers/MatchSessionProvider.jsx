import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  createMatchSession,
  dismissAnnouncement,
  MatchStatus,
  resolveAssassinsPhase,
  resolveDetectivesPhase,
  setAssassinTarget,
  setInvestigation,
} from '@/entities/match'
import { useAppServices } from './appServices'

export const MatchSessionContext = createContext(null)

/**
 * Mantém a sessão da partida em memória e expõe os comandos globais.
 * @param {{ children?: React.ReactNode }} props
 */
export function MatchSessionProvider({ children }) {
  const { idFactory, now } = useAppServices()
  const [session, setSession] = useState(null)

  const startMatch = useCallback(
    (configuration) => {
      const nextSession = createMatchSession(configuration, {
        matchId: idFactory(),
        startedAt: now(),
        idFactory,
      })

      setSession(nextSession)
      return nextSession
    },
    [idFactory, now],
  )

  const hasActiveSession = Boolean(
    session && session.match.status === MatchStatus.IN_PROGRESS,
  )

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

  const value = useMemo(
    () => ({
      session,
      hasActiveSession,
      startMatch,
      dismissAnnouncement: dismissCurrentAnnouncement,
      setAssassinTarget: setCurrentAssassinTarget,
      resolveAssassinsPhase: resolveCurrentAssassinsPhase,
      setInvestigation: setCurrentInvestigation,
      resolveDetectivesPhase: resolveCurrentDetectivesPhase,
    }),
    [
      dismissCurrentAnnouncement,
      hasActiveSession,
      resolveCurrentAssassinsPhase,
      resolveCurrentDetectivesPhase,
      session,
      setCurrentAssassinTarget,
      setCurrentInvestigation,
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
