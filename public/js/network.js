// ── Network Layer ─────────────────────────────────────────────
const Network = {
  socket: null,
  playerId: null,
  onJoined: null,
  onGameState: null,
  onEnemyDefeated: null,

  connect() {
    this.socket = io();

    this.socket.on('joined', ({ playerId }) => {
      this.playerId = playerId;
      if (this.onJoined) this.onJoined(playerId);
    });

    this.socket.on('gameState', (state) => {
      if (this.onGameState) this.onGameState(state);
    });

    this.socket.on('enemyDefeated', (data) => {
      if (this.onEnemyDefeated) this.onEnemyDefeated(data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  },

  joinGame(character, name) {
    this.socket.emit('joinGame', { character, name });
  },

  sendPlayerUpdate(player) {
    this.socket.emit('playerUpdate', {
      x: player.x,
      y: player.y,
      facing: player.facing,
      heroMode: player.heroMode,
    });
  },

  attackEnemy(enemyId) {
    this.socket.emit('attackEnemy', { enemyId });
  },
};
