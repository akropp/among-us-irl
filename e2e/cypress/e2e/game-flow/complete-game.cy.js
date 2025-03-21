describe('Complete Game Flow', () => {
  let gameCode;

  it('Admin should create a new game', () => {
    // Login as admin
    cy.adminLogin();

    // Create a new game and store the game code
    cy.createGame('E2E Test Game').then(code => {
      gameCode = code;
      expect(gameCode).to.match(/^[A-Z0-9]{6}$/);
    });
  });

  it('Players should be able to join the game', () => {
    // Open two browser tabs for different players
    cy.session('player1', () => {
      cy.joinGame(gameCode, 'Player1');
      cy.url().should('include', '/game/lobby');
    });

    cy.session('player2', () => {
      cy.joinGame(gameCode, 'Player2');
      cy.url().should('include', '/game/lobby');
    });
  });

  it('Admin should start the game', () => {
    cy.adminLogin();
    cy.visit(`${Cypress.env('adminConsoleUrl')}/games`);
    cy.contains('E2E Test Game').click();
    cy.startGame();
    cy.get('[data-testid=game-status]').should('contain', 'In Progress');
  });

  it('Players should see their role and tasks', () => {
    cy.session('player1', () => {
      cy.visit(`${Cypress.env('playerConsoleUrl')}/game/tasks`);
      cy.get('[data-testid=player-role]').should('be.visible');
      cy.get('[data-testid=task-list]').should('be.visible');
      cy.get('[data-testid=task-item]').should('have.length.greaterThan', 0);
    });
  });

  it('Players should be able to complete tasks', () => {
    cy.session('player1', () => {
      cy.visit(`${Cypress.env('playerConsoleUrl')}/game/tasks`);
      cy.completeTask(0);
      cy.get('[data-testid=completed-tasks-count]').should('not.contain', '0/');
    });
  });

  it('Players should be able to call emergency meetings', () => {
    cy.session('player1', () => {
      cy.visit(`${Cypress.env('playerConsoleUrl')}/game`);
      cy.callEmergencyMeeting();
      cy.url().should('include', '/game/emergency');
    });
  });

  it('Admin should be able to end the game', () => {
    cy.adminLogin();
    cy.visit(`${Cypress.env('adminConsoleUrl')}/games`);
    cy.contains('E2E Test Game').click();
    cy.get('[data-testid=end-game-button]').click();
    cy.get('[data-testid=confirm-end-game-button]').click();
    cy.get('[data-testid=game-status]').should('contain', 'Completed');
  });

  it('Players should be redirected to the results screen', () => {
    cy.session('player1', () => {
      // May need to wait for socket events or poll until redirected
      cy.visit(`${Cypress.env('playerConsoleUrl')}/game`);
      cy.url().should('include', '/game/results');
      cy.get('[data-testid=game-results]').should('be.visible');
    });
  });
});
