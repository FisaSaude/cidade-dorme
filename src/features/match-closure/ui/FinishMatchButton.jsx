import { createPortal } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import styles from './FinishMatchButton.module.css'

/**
 * Ponto único para encerrar partida manualmente com confirmação.
 * Durante um anúncio de tela cheia, o controle é elevado para uma camada
 * persistente no body, acima da sobreposição e abaixo da confirmação.
 * @param {{
 *   confirmOpen?: boolean,
 *   disabled?: boolean,
 *   overlayActive?: boolean,
 *   onOpen?: () => void,
 *   onCancel?: () => void,
 *   onConfirm?: () => void,
 * }} props
 */
export function FinishMatchButton({
  confirmOpen = false,
  disabled = false,
  overlayActive = false,
  onOpen,
  onCancel,
  onConfirm,
}) {
  const control = (
    <div
      className={overlayActive ? styles.floating : styles.inline}
      data-layer="persistent-closure"
    >
      <Button
        variant="danger"
        disabled={disabled}
        onClick={onOpen}
        aria-label="Encerrar partida"
      >
        Encerrar partida
      </Button>

      <ConfirmDialog
        open={confirmOpen && !disabled}
        title="Encerrar partida manualmente?"
        description="Esta ação encerra a partida atual sem vencedor e mantém o status dos participantes como está."
        confirmLabel="Encerrar agora"
        cancelLabel="Continuar partida"
        danger
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </div>
  )

  if (overlayActive && typeof document !== 'undefined') {
    return createPortal(control, document.body)
  }

  return control
}

export default FinishMatchButton
