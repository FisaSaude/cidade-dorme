import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import {
  getParticipantFormSubmitLabel,
  getParticipantFormTitle,
  isEditingParticipantForm,
} from '../model/participantForm'
import styles from './ParticipantForm.module.css'

/**
 * Formulário de criação/edição de participante. Não decide regras de domínio.
 * @param {{
 *   form: { id: string | null, name: string },
 *   error?: string,
 *   submitting?: boolean,
 *   disabled?: boolean,
 *   onSubmit?: () => void,
 *   onCancel?: () => void,
 *   onChangeName?: (name: string) => void,
 * }} props
 */
export function ParticipantForm({
  form,
  error = '',
  submitting = false,
  disabled = false,
  onSubmit,
  onCancel,
  onChangeName,
}) {
  const editing = isEditingParticipantForm(form)
  const isDisabled = disabled || submitting

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.heading}>
        <h2 className={styles.title}>{getParticipantFormTitle(form)}</h2>
        <p className={styles.description}>
          O nome é obrigatório e não pode repetir outro participante.
        </p>
      </div>
      <TextField
        label="Nome do participante"
        value={form.name}
        onChange={(event) => onChangeName?.(event.target.value)}
        error={error}
        hint={
          editing
            ? 'A edição preserva o vínculo deste participante com partidas anteriores.'
            : undefined
        }
        required
        disabled={isDisabled}
        autoComplete="off"
      />
      <div className={styles.actions}>
        {editing ? (
          <Button variant="ghost" onClick={onCancel} disabled={isDisabled}>
            Cancelar edição
          </Button>
        ) : null}
        <Button type="submit" disabled={isDisabled}>
          {submitting ? 'Salvando…' : getParticipantFormSubmitLabel(form)}
        </Button>
      </div>
    </form>
  )
}

export default ParticipantForm
