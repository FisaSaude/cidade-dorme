import { ParticipantName } from '@/entities/participant/ui/ParticipantName'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingState } from '@/shared/ui/LoadingState'
import styles from './ParticipantsTable.module.css'

/**
 * Lista de participantes cadastrados com ação de edição.
 * @param {{
 *   participants: Array<{ id: string, name: string }>,
 *   loading?: boolean,
 *   onEdit?: (participant: { id: string, name: string }) => void,
 * }} props
 */
export function ParticipantsTable({ participants, loading = false, onEdit }) {
  if (loading) {
    return <LoadingState label="Carregando participantes…" />
  }

  if (!participants || participants.length === 0) {
    return (
      <EmptyState
        title="Nenhum participante cadastrado"
        description="Cadastre o primeiro participante usando o formulário acima."
      />
    )
  }

  return (
    <section className={styles.section} aria-labelledby="participants-list-title">
      <div className={styles.header}>
        <h2 id="participants-list-title" className={styles.title}>
          Participantes cadastrados
        </h2>
        <span className={styles.count} aria-label={`${participants.length} participantes`}>
          {participants.length}
        </span>
      </div>
      <ul className={styles.list}>
        {participants.map((participant) => (
          <li key={participant.id} className={styles.row}>
            <ParticipantName name={participant.name} className={styles.name} />
            <Button
              variant="secondary"
              aria-label={`Editar ${participant.name}`}
              onClick={() => onEdit?.(participant)}
            >
              Editar
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ParticipantsTable
