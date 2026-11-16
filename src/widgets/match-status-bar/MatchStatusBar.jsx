import { PlayerStatus } from '@/entities/match-participant/model/playerStatus'
import { matchPhaseLabels } from '@/shared/config/labels'
import styles from './MatchStatusBar.module.css'

/**
 * @param {{ session: object, nextStepLabel?: string }} props
 */
export function MatchStatusBar({ session, nextStepLabel = '' }) {
  const total = session.match.participants.length
  const alive = session.match.participants.filter(
    (participant) => participant.status === PlayerStatus.ALIVE,
  ).length
  const dead = total - alive

  return (
    <dl className={styles.bar}>
      <div className={styles.item}>
        <dt>Turno</dt>
        <dd>{session.currentTurn}</dd>
      </div>
      <div className={styles.item}>
        <dt>Fase</dt>
        <dd>{matchPhaseLabels[session.phase] ?? session.phase}</dd>
      </div>
      <div className={styles.item}>
        <dt>Vivos</dt>
        <dd>{alive}</dd>
      </div>
      <div className={styles.item}>
        <dt>Mortos</dt>
        <dd>{dead}</dd>
      </div>
      <div className={styles.item}>
        <dt>Próxima etapa</dt>
        <dd>{nextStepLabel || '—'}</dd>
      </div>
    </dl>
  )
}

export default MatchStatusBar
