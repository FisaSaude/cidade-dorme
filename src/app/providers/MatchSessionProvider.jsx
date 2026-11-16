import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createMatchSession, MatchStatus } from '@/entities/match'
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

  const value = useMemo(
    () => ({ session, hasActiveSession, startMatch }),
    [hasActiveSession, session, startMatch],
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
