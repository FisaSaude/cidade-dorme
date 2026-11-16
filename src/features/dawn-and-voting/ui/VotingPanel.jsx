import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { SelectField } from '@/shared/ui/SelectField'
import styles from './DawnAndVoting.module.css'

const TIE_VALUE = 'TIE'

/**
 * @param {{
 *   options?: Array<{ value: string, label: string }>,
 *   onRegisterVote?: (result: { type: 'ELIMINATION', participantId: string } | { type: 'TIE' }) => void,
 * }} props
 */
export function VotingPanel({ options = [], onRegisterVote }) {
  const [selection, setSelection] = useState('')

  const handleConfirm = () => {
    if (!selection) {
      return
    }

    if (selection === TIE_VALUE) {
      onRegisterVote?.({ type: 'TIE' })
      return
    }

    onRegisterVote?.({ type: 'ELIMINATION', participantId: selection })
  }

  return (
    <section className={styles.panel} aria-labelledby="voting-title">
      <h2 id="voting-title">Votação</h2>
      <p className={styles.message}>
        Registre o resultado da votação presencial: um participante vivo
        eliminado ou empate.
      </p>
      <SelectField
        label="Resultado da votação"
        value={selection}
        onChange={(event) => setSelection(event.target.value)}
        options={[
          { value: '', label: 'Selecione o resultado' },
          { value: TIE_VALUE, label: 'Houve empate' },
          ...options,
        ]}
      />
      <div className={styles.actions}>
        <Button onClick={handleConfirm} disabled={!selection}>
          Registrar votação
        </Button>
      </div>
    </section>
  )
}

export default VotingPanel
