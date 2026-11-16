import { Button } from '@/shared/ui/Button'
import { SelectField } from '@/shared/ui/SelectField'
import styles from './AssassinsPhasePanel.module.css'

/**
 * @param {{
 *   rows?: Array<{ assassinId: string, assassinName: string, targetOptions: Array<{ value: string, label: string }> }>,
 *   selectedTargets?: Record<string, string | null>,
 *   onChangeTarget?: (assassinId: string, targetId: string | null) => void,
 *   onResolve?: () => void,
 * }} props
 */
export function AssassinsPhasePanel({
  rows = [],
  selectedTargets = {},
  onChangeTarget,
  onResolve,
}) {
  return (
    <section className={styles.panel} aria-labelledby="assassins-title">
      <h2 id="assassins-title">Ações dos assassinos</h2>
      {rows.map((row) => (
        <article key={row.assassinId} className={styles.row}>
          <p className={styles.name}>{row.assassinName}</p>
          <SelectField
            label={`Alvo de ${row.assassinName}`}
            value={selectedTargets[row.assassinId] ?? ''}
            onChange={(event) =>
              onChangeTarget?.(row.assassinId, event.target.value || null)
            }
            options={[
              { value: '', label: 'Sem alvo' },
              ...row.targetOptions,
            ]}
          />
        </article>
      ))}
      <div className={styles.actions}>
        <Button onClick={onResolve}>Processar noite</Button>
      </div>
    </section>
  )
}

export default AssassinsPhasePanel
