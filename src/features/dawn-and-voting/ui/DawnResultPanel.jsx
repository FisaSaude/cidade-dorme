import { Button } from '@/shared/ui/Button'
import styles from './DawnAndVoting.module.css'

/**
 * @param {{
 *   result?: { eliminatedNames?: string[], hasDeaths?: boolean, message?: string },
 *   onProceed?: () => void,
 * }} props
 */
export function DawnResultPanel({ result = {}, onProceed }) {
  const eliminatedNames = result.eliminatedNames ?? []
  const hasDeaths = result.hasDeaths ?? eliminatedNames.length > 0

  return (
    <section className={styles.panel} aria-labelledby="dawn-result-title">
      <h2 id="dawn-result-title">Resultado da noite</h2>
      {hasDeaths ? (
        <p className={styles.message}>
          Participantes assassinados: {eliminatedNames.join(', ')}
        </p>
      ) : (
        <p className={styles.message}>Ninguém foi assassinado nesta noite</p>
      )}
      <div className={styles.actions}>
        <Button onClick={onProceed}>Ir para a votação</Button>
      </div>
    </section>
  )
}

export default DawnResultPanel
