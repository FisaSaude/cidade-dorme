import { DeleteParticipantDialog } from '@/features/participant-deletion/ui/DeleteParticipantDialog'
import { ParticipantForm } from '@/features/participant-form/ui/ParticipantForm'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ParticipantsTable } from '@/widgets/participants-table/ParticipantsTable'
import { useParticipantsViewModel } from './useParticipantsViewModel'
import styles from './ParticipantsPage.module.css'

/**
 * Página de cadastro, edição e exclusão de participantes.
 * @param {{
 *   participantRepository: {
 *     list?: Function,
 *     listActive?: Function,
 *     create: Function,
 *     update: Function,
 *     archive?: Function,
 *   },
 *   activeParticipantIds?: string[],
 *   now?: () => string,
 * }} props
 */
export function ParticipantsPage({
  participantRepository,
  activeParticipantIds = [],
  now,
}) {
  const { viewState, actions } = useParticipantsViewModel(participantRepository, {
    activeParticipantIds,
    now,
  })

  return (
    <div className={styles.page}>
      {viewState.notice ? (
        <Alert tone="success" title="Participante salvo">
          {viewState.notice}
        </Alert>
      ) : null}

      {viewState.loadError ? (
        <Alert tone="error" title="Falha ao carregar participantes">
          <p className={styles.alertText}>{viewState.loadError}</p>
          <Button variant="secondary" onClick={actions.retry}>
            Tentar novamente
          </Button>
        </Alert>
      ) : null}

      {viewState.deletion.error ? (
        <Alert tone="error" title="Não foi possível excluir o participante">
          {viewState.deletion.error}
        </Alert>
      ) : null}

      <ParticipantForm
        form={viewState.form}
        error={viewState.formError}
        submitting={viewState.submitting}
        disabled={viewState.loading}
        onSubmit={actions.submit}
        onCancel={actions.cancelEdit}
        onChangeName={actions.changeName}
      />

      <ParticipantsTable
        participants={viewState.participants}
        loading={viewState.loading}
        onEdit={actions.startEdit}
        onDelete={actions.requestDelete}
        deletingId={viewState.deletion.deletingId}
      />

      <DeleteParticipantDialog
        open={viewState.deletion.open}
        participantName={viewState.deletion.participant?.name ?? ''}
        blockedMessage={viewState.deletion.blockedMessage}
        deleting={Boolean(viewState.deletion.deletingId)}
        onCancel={actions.cancelDelete}
        onConfirm={actions.confirmDelete}
      />
    </div>
  )
}

export default ParticipantsPage
