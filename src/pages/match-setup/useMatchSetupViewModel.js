import { useCallback, useMemo, useState } from 'react'
import { validateMatchConfiguration } from '@/entities/match/model/matchConfiguration'
import {
  createMatchSetupState,
  getMatchSetupRows,
  getMatchSetupSummary,
  setParticipantRole as updateParticipantRole,
  toggleParticipantSelection,
  toMatchConfiguration,
} from '@/features/match-configuration/model/matchSetup'
import {
  DEFAULT_ERROR_MESSAGE,
  getGameRuleErrorMessage,
} from '@/shared/config/labels'
import { ApiError, GameRuleError } from '@/shared/lib/errors'
import { useAsyncData } from '@/shared/lib/useAsyncData'

const participantCollator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/**
 * @param {unknown} error
 * @returns {string}
 */
function toUserMessage(error) {
  if (error instanceof GameRuleError) {
    return getGameRuleErrorMessage(error.code)
  }

  if (error instanceof ApiError) {
    return error.message || DEFAULT_ERROR_MESSAGE
  }

  return DEFAULT_ERROR_MESSAGE
}

/**
 * ViewModel da configuração manual de uma nova partida.
 * @param {{
 *   participantRepository: { list: Function },
 *   startMatch: (configuration: object) => unknown,
 *   onStarted?: () => void,
 * }} options
 */
export function useMatchSetupViewModel({
  participantRepository,
  startMatch,
  onStarted,
} = {}) {
  if (!participantRepository) {
    throw new Error('participantRepository is required.')
  }

  if (typeof startMatch !== 'function') {
    throw new Error('startMatch is required.')
  }

  const load = useCallback(() => participantRepository.list(), [participantRepository])
  const { data, error, loading, retry } = useAsyncData(load)

  const [setupState, setSetupState] = useState(() => createMatchSetupState())
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const participants = useMemo(
    () =>
      [...(data ?? [])].sort((left, right) =>
        participantCollator.compare(left.name, right.name),
      ),
    [data],
  )

  const rows = useMemo(
    () => getMatchSetupRows(participants, setupState),
    [participants, setupState],
  )
  const summary = useMemo(() => getMatchSetupSummary(rows), [rows])
  const loadError = error ? toUserMessage(error) : ''

  const blockingMessage = useMemo(() => {
    try {
      validateMatchConfiguration(toMatchConfiguration(rows))
      return ''
    } catch (validationError) {
      return toUserMessage(validationError)
    }
  }, [rows])

  const toggleParticipant = useCallback((participantId) => {
    setSetupState((current) => toggleParticipantSelection(current, participantId))
    setErrorMessage('')
  }, [])

  const changeRole = useCallback((participantId, role) => {
    setSetupState((current) => updateParticipantRole(current, participantId, role))
    setErrorMessage('')
  }, [])

  const submit = useCallback(() => {
    if (submitting) {
      return false
    }

    setSubmitting(true)
    setErrorMessage('')

    try {
      const configuration = validateMatchConfiguration(toMatchConfiguration(rows))
      startMatch(configuration)
      onStarted?.()
      return true
    } catch (submitError) {
      setErrorMessage(toUserMessage(submitError))
      return false
    } finally {
      setSubmitting(false)
    }
  }, [onStarted, rows, startMatch, submitting])

  return {
    viewState: {
      participants,
      rows,
      summary,
      loading,
      loadError,
      blockingMessage,
      error: errorMessage,
      submitting,
    },
    actions: {
      toggleParticipant,
      setParticipantRole: changeRole,
      submit,
      retry,
    },
  }
}

export default useMatchSetupViewModel
