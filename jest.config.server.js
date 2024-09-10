const config = {
	"testEnvironment": "jest-environment-node",
	"transform": {
		//   "^.+\\.jsx?$": "babel-jest"
	},
	"moduleNameMapper": {
		"\\.(css|scss)$": "identity-obj-proxy"
	},
	"transformIgnorePatterns": [
		"/node_modules/(?!(styleMock\\.js)$)"
	],
	"setupFiles": [
		"./setup.jest.js"
	],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	"testPathIgnorePatterns": ["./client"],
	"testMatch": ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"]
};

export default config;