module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/*.(test|spec).{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': '@swc/jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@grafana/data$': '<rootDir>/src/__mocks__/@grafana/data.ts',
    '^@grafana/ui$': '<rootDir>/src/__mocks__/@grafana/ui.ts',
    '^@grafana/runtime$': '<rootDir>/src/__mocks__/@grafana/runtime.ts',
  },
};