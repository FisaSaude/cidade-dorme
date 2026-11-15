import { createContext, useContext } from 'react'
import { participantRepository } from '@/entities/participant'
import { nowIso } from '@/shared/lib/date'
import { createId } from '@/shared/lib/id'

/**
 * Serviços padrão da aplicação. Repositórios são adicionados pelas histórias
 * que os utilizam; sobrescritas permitem testes determinísticos.
 */
export const DEFAULT_APP_SERVICES = Object.freeze({
  idFactory: createId,
  now: nowIso,
  participantRepository,
})

export const AppServicesContext = createContext(null)

/**
 * Acessa os serviços injetados pela aplicação.
 */
export function useAppServices() {
  const services = useContext(AppServicesContext)

  if (!services) {
    throw new Error('useAppServices must be used within AppProviders.')
  }

  return services
}
