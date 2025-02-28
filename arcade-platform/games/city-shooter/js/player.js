/**
 * City Drone Shooter - Player Module
 * Handles player movement, physics, and multiplayer representation
 */

class PlayerManager {
    constructor(game) {
        this.game = game;
        this.localPlayer = null;
        this.remotePlayers = new Map(); // Map of player id -> player object
    }
    
    /**
     * Initialize the player manager
     */
    init() {
        this.createLocalPlayer();
        return this.localPlayer;
    }
    
    /**
     * Create the local player
     */
    createLocalPlayer() {
        this.localPlayer = new Player(this.game, true);
        this.localPlayer.init();
        
        return this.localPlayer;
    }
    
    /**
     * Add a remote player
     */
    addPlayer(id, playerData) {
        // Don't add the local player twice
        if (id === this.game.networkManager.playerId) return;
        
        console.log("Adding remote player:", id);
        
        // Create new remote player
        const player = new Player(this.game, false, id);
        player.init();
        
        // Set initial position/rotation if available
        if (playerData.position) {
            player.position.set(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            );
        }
        
        if (playerData.rotation) {
            player.rotation.set(
                playerData.rotation.x,
                playerData.rotation.y,
                playerData.rotation.z
            );
        }
        
        // Add to players map
        this.remotePlayers.set(id, player);
        
        return player;
    }
    
    /**
     * Remove a remote player
     */
    removePlayer(id) {
        if (!this.remotePlayers.has(id)) return;
        
        const player = this.remotePlayers.get(id);
        player.dispose();
        this.remotePlayers.delete(id);
        
        console.log("Removed remote player:", id);
    }
    
    /**
     * Update a remote player with new data
     */
    updatePlayer(id, playerData) {
        if (!this.remotePlayers.has(id)) {
            this.addPlayer(id, playerData);
            return;
        }
        
        const player = this.remotePlayers.get(id);
        player.updateFromNetworkData(playerData);
    }
    
    /**
     * Update player score
     */
    updatePlayerScore(id, score) {
        if (id === this.game.networkManager.playerId && this.localPlayer) {
            this.localPlayer.score = score;
        } else if (this.remotePlayers.has(id)) {
            this.remotePlayers.get(id).score = score;
        }
    }
    
    /**
     * Get a player by id
     */
    getPlayer(id) {
        if (id === this.game.networkManager.playerId) {
            return this.localPlayer;
        }
        
        return this.remotePlayers.get(id);
    }
    
    /**
     * Update all players
     */
    update(deltaTime) {
        // Update local player
        if (this.localPlayer) {
            this.localPlayer.update(deltaTime);
        }
        
        // Update remote players
        for (const player of this.remotePlayers.values()) {
            player.update(deltaTime);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.localPlayer) {
            this.localPlayer.dispose();
            this.localPlayer = null;
        }
        
        for (const player of this.remotePlayers.values()) {
            player.dispose();
        }
        
        this.remotePlayers.clear();
    }
}

class Player {
    constructor(game, isLocal = false, id = null) {
        this.game = game;
        this.scene = game.scene;
        this.isLocal = isLocal;
        this.id = id || (isLocal ? game.networkManager.playerId : `remote_${Date.now()}`);
        
        // Player state
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.health = CONFIG.PLAYER.HEALTH;
        this.score = 0;
        this.isAlive = true;
        this.respawnTimer = 0;
        
        // Movement
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        this.canJump = true;
        
        // Player mesh
        this.mesh = null;
        this.camera = null;
        this.controls = null;
        this.weapon = null;
        
        // Physics
        this.onGround = true;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.radius = 0.4;
        this.jumpVelocity = 0;
        
        // Network update
        this.lastNetworkUpdate = 0;
        this.networkUpdateInterval = 50; // ms
    }
    
    /**
     * Initialize the player
     */
    init() {
        this.createPlayerMesh();
        
        if (this.isLocal) {
            this.setupCamera();
            this.setupControls();
            this.setupWeapon();
            this.setupInputListeners();
        }
        
        // Set initial position
        this.position.copy(this.game.cityGenerator.getRandomSpawnPoint());
        this.mesh.position.copy(this.position);
    }
    
