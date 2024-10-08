const config = {
  testEnvironment: "jest-environment-node",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
  setupFiles: ["./jest.setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["./client/src/_site"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"],
//   preset: 'ts-jest',
  testEnvironment: 'jsdom',
};

export default config;
