// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock global fetch if not available
global.fetch = global.fetch || jest.fn()

// Configure testing environment for React 18
global.IS_REACT_ACT_ENVIRONMENT = true