class InMemorySessionStore {
  constructor() {
    this.sessions = new Map();
  }

  findSession(id) {
    return this.sessions.get(id);
  }

  saveSession(id, session) {
    return this.sessions.set(id, session);
  }

  findAllSessions() {
    return [...this.sessions];
  }
}

module.exports = {
  InMemorySessionStore,
};

