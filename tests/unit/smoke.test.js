import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

describe('test environment', () => {
  it('runs in jsdom', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('renders and queries React nodes with Testing Library', () => {
    render(createElement('h1', null, 'Cidade Dorme'))
    expect(screen.getByRole('heading', { name: 'Cidade Dorme' })).toBeTruthy()
  })
})
