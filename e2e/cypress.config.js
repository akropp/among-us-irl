const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    experimentalSessionAndOrigin: true
  },
  env: {
    apiUrl: 'http://localhost:5000/api',
    adminConsoleUrl: 'http://localhost:3001',
    playerConsoleUrl: 'http://localhost:3000'
  }
})
