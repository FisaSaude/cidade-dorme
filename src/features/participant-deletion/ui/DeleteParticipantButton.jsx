import { Button } from '@/shared/ui/Button'

/**
 * Botão de exclusão de participante.
 * @param {{ participantName?: string, disabled?: boolean, onDelete?: () => void }} props
 */
export function DeleteParticipantButton({
  participantName = '',
  disabled = false,
  onDelete,
}) {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      aria-label={participantName ? `Excluir ${participantName}` : 'Excluir participante'}
      onClick={onDelete}
    >
      Excluir
    </Button>
  )
}

export default DeleteParticipantButton
