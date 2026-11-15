import { useEffect, useId } from 'react'
import { Button } from './Button'
import styles from './ui.module.css'

/**
 * Diálogo de confirmação acessível, sem conhecimento do domínio.
 * @param {{ open: boolean, title: React.ReactNode, description?: React.ReactNode, confirmLabel?: string, cancelLabel?: string, onConfirm?: () => void, onCancel?: () => void, danger?: boolean, confirmDisabled?: boolean, className?: string }} props
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
  confirmDisabled = false,
  className = '',
}) {
  const generatedId = useId()
  const titleId = `${generatedId}-title`
  const descriptionId = `${generatedId}-description`

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onCancel])

  if (!open) {
    return null
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.()
        }
      }}
    >
      <div
        className={[styles.dialog, className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <h2 id={titleId} className={styles.dialogTitle}>
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className={styles.dialogDescription}>
            {description}
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={confirmDisabled}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
