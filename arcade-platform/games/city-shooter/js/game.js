/**
 * City Drone Shooter - Main Game Class
 * Initializes and manages all game components
 */

class Game {
    constructor() {
        // Add debug to console immediately
        console.log('Game constructor called. Starting initialization...');
        console.log('User agent:', navigator.userAgent);
        console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight);
        
        try {
            // Core three.js components
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            
            // Game managers
            this.networkManager = null;
            this.playerManager = null;
            this.droneManager = null;
            this.cityGenerator = null;
            
            // Game state
            this.isRunning = false;
            this.isPaused = false;
            this.lastTime = 0;
            this.animations = []; // Custom animation callbacks
            
            // Performance monitoring
            this.stats = null;
            this.fps = 0;
            this.frameCount = 0;
            this.lastFpsUpdate = 0;
            
            // Mobile detection and performance options
            this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            this.forceSimpleMode = window.location.search.includes('simple=true'); // URL param to force simple mode
            
            if (this.forceSimpleMode) {
                console.log("Simple mode forced by URL parameter");
                // Force mobile optimizations even on desktop
                this.isMobile = true;
            }
            
            console.log('Mobile detection result:', this.isMobile);
            console.log('Simple mode:', this.forceSimpleMode);
            
            // Loading state
            this.totalLoadingSteps = 5; // Number of major loading steps
            this.loadingProgress = 0;
            
            // Bind methods
            this.update = this.update.bind(this);
            this.onWindowResize = this.onWindowResize.bind(this);
            
            console.log('Game constructor completed successfully');
        } catch (error) {
            console.error('Error in game constructor:', error);
            this.showErrorOnPage('Failed to initialize game: ' + error.message);
        }
    }
    
    /**
     * Initialize the game
     */
    async init() {
        console.log('Initializing City Drone Shooter...');
        this.createLoadingScreen();
        
        try {
            // Initialize core components
            this.updateLoadingProgress('Initializing graphics engine...', 0);
            
            try {
                console.log('Initializing Three.js...');
                this.initThreeJS();
                console.log('Three.js initialized successfully');
            } catch (error) {
                console.error('Failed to initialize ThreeJS:', error);
                throw new Error('Graphics initialization failed: ' + error.message);
            }
            
            try {
                console.log('Adding event listeners...');
                this.addEventListeners();
                console.log('Event listeners added');
            } catch (error) {
                console.error('Failed to add event listeners:', error);
                // Non-fatal error, continue
            }
            
            // Initialize stats if debug mode is enabled
            if (CONFIG.GAME.DEBUG) {
                console.log('Initializing debug stats...');
                this.initStats();
            }
            
            // Apply mobile optimizations if needed
            if (this.isMobile) {
                console.log('Applying mobile optimizations...');
                this.applyMobileOptimizations();
            }
            
            // Initialize networking
            this.updateLoadingProgress('Connecting to network...', 1);
            try {
                console.log('Initializing network manager...');
                this.networkManager = new NetworkManager(this);
                await this.networkManager.init();
                console.log('Network manager initialized');
            } catch (error) {
                console.error('Failed to initialize network manager:', error);
                // Non-fatal error, continue with offline mode
            }
            
            // Generate city environment
            this.updateLoadingProgress('Generating city environment...', 2);
            try {
                console.log('Creating city generator...');
                this.cityGenerator = new CityGenerator(this);
                console.log('Generating city...');
                this.cityGenerator.generateCity();
                console.log('City generation complete');
            } catch (error) {
                console.error('Failed to generate city:', error);
                throw new Error('City generation failed: ' + error.message);
            }
            
            // Initialize drone manager
            this.updateLoadingProgress('Preparing enemy drones...', 3);
            try {
                console.log('Initializing drone manager...');
                this.droneManager = new DroneManager(this);
                this.droneManager.init();
                console.log('Drone manager initialized');
            } catch (error) {
                console.error('Failed to initialize drone manager:', error);
                throw new Error('Drone initialization failed: ' + error.message);
            }
            
            // Initialize player manager
            this.updateLoadingProgress('Setting up player controls...', 4);
            try {
                console.log('Initializing player manager...');
                this.playerManager = new PlayerManager(this);
                this.playerManager.init();
                console.log('Player manager initialized');
            } catch (error) {
                console.error('Failed to initialize player manager:', error);
                throw new Error('Player initialization failed: ' + error.message);
            }
            
            // Final setup
            this.updateLoadingProgress('Ready to play!', 5);
            
            // Success
            console.log('Game initialized successfully');
            this.hideLoadingScreen();
            this.showGameUI();
            this.start();
            
            return true;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showErrorScreen('Failed to initialize game: ' + error.message);
            this.showErrorOnPage(error.message);
            return false;
        }
    }
    
    /**
     * Apply mobile-specific optimizations
     */
    applyMobileOptimizations() {
        // Adjust graphics settings for mobile
        CONFIG.RENDERING.SHADOWS = false;
        CONFIG.RENDERING.ANTIALIAS = false;
        CONFIG.DRONE.MAX_COUNT = Math.max(5, Math.floor(CONFIG.DRONE.MAX_COUNT * 0.4)); // Reduce drone count even more
        CONFIG.CITY.BUILDINGS = Math.floor(CONFIG.CITY.BUILDINGS * 0.5); // Reduce building count more aggressively
        
        // Further reduce quality of various elements
        CONFIG.RENDERING.SHADOW_MAP_SIZE = 512;
        
        // If using ultra-simplified mode, apply even more aggressive optimizations
        if (this.forceSimpleMode) {
            CONFIG.DRONE.MAX_COUNT = 5; // Absolute minimum drones
            CONFIG.CITY.BUILDINGS = 10; // Very few buildings
            CONFIG.RENDERING.FOG_ENABLED = false; // Disable fog completely
        }
        
        console.log('Applied mobile optimizations');
    }
    
    /**
     * Update the loading progress
     */
    updateLoadingProgress(statusText, step) {
        const progressBar = document.getElementById('loading-progress');
        const loadingText = document.querySelector('.loading-text');
        
        if (progressBar && loadingText) {
            // Update progress bar
            const progressPercentage = (step / this.totalLoadingSteps) * 100;
            progressBar.style.width = `${progressPercentage}%`;
            
            // Update status text
            loadingText.textContent = statusText;
            
            console.log(`Loading: ${statusText} (${progressPercentage}%)`);
        }
        
        this.loadingProgress = step;
    }
    
    /**
     * Initialize Three.js components
     */
    initThreeJS() {
        try {
            // Create scene
            console.log('Creating Three.js scene...');
            this.scene = new THREE.Scene();
            
            // ULTRA COMPATIBILITY MODE - check URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const forceSimpleMode = urlParams.has('simple');
            const forceCompatMode = urlParams.has('compat') || forceSimpleMode;
            
            if (forceCompatMode) {
                console.log('⚠️ COMPATIBILITY MODE FORCED BY URL PARAMETER');
                this.isMobile = true;
                this.forceSimpleMode = forceSimpleMode;
            }
            
            // Create camera
            console.log('Creating camera...');
            this.camera = new THREE.PerspectiveCamera(
                CONFIG.RENDERING.FOV,
                window.innerWidth / window.innerHeight,
                CONFIG.RENDERING.NEAR_PLANE,
                CONFIG.RENDERING.FAR_PLANE
            );
            
            // ULTRA COMPATIBILITY MODE - Use even more aggressive settings for problematic devices
            if (forceCompatMode) {
                console.log('Applying ultra-compatibility renderer settings...');
                
                // Force software renderer for maximum compatibility
                this.renderer = new THREE.WebGLRenderer({
                    antialias: false,
                    powerPreference: 'low-power',
                    precision: 'lowp',
                    alpha: false,
                    stencil: false,
                    depth: true,
                    logarithmicDepthBuffer: false
                });
                
                // Ultra-low pixel ratio
                this.renderer.setPixelRatio(1);
                
                // Disable all shadows and effects
                CONFIG.RENDERING.SHADOWS = false;
                CONFIG.RENDERING.FOG_ENABLED = false;
                CONFIG.DRONE.MAX_COUNT = 3; // Absolute minimum drones
                CONFIG.CITY.BUILDINGS = 5;  // Bare minimum buildings
                
                console.log('Ultra-compatibility mode enabled. All effects minimized.');
            } else {
                // Regular initialization with device-appropriate settings
                console.log('Creating renderer...');
                this.renderer = new THREE.WebGLRenderer({
                    antialias: !this.isMobile && CONFIG.RENDERING.ANTIALIAS,
                    powerPreference: 'high-performance',
                    alpha: false,
                    precision: this.isMobile ? 'mediump' : 'highp' // Lower precision on mobile
                });
                
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio at 2
            }
            
            // Common setup for all modes
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.shadowMap.enabled = CONFIG.RENDERING.SHADOWS;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Add canvas to DOM
            const container = document.getElementById('game-container');
            if (!container) {
                throw new Error("Game container element not found");
            }
            container.appendChild(this.renderer.domElement);
            
            // Set initial camera position
            this.camera.position.set(0, CONFIG.PLAYER.HEIGHT, 0);
            
            // Set simple background color instead of skybox for compatibility mode
            if (forceCompatMode) {
                this.scene.background = new THREE.Color(0x87CEEB);
            }
            
            console.log('Three.js initialization complete');
        } catch (error) {
            console.error('Error in initThreeJS:', error);
            throw error;
        }
    }
    
    /**
     * Initialize performance stats
     */
    initStats() {
        // Add stats panel if in debug mode
        const statsContainer = document.createElement('div');
        statsContainer.id = 'stats';
        statsContainer.style.position = 'absolute';
        statsContainer.style.left = '0px';
        statsContainer.style.top = '0px';
        document.body.appendChild(statsContainer);
        
        // Create FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        fpsCounter.style.position = 'absolute';
        fpsCounter.style.right = '10px';
        fpsCounter.style.top = '10px';
        fpsCounter.style.backgroundColor = 'rgba(0,0,0,0.5)';
        fpsCounter.style.color = 'white';
        fpsCounter.style.padding = '5px';
        fpsCounter.style.fontFamily = 'monospace';
        fpsCounter.textContent = 'FPS: 0';
        document.body.appendChild(fpsCounter);
    }
    
    /**
     * Display an error message directly on the page
     */
    showErrorOnPage(message) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = `<span style="color: red; font-weight: bold;">Error: ${message}</span><br><button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 10px;">Retry</button>`;
        }
        
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.style.display = 'block';
            debugInfo.innerHTML = `
                <strong>Error:</strong> ${message}<br>
                <strong>Browser:</strong> ${navigator.userAgent}<br>
                <strong>Mobile:</strong> ${this.isMobile}<br>
                <strong>Simple Mode:</strong> ${this.forceSimpleMode}<br>
                <strong>Screen:</strong> ${window.innerWidth}x${window.innerHeight}<br>
                <button onclick="window.location.href = window.location.href + '?simple=true'">Try Simple Mode</button>
            `;
        }
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Window resize
        window.addEventListener('resize', this.onWindowResize);
        
        // Pause when tab loses focus
        window.addEventListener('blur', () => {
            if (this.isRunning && !this.isPaused) {
                this.pause();
            }
        });
        
        // Resume when tab gains focus
        window.addEventListener('focus', () => {
            if (this.isRunning && this.isPaused) {
                this.unpause();
            }
        });
        
        // Pause/unpause with Escape key
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                if (this.isPaused) {
                    this.unpause();
                } else {
                    this.pause();
                }
            }
        });
        
        // Handle visibility change for mobile
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning && !this.isPaused) {
                this.pause();
            } else if (!document.hidden && this.isRunning && this.isPaused) {
                this.unpause();
            }
        });
        
        // Back button to return to lobby
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.returnToLobby();
            });
        }
    }
    
    /**
     * Handle window resize event
     */
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // Start render loop
        requestAnimationFrame(this.update);
        
        console.log('Game started');
    }
    
    /**
     * Update game state and render
     */
    update(currentTime) {
        if (!this.isRunning) return;
        
        // Request next frame
        requestAnimationFrame(this.update);
        
        // Skip update if paused
        if (this.isPaused) return;
        
        // Calculate delta time (in seconds)
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Cap delta time to avoid large jumps after tab switch, etc.
        const cappedDelta = Math.min(deltaTime, 0.1);
        
        // Update FPS counter
        this.updateFPS(cappedDelta);
        
        // Update game components
        this.updateGameComponents(cappedDelta);
        
        // Run custom animations
        this.updateAnimations(cappedDelta);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Update game components
     */
    updateGameComponents(deltaTime) {
        // Update network
        if (this.networkManager) {
            this.networkManager.update(deltaTime);
        }
        
        // Update players
        if (this.playerManager) {
            this.playerManager.update(deltaTime);
        }
        
        // Update drones
        if (this.droneManager) {
            this.droneManager.update(deltaTime);
        }
    }
    
    /**
     * Update custom animations
     */
    updateAnimations(deltaTime) {
        // Run all custom animation callbacks and filter out completed ones
        this.animations = this.animations.filter(animate => animate(deltaTime));
    }
    
    /**
     * Add a custom animation to the loop
     */
    addAnimation(animationCallback) {
        this.animations.push(animationCallback);
    }
    
    /**
     * Update FPS counter
     */
    updateFPS(deltaTime) {
        if (!CONFIG.GAME.DEBUG) return;
        
        this.frameCount++;
        
        const now = performance.now();
        const elapsed = now - this.lastFpsUpdate;
        
        // Update once per second
        if (elapsed >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            
            // Update UI
            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                fpsCounter.textContent = `FPS: ${this.fps}`;
                
                // Color based on performance
                if (this.fps >= 50) {
                    fpsCounter.style.color = 'lime';
                } else if (this.fps >= 30) {
                    fpsCounter.style.color = 'yellow';
                } else {
                    fpsCounter.style.color = 'red';
                }
            }
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        document.getElementById('pause-menu').style.display = 'flex';
        
        console.log('Game paused');
    }
    
    /**
     * Unpause the game
     */
    unpause() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        document.getElementById('pause-menu').style.display = 'none';
        this.lastTime = performance.now(); // Reset time to avoid jump
        
        console.log('Game resumed');
    }
    
    /**
     * Stop the game
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        
        console.log('Game stopped');
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Stop game loop
        this.stop();
        
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        
        // Clean up managers
        if (this.playerManager) {
            this.playerManager.dispose();
            this.playerManager = null;
        }
        
        if (this.droneManager) {
            this.droneManager.dispose();
            this.droneManager = null;
        }
        
        if (this.networkManager) {
            this.networkManager.disconnect();
            this.networkManager = null;
        }
        
        // Clean up scene
        if (this.scene) {
            this.disposeScene(this.scene);
            this.scene = null;
        }
        
        // Clean up renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
        }
        
        // Clear animations
        this.animations = [];
        
        console.log('Game resources cleaned up');
    }
    
    /**
     * Recursively dispose scene objects
     */
    disposeScene(scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => this.disposeMaterial(material));
                } else {
                    this.disposeMaterial(object.material);
                }
            }
        });
    }
    
    /**
     * Dispose material and its textures
     */
    disposeMaterial(material) {
        // Dispose textures
        for (const prop in material) {
            if (material[prop] && material[prop].isTexture) {
                material[prop].dispose();
            }
        }
        
        material.dispose();
    }
    
    /**
     * Return to lobby
     */
    returnToLobby() {
        // First clean up all game resources
        this.cleanup();
        
        // Navigate back to lobby
        window.location.href = '/arcade-platform/index.html';
    }
    
    /**
     * Create loading screen
     */
    createLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        loadingScreen.style.display = 'flex';
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
    
    /**
     * Show error screen
     */
    showErrorScreen(message) {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;
        
        const loadingText = loadingScreen.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = `Error: ${message}<br><button id="retry-button" style="margin-top: 15px; padding: 8px 16px; background: #00a8ff; color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button><br><button id="simple-mode-button" style="margin-top: 10px; padding: 8px 16px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Simple Mode</button>`;
            
            const retryButton = document.getElementById('retry-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    window.location.reload();
                });
            }
            
            const simpleModeButton = document.getElementById('simple-mode-button');
            if (simpleModeButton) {
                simpleModeButton.addEventListener('click', () => {
                    window.location.href = window.location.pathname + (window.location.search ? window.location.search + '&simple=true' : '?simple=true');
                });
            }
        }
    }
    
    /**
     * Show game UI
     */
    showGameUI() {
        // Show HUD elements
        document.getElementById('game-ui').style.display = 'flex';
        
        // Show start menu
        document.getElementById('game-menu').style.display = 'flex';
        
        // Hide pause menu
        document.getElementById('pause-menu').style.display = 'none';
    }
}

// Initialize game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        const game = new Game();
        game.init().catch(error => {
            console.error('Game initialization failed:', error);
        });
        
        // Store game instance globally for debugging
        window.gameInstance = game;
    } catch (error) {
        console.error('Error creating game instance:', error);
        alert('Failed to initialize game: ' + error.message);
        
        // Show error on page
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = `<span style="color: red; font-weight: bold;">Fatal Error: ${error.message}</span><br><button onclick="window.location.reload()" style="margin-top: 10px; padding: 5px 10px;">Retry</button>`;
        }
    }
}); 