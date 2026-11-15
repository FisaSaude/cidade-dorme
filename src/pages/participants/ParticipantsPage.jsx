import { ParticipantForm } from '@/features/participant-form/ui/ParticipantForm'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { ParticipantsTable } from '@/widgets/participants-table/ParticipantsTable'
import { useParticipantsViewModel } from './useParticipantsViewModel'
import styles from './ParticipantsPage.module.css'

/**
 * Página de cadastro e edição de participantes.
 * @param {{ participantRepository: { list: Function, create: Function, update: Function } }} props
 */
export function ParticipantsPage({ participantRepository }) {
  const { viewState, actions } = useParticipantsViewModel(participantRepository)

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
      />
    </div>
  )
}

export default ParticipantsPage
