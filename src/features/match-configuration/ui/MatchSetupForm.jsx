import { Button } from '@/shared/ui/Button'
import { SelectField } from '@/shared/ui/SelectField'
import { MATCH_SETUP_ROLE_OPTIONS } from '../model/matchSetup'
import styles from './MatchSetupForm.module.css'

/**
 * Formulário de seleção de participantes e atribuição manual de papéis.
 * Não decide regras de domínio; apenas exibe o resultado da validação.
 * @param {{
 *   rows?: Array<{ participantId: string, name: string, selected: boolean, role: string }>,
 *   summary?: { selectedCount: number, assassinCount: number, detectiveCount: number, innocentCount: number },
 *   error?: string,
 *   blockingMessage?: string,
 *   submitting?: boolean,
 *   disabled?: boolean,
 *   onToggle?: (participantId: string) => void,
 *   onChangeRole?: (participantId: string, role: string) => void,
 *   onSubmit?: () => void,
 * }} props
 */
export function MatchSetupForm({
  rows = [],
  summary = {
    selectedCount: 0,
    assassinCount: 0,
    detectiveCount: 0,
    innocentCount: 0,
  },
  error = '',
  blockingMessage = '',
  submitting = false,
  disabled = false,
  onToggle,
  onChangeRole,
  onSubmit,
}) {
  const isDisabled = disabled || submitting

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.heading}>
        <h2 className={styles.title}>Seleção e papéis</h2>
        <p className={styles.description}>
          Selecione pelo menos cinco participantes e atribua os papéis manualmente.
          Quem não receber papel especial é inocente.
        </p>
      </div>

      <ul className={styles.list}>
        {rows.map((row) => (
          <li key={row.participantId} className={styles.row}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={row.selected}
                disabled={isDisabled}
                onChange={() => onToggle?.(row.participantId)}
              />
              <span className={styles.name}>{row.name}</span>
            </label>
            <SelectField
              className={styles.role}
              label={`Papel de ${row.name}`}
              value={row.role}
              options={MATCH_SETUP_ROLE_OPTIONS}
              disabled={isDisabled || !row.selected}
              onChange={(event) => onChangeRole?.(row.participantId, event.target.value)}
            />
          </li>
        ))}
      </ul>

      <section className={styles.summary} aria-labelledby="match-setup-summary-title">
        <h3 id="match-setup-summary-title" className={styles.summaryTitle}>
          Resumo da configuração
        </h3>
        <dl className={styles.counts}>
          <div className={styles.count}>
            <dt>Selecionados</dt>
            <dd>{summary.selectedCount}</dd>
          </div>
          <div className={styles.count}>
            <dt>Assassinos</dt>
            <dd>{summary.assassinCount}</dd>
          </div>
          <div className={styles.count}>
            <dt>Detetives</dt>
            <dd>{summary.detectiveCount}</dd>
          </div>
          <div className={styles.count}>
            <dt>Inocentes</dt>
            <dd>{summary.innocentCount}</dd>
          </div>
        </dl>
      </section>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {blockingMessage ? (
        <p className={styles.blocker} role="status">
          {blockingMessage}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" disabled={isDisabled || Boolean(blockingMessage)}>
          {submitting ? 'Iniciando…' : 'Iniciar partida'}
        </Button>
      </div>
    </form>
  )
}

export default MatchSetupForm
