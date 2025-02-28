/**
 * City Drone Shooter - Network Module
 * Handles all multiplayer functionality using Colyseus
 */

class NetworkManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.client = null;
        this.room = null;
        this.players = new Map(); // Map of player id -> player data
        this.playerId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Bind event handlers
        this.onStateChange = this.onStateChange.bind(this);
        this.onPlayerJoin = this.onPlayerJoin.bind(this);
        this.onPlayerLeave = this.onPlayerLeave.bind(this);
        this.onPlayerUpdate = this.onPlayerUpdate.bind(this);
        this.onDroneUpdate = this.onDroneUpdate.bind(this);
        this.onScoreUpdate = this.onScoreUpdate.bind(this);
        this.onError = this.onError.bind(this);
    }
    
    /**
     * Initialize the network connection
     */
    async init() {
        try {
            // Connect to the game server
            this.client = new Colyseus.Client(CONFIG.SERVER.URL);
            
            // Use a fallback server if available
            if (CONFIG.SERVER.FALLBACK_URL && !this.isConnected) {
                try {
                    this.client = new Colyseus.Client(CONFIG.SERVER.FALLBACK_URL);
                } catch (e) {
                    console.error("Failed to connect to fallback server:", e);
                }
            }
            
            // For development purposes - use a mock if Colyseus is not available
            if (typeof Colyseus === 'undefined') {
                console.warn("Colyseus not available, using mock server");
                this.initMockServer();
                return;
            }
            
            // Try to join the room
            this.room = await this.client.joinOrCreate(CONFIG.SERVER.ROOM, {
                name: "Player" + Math.floor(Math.random() * 1000),
                // Additional player info can be passed here
            });
            
            this.playerId = this.room.sessionId;
            this.isConnected = true;
            
            // Set up event handlers for room state changes
            this.room.onStateChange(this.onStateChange);
            
            // Set up event handlers for player events
            this.room.state.players.onAdd(this.onPlayerJoin);
            this.room.state.players.onRemove(this.onPlayerLeave);
            this.room.state.players.onChange(this.onPlayerUpdate);
            
            // Set up event handlers for drone events if they exist on server state
            if (this.room.state.drones) {
                this.room.state.drones.onAdd((drone, key) => {
                    this.game.droneManager.spawnDrone(key, drone);
                });
                
                this.room.state.drones.onRemove((drone, key) => {
                    this.game.droneManager.removeDrone(key);
                });
                
                this.room.state.drones.onChange(this.onDroneUpdate);
            }
            
            // Listen for messages
            this.room.onMessage("score", this.onScoreUpdate);
            
            // Handle errors
            this.room.onError(this.onError);
            
            console.log("Connected to game server with ID:", this.playerId);
            this.updateGameStatus("Connected to server");
            
            // Auto-reconnect on disconnect
            this.room.onLeave((code) => {
                this.isConnected = false;
                console.log("Disconnected from room:", code);
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    this.updateGameStatus(`Connection lost. Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    setTimeout(() => this.init(), 2000 * this.reconnectAttempts);
                } else {
                    this.updateGameStatus("Failed to reconnect. Please refresh the page.");
                }
            });
            
            return true;
            
        } catch (error) {
            console.error("Error connecting to game server:", error);
            this.updateGameStatus("Failed to connect to server. Using offline mode.");
            
            // For development, fall back to offline mode
            if (CONFIG.DEBUG) {
                this.initMockServer();
                return true;
            }
            
            return false;
        }
    }
    
    /**
     * Initialize a mock server for offline development
     */
    initMockServer() {
        this.isConnected = true;
        this.playerId = "local_player";
        
        // Create a mock room with minimal functionality
        this.room = {
            state: {
                players: new Map(),
                drones: new Map(),
                metadata: { playerCount: 1 }
            },
            send: (type, message) => {
                console.log("Mock server received:", type, message);
                
                // Simulate server response for common actions
                if (type === "player_update") {
                    // Update local player in mock server
                    if (!this.room.state.players.has(this.playerId)) {
                        this.room.state.players.set(this.playerId, {
                            id: this.playerId,
                            name: "LocalPlayer",
                            position: { x: 0, y: 0, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 },
                            health: 100,
                            score: 0,
                            isAlive: true
                        });
                        
                        // Simulate a player join event
                        this.onPlayerJoin(this.room.state.players.get(this.playerId), this.playerId);
                    }
                    
                    // Update the player with the message data
                    const player = this.room.state.players.get(this.playerId);
                    Object.assign(player, message);
                    
                    // Simulate player update event
                    this.onPlayerUpdate(player, this.playerId);
                }
                
                if (type === "shoot") {
                    // Simulate a successful shot with a delay
                    setTimeout(() => {
                        // Increment score and send score update
                        const player = this.room.state.players.get(this.playerId);
                        player.score += CONFIG.DRONE.SCORE_VALUE;
                        this.onScoreUpdate({
                            playerId: this.playerId,
                            score: player.score
                        });
                    }, 200);
                }
            }
        };
        
        // Spawn some drones in the mock environment
        for (let i = 0; i < 10; i++) {
            const droneId = "drone_" + i;
            const droneData = {
                id: droneId,
                position: {
                    x: (Math.random() - 0.5) * CONFIG.CITY.SIZE * 0.8,
                    y: CONFIG.DRONE.MIN_HEIGHT + Math.random() * (CONFIG.DRONE.MAX_HEIGHT - CONFIG.DRONE.MIN_HEIGHT),
                    z: (Math.random() - 0.5) * CONFIG.CITY.SIZE * 0.8
                },
                rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
                health: CONFIG.DRONE.HEALTH,
                isAlive: true
            };
            
            this.room.state.drones.set(droneId, droneData);
            
            if (this.game.droneManager) {
                this.game.droneManager.spawnDrone(droneId, droneData);
            }
        }
        
        console.log("Mock server initialized for offline play");
        this.updateGameStatus("Playing in offline mode");
    }
    
    /**
     * Send player state update to the server
     */
    sendPlayerUpdate(data) {
        if (!this.isConnected || !this.room) return;
        
        // Send player state to server
        this.room.send("player_update", data);
    }
    
    /**
     * Send shot information to the server
     */
    sendShot(origin, direction, weaponType = "default") {
        if (!this.isConnected || !this.room) return;
        
        this.room.send("shoot", {
            origin: origin,
            direction: direction,
            weaponType: weaponType
        });
    }
    
    /**
     * Handle state changes from the server
     */
    onStateChange(state) {
        // Update player counts
        if (state.metadata && state.metadata.playerCount !== undefined) {
            this.updatePlayerCount(state.metadata.playerCount);
        }
    }
    
    /**
     * Handle a new player joining
     */
    onPlayerJoin(player, key) {
        // Don't add ourselves twice
        if (key === this.playerId && this.players.has(key)) return;
        
        console.log("Player joined:", key, player);
        
        // Add to our local players collection
        this.players.set(key, player);
        
        // Create player in the game world
        if (this.game.playerManager) {
            this.game.playerManager.addPlayer(key, player);
        }
        
        // Update player count
        this.updatePlayerCount(this.players.size);
    }
    
    /**
     * Handle a player leaving
     */
    onPlayerLeave(player, key) {
        console.log("Player left:", key);
        
        // Remove from our local players collection
        this.players.delete(key);
        
        // Remove player from game world
        if (this.game.playerManager) {
            this.game.playerManager.removePlayer(key);
        }
        
        // Update player count
        this.updatePlayerCount(this.players.size);
    }
    
    /**
     * Handle player updates
     */
    onPlayerUpdate(player, key) {
        // Don't process our own updates coming from server
        if (key === this.playerId) return;
        
        // Update player in the game world
        if (this.game.playerManager) {
            this.game.playerManager.updatePlayer(key, player);
        }
    }
    
    /**
     * Handle drone updates
     */
    onDroneUpdate(drone, key) {
        // Update drone in the game world
        if (this.game.droneManager) {
            this.game.droneManager.updateDrone(key, drone);
        }
    }
    
    /**
     * Handle score updates
     */
    onScoreUpdate(data) {
        const { playerId, score } = data;
        
        // Update player score
        if (playerId === this.playerId) {
            this.game.updateScore(score);
        }
        
        // Update other player scores if we track them
        if (this.game.playerManager) {
            this.game.playerManager.updatePlayerScore(playerId, score);
        }
    }
    
    /**
     * Handle network errors
     */
    onError(error) {
        console.error("Network error:", error);
        this.updateGameStatus("Network error: " + error.message);
    }
    
    /**
     * Update the player count display
     */
    updatePlayerCount(count) {
        const playerCountElement = document.getElementById("player-count");
        if (playerCountElement) {
            playerCountElement.textContent = count;
        }
    }
    
    /**
     * Update the game status message
     */
    updateGameStatus(message) {
        const statusElement = document.getElementById("loading-status");
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    /**
     * Disconnect from the server
     */
    disconnect() {
        if (this.room) {
            this.room.leave();
            this.room = null;
        }
        
        this.isConnected = false;
        this.players.clear();
        console.log("Disconnected from game server");
    }
} 