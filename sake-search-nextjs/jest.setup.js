// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock global fetch if not available
global.fetch = global.fetch || jest.fn()

// Configure testing environment for React 18
global.IS_REACT_ACT_ENVIRONMENT = true

// jsdom doesn't implement these browser APIs by default
// Provide safe defaults for tests that use confirm/alert
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).confirm = (global as any).confirm || jest.fn(() => true)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).alert = (global as any).alert || jest.fn()
