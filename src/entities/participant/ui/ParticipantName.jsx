/**
 * Nome do participante como componente apresentacional.
 * @param {{ name?: string, className?: string }} props
 */
export function ParticipantName({ name, className = '' }) {
  return <span className={className || undefined}>{name}</span>
}

export default ParticipantName
