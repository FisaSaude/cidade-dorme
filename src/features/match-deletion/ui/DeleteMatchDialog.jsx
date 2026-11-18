import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { uiMessages } from '@/shared/config/labels'
import styles from './DeleteMatchDialog.module.css'

/**
 * Confirmação da exclusão definitiva de uma partida finalizada.
 * @param {{
 *   open: boolean,
 *   matchLabel?: string,
 *   blockedMessage?: string,
 *   deleting?: boolean,
 *   onCancel?: () => void,
 *   onConfirm?: () => void,
 * }} props
 */
export function DeleteMatchDialog({
  open,
  matchLabel = '',
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
      {matchLabel ? <strong>{matchLabel}</strong> : null}{' '}
      {uiMessages.matchDeletionConfirmDescription}
    </>
  )

  return (
    <ConfirmDialog
      open={open}
      title={uiMessages.matchDeletionConfirmTitle}
      description={description}
      confirmLabel={deleting ? 'Excluindo…' : 'Excluir partida'}
      cancelLabel="Cancelar"
      danger
      confirmDisabled={deleting || Boolean(blockedMessage)}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

export default DeleteMatchDialog
