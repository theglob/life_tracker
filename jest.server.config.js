export default {
  preset: 'default',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/server/**/__tests__/**/*.js',
    '<rootDir>/server/**/*.(test|spec).js',
  ],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/__tests__/**',
    '!server/**/*.test.js',
    '!server/**/*.spec.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  globals: {
    TextEncoder: require('util').TextEncoder,
    TextDecoder: require('util').TextDecoder,
  },
}; 