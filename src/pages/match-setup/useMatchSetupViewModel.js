import { useCallback, useEffect, useMemo, useState } from 'react'
import { validateMatchConfiguration } from '@/entities/match'
import {
  createMatchSetupDraft,
  deselectAll,
  getMatchSetupCounts,
  getMatchSetupRows,
  getMatchSetupSummary,
  selectAll,
  setParticipantRole as updateParticipantRole,
  toggleSelection,
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
 *   participantRepository: { list?: Function, listActive?: Function },
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

  const load = useCallback(
    () =>
      typeof participantRepository.listActive === 'function'
        ? participantRepository.listActive()
        : participantRepository.list(),
    [participantRepository],
  )
  const { data, error, loading, retry } = useAsyncData(load)

  const [draft, setDraft] = useState(() => createMatchSetupDraft())
  const [initialized, setInitialized] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const participants = useMemo(
    () =>
      [...(data ?? [])].sort((left, right) =>
        participantCollator.compare(left.name, right.name),
      ),
    [data],
  )

  useEffect(() => {
    if (loading || initialized) {
      return
    }

    setDraft(createMatchSetupDraft(participants))
    setInitialized(true)
  }, [initialized, loading, participants])

  const rows = useMemo(
    () => getMatchSetupRows(participants, draft),
    [draft, participants],
  )
  const summary = useMemo(() => getMatchSetupSummary(rows), [rows])
  const counts = useMemo(() => getMatchSetupCounts(rows), [rows])
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
    setDraft((current) => toggleSelection(current, participantId))
    setErrorMessage('')
  }, [])

  const selectAllParticipants = useCallback(() => {
    setDraft((current) => selectAll(current, participants))
    setErrorMessage('')
  }, [participants])

  const deselectAllParticipants = useCallback(() => {
    setDraft((current) => deselectAll(current))
    setErrorMessage('')
  }, [])

  const changeRole = useCallback((participantId, role) => {
    setDraft((current) => updateParticipantRole(current, participantId, role))
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
      counts,
      loading,
      loadError,
      blockingMessage,
      error: errorMessage,
      submitting,
    },
    actions: {
      toggleParticipant,
      selectAll: selectAllParticipants,
      deselectAll: deselectAllParticipants,
      setParticipantRole: changeRole,
      submit,
      retry,
    },
  }
}

export default useMatchSetupViewModel
