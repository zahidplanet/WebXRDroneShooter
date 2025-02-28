/**
 * City Drone Shooter - Configuration
 * Contains all game settings and constants
 */

const CONFIG = {
    // Game settings
    GAME: {
        NAME: 'City Drone Shooter',
        VERSION: '1.0.0',
        DEBUG: true, // Enable debugging features
        PVP_ENABLED: false, // Player versus player combat
        DIFFICULTY: 1, // 0: Easy, 1: Normal, 2: Hard
        SCORE_MULTIPLIER: 1 // Increases with difficulty
    },
    
    // Network settings
    NETWORK: {
        SERVER_URL: 'wss://game-server.example.com', // Replace with actual server URL
        ROOM_NAME: 'city-shooter',
        UPDATE_RATE: 10, // Update rate in Hz (updates per second)
        INTERPOLATION: true, // Enable client-side interpolation
        MOCK_SERVER: true, // Use mock server for development
        MAX_PLAYERS: 1000, // Maximum players per server
        LATENCY_SIMULATION: 0 // Simulate latency in ms (for testing)
    },
    
    // Player settings
    PLAYER: {
        SPEED: 5, // Movement speed (units per second)
        RUN_MULTIPLIER: 1.5, // Run speed multiplier
        JUMP_FORCE: 6, // Initial jump velocity
        GRAVITY: 15, // Gravity force
        HEIGHT: 1.8, // Player height (for camera)
        CAMERA_HEIGHT: 1.6, // Camera height from ground
        MOUSE_SENSITIVITY: 0.002, // Mouse look sensitivity
        HEALTH: 100, // Player health
        RESPAWN_TIME: 3000, // Time in ms to respawn after death
        SPAWN_PROTECTION: 3000 // Invulnerability time after spawn
    },
    
    // Weapon settings
    WEAPON: {
        DAMAGE: 25, // Base damage per shot
        FIRE_RATE: 150, // Time between shots in ms
        AMMO_CAPACITY: 30, // Magazine size
        RELOAD_TIME: 2000, // Time to reload in ms
        BULLET_SPEED: 60, // Bullet speed (units per second)
        BULLET_RANGE: 100, // Maximum bullet travel distance
        SPREAD: 0.02, // Random bullet spread
        RECOIL: 0.05, // Recoil amount per shot
        RECOVER_RATE: 0.95 // Recoil recovery rate
    },
    
    // Drone settings
    DRONE: {
        MAX_COUNT: 20, // Maximum drones in the game
        SPAWN_INTERVAL: 2000, // Time between drone spawns in ms
        MIN_HEIGHT: 5, // Minimum height above ground
        MAX_HEIGHT: 20, // Maximum height above ground
        SPEED: 3, // Movement speed (units per second)
        TURN_SPEED: 2, // Rotation speed (radians per second)
        HEALTH: 50, // Drone health
        ATTACK_RANGE: 15, // Maximum attack distance
        ATTACK_DAMAGE: 5, // Damage per attack
        ATTACK_INTERVAL: 2000 // Time between attacks in ms
    },
    
    // City settings
    CITY: {
        SIZE: 200, // City size (width and depth)
        BLOCK_SIZE: 20, // Size of a city block
        STREET_WIDTH: 10, // Width of streets
        BUILDINGS: 50, // Number of buildings
        MIN_BUILDING_HEIGHT: 5, // Minimum building height
        MAX_BUILDING_HEIGHT: 30, // Maximum building height
        GROUND_COLOR: 0x555555, // Color of ground plane
        BUILDING_COLORS: [
            0x555555, 0x666666, 0x777777, 0x888888, 0x999999
        ],
        STREET_COLOR: 0x333333, // Color of streets
        SKY_COLOR: 0x87CEEB // Sky color
    },
    
    // Mobile settings
    MOBILE: {
        TOUCH_SENSITIVITY: 0.3, // Touch look sensitivity
        JOYSTICK_SIZE: 80, // Virtual joystick size in pixels
        BUTTON_SIZE: 60, // Control button size in pixels
        BUTTON_SPACING: 10, // Spacing between buttons
        BUTTON_OPACITY: 0.5, // Button transparency
        AUTO_SHOOT_DELAY: 300 // Auto-fire delay in ms
    },
    
    // Sound settings
    SOUND: {
        MASTER_VOLUME: 0.7, // Master volume (0-1)
        MUSIC_VOLUME: 0.5, // Music volume (0-1)
        SFX_VOLUME: 0.8, // Sound effects volume (0-1)
        POSITIONAL_AUDIO: true, // Enable 3D audio
        MUTE_ON_BLUR: true // Mute when tab is not focused
    },
    
    // Rendering settings
    RENDERING: {
        FOV: 75, // Field of view (degrees)
        NEAR_PLANE: 0.1, // Near clipping plane
        FAR_PLANE: 1000, // Far clipping plane
        SHADOWS: true, // Enable shadows
        SHADOW_MAP_SIZE: 1024, // Shadow map resolution
        ANTIALIAS: true, // Enable antialiasing
        MAX_FPS: 0, // 0 for unlimited, or set to cap frame rate
        LOD_ENABLED: true, // Level of detail for distant objects
        LOD_BIAS: 0.5, // LOD distance bias (0-1)
        FOG_ENABLED: true, // Enable fog effect
        FOG_COLOR: 0xCCCCDD, // Fog color
        FOG_NEAR: 20, // Fog near distance
        FOG_FAR: 100, // Fog far distance
    },
    
    // Performance settings
    PERFORMANCE: {
        AUTO_QUALITY: true, // Automatically adjust quality based on FPS
        TARGET_FPS: 60, // Target FPS for auto quality
        QUALITY_CHECK_INTERVAL: 5000, // Time between quality checks in ms
        LOW_FPS_THRESHOLD: 30, // FPS threshold for reducing quality
        HIGH_FPS_THRESHOLD: 55 // FPS threshold for increasing quality
    }
}; 