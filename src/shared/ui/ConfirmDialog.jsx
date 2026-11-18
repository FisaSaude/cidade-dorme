import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined
    }

    const previousFocus = document.activeElement
    const confirmButton = dialogRef.current?.querySelector(
      '[data-autofocus="true"]',
    )

    confirmButton?.focus()

    return () => {
      if (
        previousFocus &&
        typeof previousFocus.focus === 'function' &&
        previousFocus.ownerDocument?.contains(previousFocus)
      ) {
        previousFocus.focus()
      }
    }
  }, [open])

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

  if (!open || typeof document === 'undefined') {
    return null
  }

  const dialog = (
    <div
      className={styles.overlay}
      role="presentation"
      data-layer="confirm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.()
        }
      }}
    >
      <div
        ref={dialogRef}
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
            data-autofocus="true"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialog, document.body)
}

export default ConfirmDialog
