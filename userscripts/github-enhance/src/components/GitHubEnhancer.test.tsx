import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GitHubEnhancer } from './GitHubEnhancer'

// Mock window.location
const mockLocation = {
  hostname: 'github.com',
  pathname: '/facebook/react',
  href: 'https://github.com/facebook/react',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => 'ChevronDown',
  ExternalLink: () => 'ExternalLink',
  Code: () => 'Code',
  Search: () => 'Search',
  Zap: () => 'Zap',
  Globe: () => 'Globe',
  BookOpen: () => 'BookOpen',
  Brain: () => 'Brain',
}))

describe('GitHubEnhancer', () => {
  beforeEach(() => {
    // Reset location mock before each test
    mockLocation.pathname = '/facebook/react'
    mockLocation.href = 'https://github.com/facebook/react'
  })

  afterEach(() => {
    cleanup()
  })

  it('should render the enhance button', () => {
    render(<GitHubEnhancer />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('快速访问')
  })

  it('should show dropdown when button is clicked', () => {
    render(<GitHubEnhancer />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByText('GitHub1s')).toBeInTheDocument()
    expect(screen.getByText('Deepwiki')).toBeInTheDocument()
    expect(screen.getByText('Zread')).toBeInTheDocument()
  })

  it('should generate correct URLs for external services', () => {
    render(<GitHubEnhancer />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    // Check GitHub1s link
    const github1sLink = screen.getByText('GitHub1s').closest('a')
    expect(github1sLink).toHaveAttribute(
      'href',
      'https://github1s.com/facebook/react',
    )
  })

  it('should not render when not on a repository page', () => {
    // Mock non-repository page
    mockLocation.pathname = '/settings'

    const { container } = render(<GitHubEnhancer />)
    expect(container.firstChild).toBeNull()
  })

  it('should display current repository info', () => {
    render(<GitHubEnhancer />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByText('facebook/react')).toBeInTheDocument()
  })
})
