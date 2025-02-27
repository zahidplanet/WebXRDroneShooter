// Lobby system for AR-Cade platform
class ARCadeLobby {
  constructor() {
    this.games = [];
    this.platformSettings = {};
    this.configUrl = '../games/config.json';
  }

  /**
   * Initialize the lobby system
   */
  async init() {
    console.log('Initializing AR-Cade lobby...');
    
    try {
      // Load the configuration
      await this.loadConfig();
      
      // Sort games based on platform settings
      this.sortGames();
      
      // Update the lobby UI once A-Frame is ready
      if (document.querySelector('a-scene').hasLoaded) {
        this.setupLobbyUI();
      } else {
        document.querySelector('a-scene').addEventListener('loaded', () => {
          this.setupLobbyUI();
        });
      }
      
      console.log('Lobby initialized successfully');
    } catch (error) {
      console.error('Failed to initialize lobby:', error);
    }
  }

  /**
   * Load the platform configuration
   */
  async loadConfig() {
    try {
      const response = await fetch(this.configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
      }
      
      const config = await response.json();
      this.games = config.games || [];
      this.platformSettings = config.platformSettings || {};
      
      console.log(`Loaded ${this.games.length} games`);
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fallback to empty configuration
      this.games = [];
      this.platformSettings = {};
    }
  }

  /**
   * Sort games based on platform settings
   */
  sortGames() {
    const sortOrder = this.platformSettings.defaultSortOrder || 'lastUpdated';
    
    switch (sortOrder) {
      case 'lastUpdated':
        this.games.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        break;
      case 'title':
        this.games.sort((a, b) => a.title.localeCompare(b.title));
        break;
      // Add more sorting options as needed
    }
    
    // Always put featured games at the top
    this.games.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }

  /**
   * Set up the lobby UI with the loaded games
   */
  setupLobbyUI() {
    // Get the container for the game panels
    const gamePanelContainer = document.getElementById('game-panels');
    if (!gamePanelContainer) {
      console.error('Game panel container not found');
      return;
    }
    
    // Clear existing content
    while (gamePanelContainer.firstChild) {
      gamePanelContainer.removeChild(gamePanelContainer.firstChild);
    }
    
    // Create panels for each game
    const angleStep = (2 * Math.PI) / Math.max(this.games.length, 1);
    const radius = 2; // Distance from center
    
    this.games.forEach((game, index) => {
      const angle = index * angleStep;
      const x = radius * Math.sin(angle);
      const z = radius * Math.cos(angle);
      
      // Create panel for the game
      const panel = document.createElement('a-entity');
      panel.setAttribute('id', `game-${game.id}`);
      panel.setAttribute('position', `${x} 1.5 ${z}`);
      panel.setAttribute('rotation', `0 ${(angle * (180/Math.PI)) - 90} 0`);
      panel.setAttribute('game-panel', `
        id: ${game.id}; 
        title: ${game.title}; 
        description: ${game.description}; 
        path: ${game.path};
        featured: ${game.featured || false};
      `);
      
      gamePanelContainer.appendChild(panel);
    });
    
    // Add a placeholder if no games are available
    if (this.games.length === 0) {
      const placeholder = document.createElement('a-entity');
      placeholder.setAttribute('position', '0 1.5 -2');
      placeholder.setAttribute('text', 'value: No games available yet. Check back later!; align: center; width: 4; color: white');
      gamePanelContainer.appendChild(placeholder);
    }
  }
}

// Initialize the lobby when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const lobby = new ARCadeLobby();
  lobby.init();
}); 