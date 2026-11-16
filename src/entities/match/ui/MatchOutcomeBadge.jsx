import {
  matchClosureReasonLabels,
  matchWinnerLabels,
} from '@/shared/config/labels'
import styles from './MatchOutcomeBadge.module.css'

/**
 * Destaque do resultado final da partida.
 * @param {{ winner?: string | null, closureReason?: string | null }} props
 */
export function MatchOutcomeBadge({ winner = null, closureReason = null }) {
  const hasWinner = Boolean(winner)
  const title = hasWinner
    ? `Vitória: ${matchWinnerLabels[winner] ?? winner}`
    : 'Partida encerrada sem vencedor'
  const subtitle = closureReason
    ? matchClosureReasonLabels[closureReason] ?? closureReason
    : ''

  return (
    <div
      className={[styles.badge, hasWinner ? styles.victory : styles.manual].join(' ')}
      role="status"
    >
      <span className={styles.eyebrow}>Resultado</span>
      <strong className={styles.title}>{title}</strong>
      {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
    </div>
  )
}

export default MatchOutcomeBadge
