const config = {
	"testEnvironment": "jest-environment-jsdom",
	"transform": {
		   "^.+\\.jsx?$": "babel-jest"
	},
	"moduleNameMapper": {
		"\\.(css|scss)$": "identity-obj-proxy"
	},
	"transformIgnorePatterns": [
		'/node_modules/',
		"/node_modules/(?!(styleMock\\.js)$)"
	],
	"setupFiles": [
		"./jest.setup.js"
	],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	"testPathIgnorePatterns": ["./controllers", "./middlewares", "./client/src/_site", "./__tests__/"],
	"testMatch": ["**/?(*.)+(test).[jt]s?(x)"]
};

export default config;