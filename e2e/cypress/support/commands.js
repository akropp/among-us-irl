// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Admin console commands
Cypress.Commands.add('adminLogin', (username = 'admin', password = 'password') => {
  cy.visit(`${Cypress.env('adminConsoleUrl')}/login`);
  cy.get('[data-testid=admin-username]').type(username);
  cy.get('[data-testid=admin-password]').type(password);
  cy.get('[data-testid=admin-login-button]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('createGame', (gameName = 'Test Game') => {
  cy.get('[data-testid=create-game-button]').click();
  cy.get('[data-testid=game-name-input]').type(gameName);
  cy.get('[data-testid=max-players-input]').clear().type('8');
  cy.get('[data-testid=impostor-count-input]').clear().type('2');
  cy.get('[data-testid=submit-game-button]').click();
  cy.url().should('include', '/games/');
  
  // Return the game code so it can be used in subsequent tests
  return cy.get('[data-testid=game-code]').invoke('text');
});

// Player console commands
Cypress.Commands.add('joinGame', (gameCode, playerName = 'TestPlayer') => {
  cy.visit(Cypress.env('playerConsoleUrl'));
  cy.get('[data-testid=game-code-input]').type(gameCode);
  cy.get('[data-testid=player-name-input]').type(playerName);
  cy.get('[data-testid=join-game-button]').click();
  cy.url().should('include', '/game/');
});

Cypress.Commands.add('completeTask', (taskIndex = 0) => {
  cy.get('[data-testid=tasks-nav]').click();
  cy.get('[data-testid=task-item]').eq(taskIndex).click();
  cy.get('[data-testid=complete-task-button]').click();
  cy.get('[data-testid=task-completion-success]').should('be.visible');
});

Cypress.Commands.add('callEmergencyMeeting', () => {
  cy.get('[data-testid=emergency-button]').click();
  cy.get('[data-testid=confirm-emergency-button]').click();
});

// Game flow commands
Cypress.Commands.add('startGame', () => {
  cy.get('[data-testid=start-game-button]').click();
  cy.get('[data-testid=confirm-start-button]').click();
});