    /**
     * Create the player mesh
     */
    createPlayerMesh() {
        // Create player model
        if (this.isLocal) {
            // Local player is just a capsule
            const geometry = new THREE.CapsuleGeometry(this.radius, this.height - this.radius * 2, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0x00FF00, wireframe: true, visible: false });
            this.mesh = new THREE.Mesh(geometry, material);
        } else {
            // Remote player is a visible character
            const geometry = new THREE.CapsuleGeometry(this.radius, this.height - this.radius * 2, 8, 8);
            const material = new THREE.MeshLambertMaterial({ color: 0x0088FF });
            this.mesh = new THREE.Mesh(geometry, material);
            
            // Add a name tag
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const context = canvas.getContext('2d');
            context.fillStyle = '#334466';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '24px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(`Player ${this.id.slice(0, 4)}`, canvas.width / 2, canvas.height / 2 + 8);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.y = this.height + 0.5;
            sprite.scale.set(2, 0.5, 1);
            this.mesh.add(sprite);
        }
        
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.name = `player_${this.id}`;
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    /**
     * Setup camera for local player
     */
    setupCamera() {
        this.camera = this.game.camera;
        this.camera.position.y = this.position.y + CONFIG.PLAYER.CAMERA_HEIGHT;
    }
    
    /**
     * Setup controls for local player
     */
    setupControls() {
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', () => {
            this.controls.lock();
        });
        
        this.controls.addEventListener('lock', () => {
            document.getElementById('game-menu').style.display = 'none';
        });
        
        this.controls.addEventListener('unlock', () => {
            document.getElementById('game-menu').style.display = 'block';
        });
    }
    
    /**
     * Setup weapon for local player
     */
    setupWeapon() {
        this.weapon = new Weapon(this.game, this);
        this.weapon.init();
    }
    
    /**
     * Setup keyboard and mouse listeners for player control
     */
    setupInputListeners() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.jump = true;
                    }
                    break;
                case 'KeyR':
                    if (this.weapon) {
                        this.weapon.reload();
                    }
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        });
        
        // Mouse click for shooting
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.controls.isLocked && this.weapon) {
                this.weapon.shoot();
            }
        });
        
        // Mobile touch controls setup if needed
        if ('ontouchstart' in window) {
            this.setupMobileControls();
        }
    }
    
    /**
     * Setup mobile touch controls
     */
    setupMobileControls() {
        // Show mobile controls
        const joystickArea = document.getElementById('joystick-area');
        const joystickThumb = document.getElementById('joystick-thumb');
        const shootButton = document.getElementById('shoot-button');
        
        if (joystickArea && joystickThumb && shootButton) {
            joystickArea.style.display = 'block';
            shootButton.style.display = 'flex';
            
            // Joystick variables
            let joystickActive = false;
            let joystickOrigin = { x: 0, y: 0 };
            let currentJoystickPos = { x: 0, y: 0 };
            
            // Handle joystick touch
            joystickArea.addEventListener('touchstart', (event) => {
                event.preventDefault();
                joystickActive = true;
                
                const touch = event.touches[0];
                const rect = joystickArea.getBoundingClientRect();
                joystickOrigin.x = rect.left + rect.width / 2;
                joystickOrigin.y = rect.top + rect.height / 2;
                
                updateJoystickPosition(touch.clientX, touch.clientY);
            });
            
            document.addEventListener('touchmove', (event) => {
                if (!joystickActive) return;
                event.preventDefault();
                
                const touch = event.touches[0];
                updateJoystickPosition(touch.clientX, touch.clientY);
            });
            
            document.addEventListener('touchend', (event) => {
                if (!joystickActive) return;
                joystickActive = false;
                
                // Reset joystick position
                joystickThumb.style.transform = 'translate(-50%, -50%)';
                
                // Reset movement
                this.moveForward = false;
                this.moveBackward = false;
                this.moveLeft = false;
                this.moveRight = false;
            });
            
            const updateJoystickPosition = (x, y) => {
                const deltaX = x - joystickOrigin.x;
                const deltaY = y - joystickOrigin.y;
                
                // Calculate distance
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const maxDistance = 40; // Max thumb movement
                
                // Normalize and clamp
                const normalizedX = distance > maxDistance ? deltaX / distance * maxDistance : deltaX;
                const normalizedY = distance > maxDistance ? deltaY / distance * maxDistance : deltaY;
                
                // Update thumb position
                joystickThumb.style.transform = `translate(calc(-50% + ${normalizedX}px), calc(-50% + ${normalizedY}px))`;
                
                // Update movement based on joystick position
                this.moveForward = normalizedY < -10;
                this.moveBackward = normalizedY > 10;
                this.moveLeft = normalizedX < -10;
                this.moveRight = normalizedX > 10;
                
                // Store joystick values for potential camera movement on mobile
                currentJoystickPos.x = normalizedX / maxDistance;
                currentJoystickPos.y = normalizedY / maxDistance;
            };
            
            // Handle shoot button
            shootButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                
                if (this.weapon) {
                    this.weapon.shoot();
                    
                    // For auto-fire
                    this.autoShootInterval = setInterval(() => {
                        if (this.weapon) {
                            this.weapon.shoot();
                        }
                    }, CONFIG.MOBILE.AUTO_SHOOT_DELAY);
                }
            });
            
            shootButton.addEventListener('touchend', (event) => {
                event.preventDefault();
                
                if (this.autoShootInterval) {
                    clearInterval(this.autoShootInterval);
                    this.autoShootInterval = null;
                }
            });
            
            // Jump button
            const jumpButton = document.createElement('div');
            jumpButton.className = 'mobile-control-button';
            jumpButton.innerText = 'JUMP';
            jumpButton.style.position = 'absolute';
            jumpButton.style.bottom = '20px';
            jumpButton.style.right = '150px';
            document.body.appendChild(jumpButton);
            
            jumpButton.addEventListener('touchstart', (event) => {
                event.preventDefault();
                if (this.canJump) {
                    this.jump = true;
                }
            });
        }
    }
    
    /**
     * Apply physics and handle movement
     */
    updatePhysics(deltaTime) {
        if (!this.isAlive) {
            this.handleRespawn(deltaTime);
            return;
        }
        
        // Only handle physics for local player
        if (!this.isLocal) return;
        
        // Reset velocity
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        // Handle gravity
        if (!this.onGround) {
            this.velocity.y -= CONFIG.PLAYER.GRAVITY * deltaTime;
        } else {
            this.velocity.y = 0;
        }
        
        // Handle jump
        if (this.jump && this.onGround) {
            this.velocity.y = CONFIG.PLAYER.JUMP_FORCE;
            this.onGround = false;
            this.canJump = false;
            this.jump = false;
            
            // Reset jump after a short time
            setTimeout(() => {
                this.canJump = true;
            }, 250);
        }
        
        // Get movement direction from camera
        const direction = new THREE.Vector3();
        this.controls.getDirection(direction);
        const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize();
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        
        // Apply movement based on keys
        const speed = CONFIG.PLAYER.SPEED * deltaTime;
        
        if (this.moveForward) {
            this.velocity.add(forward.multiplyScalar(speed));
        }
        if (this.moveBackward) {
            this.velocity.sub(forward.multiplyScalar(speed));
        }
        if (this.moveRight) {
            this.velocity.add(right.multiplyScalar(speed));
        }
        if (this.moveLeft) {
            this.velocity.sub(right.multiplyScalar(speed));
        }
        
        // Normalize horizontal velocity for consistent diagonal movement
        if (this.velocity.x !== 0 || this.velocity.z !== 0) {
            const horizontalVelocity = new THREE.Vector2(this.velocity.x, this.velocity.z);
            if (horizontalVelocity.length() > speed) {
                horizontalVelocity.normalize().multiplyScalar(speed);
                this.velocity.x = horizontalVelocity.x;
                this.velocity.z = horizontalVelocity.y;
            }
        }
        
        // Calculate new position
        const newPosition = this.position.clone().add(this.velocity);
        
        // Check collision with buildings in X direction
        const xCollisionCheck = new THREE.Vector3(
            newPosition.x,
            this.position.y,
            this.position.z
        );
        
        if (!this.game.cityGenerator.checkCollision(xCollisionCheck, this.radius)) {
            this.position.x = newPosition.x;
        }
        
        // Check collision with buildings in Z direction
        const zCollisionCheck = new THREE.Vector3(
            this.position.x,
            this.position.y,
            newPosition.z
        );
        
        if (!this.game.cityGenerator.checkCollision(zCollisionCheck, this.radius)) {
            this.position.z = newPosition.z;
        }
        
        // Apply vertical velocity
        this.position.y += this.velocity.y;
        
        // Check for ground collision
        if (this.position.y < CONFIG.PLAYER.HEIGHT / 2) {
            this.position.y = CONFIG.PLAYER.HEIGHT / 2;
            this.onGround = true;
        } else {
            // Small raycaster to check if we're near the ground
            const raycaster = new THREE.Raycaster(
                new THREE.Vector3(this.position.x, this.position.y, this.position.z),
                new THREE.Vector3(0, -1, 0)
            );
            
            // Check ground collision
            const intersects = raycaster.intersectObjects(this.scene.children, false);
            this.onGround = intersects.length > 0 && intersects[0].distance < CONFIG.PLAYER.HEIGHT / 2 + 0.1;
        }
        
        // Update player mesh position
        this.mesh.position.copy(this.position);
        
        // Update camera position
        this.camera.position.y = this.position.y + CONFIG.PLAYER.CAMERA_HEIGHT;
        
        // Check world boundaries (simplistic)
        const citySize = CONFIG.CITY.SIZE / 2;
        if (Math.abs(this.position.x) > citySize || Math.abs(this.position.z) > citySize) {
            this.position.set(0, CONFIG.PLAYER.HEIGHT / 2, 0);
            if (this.camera) {
                this.camera.position.y = this.position.y + CONFIG.PLAYER.CAMERA_HEIGHT;
            }
        }
    }
    
    /**
     * Update remote player with network data
     */
    updateFromNetworkData(playerData) {
        if (playerData.position) {
            // Smoothly interpolate to new position
            const targetPosition = new THREE.Vector3(
                playerData.position.x,
                playerData.position.y,
                playerData.position.z
            );
            
            // Calculate interpolation factor
            const lerpFactor = 0.3;
            
            // Interpolate position
            this.position.lerp(targetPosition, lerpFactor);
            this.mesh.position.copy(this.position);
        }
        
        if (playerData.rotation) {
            // Update body rotation (y axis only)
            this.rotation.y = playerData.rotation.y;
            this.mesh.rotation.y = this.rotation.y;
        }
        
        // Update player state
        if (playerData.health !== undefined) {
            this.health = playerData.health;
        }
        
        if (playerData.isAlive !== undefined) {
            this.isAlive = playerData.isAlive;
            this.mesh.visible = this.isAlive;
        }
        
        if (playerData.score !== undefined) {
            this.score = playerData.score;
        }
    }
    
    /**
     * Send player data to server
     */
    sendNetworkUpdate() {
        if (!this.isLocal || !this.game.networkManager.isConnected) return;
        
        const now = Date.now();
        
        // Limit update frequency
        if (now - this.lastNetworkUpdate < this.networkUpdateInterval) {
            return;
        }
        
        this.lastNetworkUpdate = now;
        
        // Get camera direction for rotation
        const direction = new THREE.Vector3();
        this.controls.getDirection(direction);
        
        // Create update data
        const updateData = {
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            rotation: {
                x: 0,
                y: Math.atan2(direction.x, direction.z),
                z: 0
            },
            health: this.health,
            isAlive: this.isAlive,
            onGround: this.onGround
        };
        
        // Send to server
        this.game.networkManager.sendPlayerUpdate(updateData);
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health -= amount;
        
        // Update UI if local player
        if (this.isLocal) {
            document.getElementById('health').textContent = this.health;
        }
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }
    
    /**
     * Handle player death
     */
    die() {
        this.isAlive = false;
        this.mesh.visible = false;
        
        // Start respawn timer
        this.respawnTimer = CONFIG.PLAYER.RESPAWN_TIME;
        
        // Update UI if local player
        if (this.isLocal) {
            // Could show death screen or respawn countdown
            console.log("You died! Respawning in", CONFIG.PLAYER.RESPAWN_TIME / 1000, "seconds");
        }
    }
    
    /**
     * Handle player respawn
     */
    handleRespawn(deltaTime) {
        if (this.isAlive) return;
        
        this.respawnTimer -= deltaTime * 1000;
        
        if (this.respawnTimer <= 0) {
            this.respawn();
        }
    }
    
    /**
     * Respawn player
     */
    respawn() {
        // Reset player state
        this.isAlive = true;
        this.health = CONFIG.PLAYER.HEALTH;
        this.mesh.visible = true;
        
        // Get new spawn position
        this.position.copy(this.game.cityGenerator.getRandomSpawnPoint());
        this.mesh.position.copy(this.position);
        
        // Update camera if local player
        if (this.isLocal) {
            this.camera.position.y = this.position.y + CONFIG.PLAYER.CAMERA_HEIGHT;
            document.getElementById('health').textContent = this.health;
        }
    }
    
    /**
     * Update player
     */
    update(deltaTime) {
        if (this.isLocal) {
            this.updatePhysics(deltaTime);
            this.sendNetworkUpdate();
            
            if (this.weapon) {
                this.weapon.update(deltaTime);
            }
        } else {
            // Any update logic for remote players
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => material.dispose());
            } else if (this.mesh.material) {
                this.mesh.material.dispose();
            }
        }
        
        if (this.weapon) {
            this.weapon.dispose();
            this.weapon = null;
        }
        
        if (this.isLocal && this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        if (this.autoShootInterval) {
            clearInterval(this.autoShootInterval);
            this.autoShootInterval = null;
        }
    }
} 