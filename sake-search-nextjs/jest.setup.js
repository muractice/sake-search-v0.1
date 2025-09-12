// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock global fetch if not available
global.fetch = global.fetch || jest.fn()

// Configure testing environment for React 18
global.IS_REACT_ACT_ENVIRONMENT = true

// jsdom doesn't implement these browser APIs by default
// Provide safe defaults for tests that use confirm/alert
// Provide confirm/alert for both global and window in jsdom
const confirmMock = jest.fn(() => true)
const alertMock = jest.fn()
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.confirm = global.confirm || confirmMock
  // @ts-ignore
  global.alert = global.alert || alertMock
}
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.confirm = window.confirm || confirmMock
  // @ts-ignore
  window.alert = window.alert || alertMock
}

// Reduce noisy React act() warnings in tests output
const originalConsoleError = console.error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.error = (...args: any[]) => {
  const msg = args?.[0]
  if (typeof msg === 'string' && msg.includes('not wrapped in act(')) {
    return
  }
  originalConsoleError(...args)
}
