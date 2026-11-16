import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

/**
 * Botão para encerrar partida manualmente com confirmação.
 * @param {{
 *   confirmOpen?: boolean,
 *   onOpen?: () => void,
 *   onCancel?: () => void,
 *   onConfirm?: () => void,
 *   compact?: boolean,
 *   renderDialog?: boolean,
 * }} props
 */
export function FinishMatchButton({
  confirmOpen = false,
  onOpen,
  onCancel,
  onConfirm,
  compact = false,
  renderDialog = true,
}) {
  return (
    <>
      <Button
        variant="danger"
        onClick={onOpen}
        aria-label="Encerrar partida"
      >
        {compact ? 'Encerrar' : 'Encerrar partida'}
      </Button>

      {renderDialog ? (
        <ConfirmDialog
          open={confirmOpen}
          title="Encerrar partida manualmente?"
          description="Esta ação encerra a partida atual sem vencedor e mantém o status dos participantes como está."
          confirmLabel="Encerrar agora"
          cancelLabel="Continuar partida"
          danger
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      ) : null}
    </>
  )
}

export default FinishMatchButton
