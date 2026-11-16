import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/shared/ui/Button'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SpecialOverlay } from '@/shared/ui/SpecialOverlay'

describe('acessibilidade dos diálogos', () => {
  it('move o foco para a sobreposição e permite dispensar com Enter', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()

    render(<SpecialOverlay title="Cidade Dorme" onDismiss={onDismiss} />)

    const dialog = screen.getByRole('dialog', { name: 'Cidade Dorme' })
    expect(document.activeElement).toBe(dialog)

    await user.keyboard('{Enter}')

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('não dispensa a sobreposição ao acionar o botão de rodapé', async () => {
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    const onFinish = vi.fn()

    render(
      <SpecialOverlay
        title="Cidade Dorme"
        onDismiss={onDismiss}
        footerAction={
          <Button variant="secondary" onClick={onFinish}>
            Encerrar partida
          </Button>
        }
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Encerrar partida' }))

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('foca a ação de confirmação e cancela com Escape', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Encerrar partida?"
        description="O turno em andamento não será contabilizado."
        confirmLabel="Encerrar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    const dialog = screen.getByRole('dialog', { name: 'Encerrar partida?' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Encerrar' }),
    )

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
