import { useCallback, useMemo, useState } from 'react'
import { validateParticipantName } from '@/entities/participant'
import {
  EMPTY_PARTICIPANT_FORM,
  createParticipantForm,
  isEditingParticipantForm,
  updateParticipantFormName,
} from '@/features/participant-form/model/participantForm'
import {
  cancelParticipantDeletion,
  createParticipantDeletionState,
  getParticipantDeletionDecision,
  requestParticipantDeletion,
} from '@/features/participant-deletion/model/participantDeletion'
import {
  DEFAULT_ERROR_MESSAGE,
  getGameRuleErrorMessage,
  uiMessages,
} from '@/shared/config/labels'
import { nowIso } from '@/shared/lib/date'
import { useAsyncData } from '@/shared/lib/useAsyncData'
import { ApiError, GameRuleError } from '@/shared/lib/errors'

const participantCollator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/**
 * @param {Array<{ id: string, name: string }>} participants
 * @returns {Array<{ id: string, name: string }>}
 */
function sortParticipants(participants) {
  return [...participants].sort((left, right) =>
    participantCollator.compare(left.name, right.name),
  )
}

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
 * ViewModel da página de participantes: carrega ativos, cria, edita e exclui.
 * @param {{
 *   list?: Function,
 *   listActive?: Function,
 *   create: Function,
 *   update: Function,
 *   archive?: Function,
 * }} repository
 * @param {{ activeParticipantIds?: string[], now?: () => string }} [options]
 */
export function useParticipantsViewModel(repository, options = {}) {
  if (!repository) {
    throw new Error('participantRepository is required.')
  }

  const activeParticipantIds = options.activeParticipantIds ?? []
  const now = options.now ?? nowIso

  const load = useCallback(
    () =>
      typeof repository.listActive === 'function'
        ? repository.listActive()
        : repository.list(),
    [repository],
  )
  const { data, error, loading, retry } = useAsyncData(load)

  const [form, setForm] = useState(() => createParticipantForm())
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [deletionState, setDeletionState] = useState(() =>
    createParticipantDeletionState(),
  )
  const [deletionError, setDeletionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const participants = useMemo(() => sortParticipants(data ?? []), [data])
  const loadError = error ? toUserMessage(error) : ''

  const pendingParticipant = useMemo(
    () =>
      participants.find(
        (participant) => participant.id === deletionState.pendingParticipantId,
      ) ?? null,
    [deletionState.pendingParticipantId, participants],
  )

  const deletionDecision = pendingParticipant
    ? getParticipantDeletionDecision({
        participantId: pendingParticipant.id,
        activeParticipantIds,
      })
    : { allowed: true, code: null, message: '' }

  const changeName = useCallback((name) => {
    setForm((current) => updateParticipantFormName(current, name))
    setFormError('')
    setNotice('')
  }, [])

  const startEdit = useCallback((participant) => {
    setForm(createParticipantForm(participant))
    setFormError('')
    setNotice('')
  }, [])

  const cancelEdit = useCallback(() => {
    setForm({ ...EMPTY_PARTICIPANT_FORM })
    setFormError('')
  }, [])

  const submit = useCallback(async () => {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setFormError('')
    setNotice('')

    try {
      const editing = isEditingParticipantForm(form)
      const name = validateParticipantName(
        form.name,
        participants,
        editing ? form.id : null,
      )

      if (editing) {
        await repository.update(form.id, { name })
        setNotice('Participante atualizado com sucesso.')
      } else {
        await repository.create({ name })
        setNotice('Participante cadastrado com sucesso.')
      }

      setForm({ ...EMPTY_PARTICIPANT_FORM })
      retry()
    } catch (submitError) {
      setFormError(toUserMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }, [form, participants, repository, retry, submitting])

  const requestDelete = useCallback((participant) => {
    setDeletionError('')
    setNotice('')
    setDeletionState((current) =>
      requestParticipantDeletion(current, participant.id),
    )
  }, [])

  const cancelDelete = useCallback(() => {
    setDeletionError('')
    setDeletionState((current) => cancelParticipantDeletion(current))
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!pendingParticipant || deletingId) {
      return
    }

    const decision = getParticipantDeletionDecision({
      participantId: pendingParticipant.id,
      activeParticipantIds,
    })

    if (!decision.allowed) {
      setDeletionError(decision.message)
      return
    }

    if (typeof repository.archive !== 'function') {
      setDeletionError(uiMessages.participantArchiveFailure)
      return
    }

    setDeletingId(pendingParticipant.id)
    setDeletionError('')
    setNotice('')

    try {
      await repository.archive(pendingParticipant.id, now())
      setDeletionState((current) => cancelParticipantDeletion(current))
      setNotice(uiMessages.participantArchiveSuccess)
      retry()
    } catch (deleteError) {
      setDeletionError(toUserMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }, [activeParticipantIds, deletingId, now, pendingParticipant, repository, retry])

  return {
    viewState: {
      participants,
      loading,
      loadError,
      form,
      formError,
      submitting,
      notice,
      isEditing: isEditingParticipantForm(form),
      deletion: {
        open: Boolean(pendingParticipant),
        participant: pendingParticipant,
        blockedMessage: deletionDecision.allowed ? '' : deletionDecision.message,
        error: deletionError,
        deletingId,
      },
    },
    actions: {
      changeName,
      startEdit,
      cancelEdit,
      submit,
      retry,
      requestDelete,
      cancelDelete,
      confirmDelete,
    },
  }
}

export default useParticipantsViewModel
