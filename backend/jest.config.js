/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  testTimeout: 60000,
  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },
};
