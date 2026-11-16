import { playerRoleLabels } from '@/shared/config/labels'
import { Button } from '@/shared/ui/Button'
import { SelectField } from '@/shared/ui/SelectField'
import styles from './DetectivesPhasePanel.module.css'

/**
 * @param {{
 *   rows?: Array<{ detectiveId: string, detectiveName: string, targetOptions: Array<{ value: string, label: string }> }>,
 *   selectedInvestigations?: Record<string, { targetId: string, revealedRole: string } | null>,
 *   onChangeTarget?: (detectiveId: string, targetId: string | null) => void,
 *   onResolve?: () => void,
 * }} props
 */
export function DetectivesPhasePanel({
  rows = [],
  selectedInvestigations = {},
  onChangeTarget,
  onResolve,
}) {
  return (
    <section className={styles.panel} aria-labelledby="detectives-title">
      <h2 id="detectives-title">Investigações dos detetives</h2>
      {rows.map((row) => {
        const investigation = selectedInvestigations[row.detectiveId]
        return (
          <article key={row.detectiveId} className={styles.row}>
            <p className={styles.name}>{row.detectiveName}</p>
            <SelectField
              label={`Investigação de ${row.detectiveName}`}
              value={investigation?.targetId ?? ''}
              onChange={(event) =>
                onChangeTarget?.(row.detectiveId, event.target.value || null)
              }
              options={[
                { value: '', label: 'Sem investigação' },
                ...row.targetOptions,
              ]}
            />
            {investigation ? (
              <p className={styles.reveal}>
                Papel revelado: {playerRoleLabels[investigation.revealedRole] ?? investigation.revealedRole}
              </p>
            ) : null}
          </article>
        )
      })}
      <div className={styles.actions}>
        <Button onClick={onResolve}>Concluir investigações</Button>
      </div>
    </section>
  )
}

export default DetectivesPhasePanel
