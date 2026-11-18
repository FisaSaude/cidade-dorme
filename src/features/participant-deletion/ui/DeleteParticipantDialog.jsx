import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { uiMessages } from '@/shared/config/labels'
import styles from './DeleteParticipantDialog.module.css'

/**
 * Confirmação de exclusão por arquivamento.
 * @param {{
 *   open: boolean,
 *   participantName?: string,
 *   blockedMessage?: string,
 *   deleting?: boolean,
 *   onCancel?: () => void,
 *   onConfirm?: () => void,
 * }} props
 */
export function DeleteParticipantDialog({
  open,
  participantName = '',
  blockedMessage = '',
  deleting = false,
  onCancel,
  onConfirm,
}) {
  const description = blockedMessage ? (
    <span className={styles.blocked} role="alert">
      {blockedMessage}
    </span>
  ) : (
    <>
      {participantName ? <strong>{participantName}</strong> : null}{' '}
      {uiMessages.participantArchiveConfirmDescription}
    </>
  )

  return (
    <ConfirmDialog
      open={open}
      title={uiMessages.participantArchiveConfirmTitle}
      description={description}
      confirmLabel={deleting ? 'Excluindo…' : 'Excluir participante'}
      cancelLabel="Cancelar"
      danger
      confirmDisabled={deleting || Boolean(blockedMessage)}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

export default DeleteParticipantDialog
