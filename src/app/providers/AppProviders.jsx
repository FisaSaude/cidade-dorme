import { useMemo } from 'react'
import { AppServicesContext, DEFAULT_APP_SERVICES } from './appServices'

/**
 * Injeta os serviços compartilhados da aplicação via Context.
 * @param {{ children?: React.ReactNode, services?: Record<string, unknown> }} props
 */
export function AppProviders({ children, services }) {
  const value = useMemo(
    () => ({ ...DEFAULT_APP_SERVICES, ...(services ?? {}) }),
    [services],
  )

  return (
    <AppServicesContext.Provider value={value}>
      {children}
    </AppServicesContext.Provider>
  )
}

export default AppProviders
