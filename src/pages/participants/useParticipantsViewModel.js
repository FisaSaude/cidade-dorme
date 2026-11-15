import { useCallback, useMemo, useState } from 'react'
import { validateParticipantName } from '@/entities/participant/model/participant'
import {
  EMPTY_PARTICIPANT_FORM,
  createParticipantForm,
  isEditingParticipantForm,
  updateParticipantFormName,
} from '@/features/participant-form/model/participantForm'
import {
  DEFAULT_ERROR_MESSAGE,
  getGameRuleErrorMessage,
} from '@/shared/config/labels'
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
 * ViewModel da página de participantes: carrega, cria e edita participantes.
 * @param {{ list: Function, create: Function, update: Function }} repository
 */
export function useParticipantsViewModel(repository) {
  if (!repository) {
    throw new Error('participantRepository is required.')
  }

  const load = useCallback(() => repository.list(), [repository])
  const { data, error, loading, retry } = useAsyncData(load)

  const [form, setForm] = useState(() => createParticipantForm())
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')

  const participants = useMemo(() => sortParticipants(data ?? []), [data])
  const loadError = error ? toUserMessage(error) : ''

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
    },
    actions: {
      changeName,
      startEdit,
      cancelEdit,
      submit,
      retry,
    },
  }
}

export default useParticipantsViewModel
