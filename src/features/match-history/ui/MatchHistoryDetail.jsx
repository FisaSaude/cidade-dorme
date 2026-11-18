import { MatchOutcomeBadge } from '@/entities/match'
import { Button } from '@/shared/ui/Button'
import styles from './MatchHistory.module.css'

/**
 * Detalhe de uma partida finalizada.
 * @param {{
 *   detail: object,
 *   deleting?: boolean,
 *   onBack: () => void,
 *   onDelete?: (matchId: string) => void,
 * }} props
 */
export function MatchHistoryDetail({
  detail,
  deleting = false,
  onBack,
  onDelete,
}) {
  const participants = detail.participants ?? []

  return (
    <section
      className={styles.detailSection}
      aria-labelledby="history-detail-title"
    >
      <div className={styles.sectionHeader}>
        <h3 id="history-detail-title" className={styles.sectionTitle}>
          Detalhes da partida
        </h3>
        <div className={styles.detailActions}>
          <Button
            variant="ghost"
            disabled={deleting}
            aria-label="Excluir partida"
            onClick={() => onDelete?.(detail.id)}
          >
            {deleting ? 'Excluindo…' : 'Excluir partida'}
          </Button>
          <Button variant="secondary" onClick={onBack}>
            Voltar para a lista
          </Button>
        </div>
      </div>

      <MatchOutcomeBadge
        winner={detail.winner}
        closureReason={detail.closureReason}
      />

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Início</dt>
          <dd>{detail.startedAtLabel || '—'}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Encerrada em</dt>
          <dd>{detail.endedAtLabel || '—'}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Turnos encerrados</dt>
          <dd>{detail.turnCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Sobreviventes</dt>
          <dd>{detail.survivorCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Eliminados</dt>
          <dd>{detail.eliminatedCount}</dd>
        </div>
      </dl>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <caption className={styles.caption}>Participantes da partida</caption>
          <thead>
            <tr>
              <th scope="col">Participante</th>
              <th scope="col">Papel</th>
              <th scope="col">Status</th>
              <th scope="col">Eliminação</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.name}</td>
                <td>{participant.roleLabel}</td>
                <td>{participant.statusLabel}</td>
                <td>{participant.eliminationLabel || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default MatchHistoryDetail
