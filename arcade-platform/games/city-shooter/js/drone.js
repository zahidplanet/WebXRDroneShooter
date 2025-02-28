/**
 * City Drone Shooter - Drone Module
 * Handles drone spawning, movement, and AI behavior
 */

class DroneManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.drones = new Map(); // Map of drone id -> drone object
        this.droneModels = []; // Preloaded drone models for reuse
        this.lastSpawnTime = 0;
        this.spawnInterval = CONFIG.DRONE.SPAWN_INTERVAL;
        this.maxDrones = CONFIG.DRONE.MAX_COUNT;
    }
    
    /**
     * Initialize the drone manager
     */
    init() {
        this.preloadDroneModels();
        
        // If singleplayer/local mode, start spawning drones
        if (!this.game.networkManager.isConnected) {
            this.startDroneSpawning();
        }
        
        return this;
    }
    
    /**
     * Preload drone models
     */
    preloadDroneModels() {
        // Create different drone model variations for reuse
        const types = [
            { name: 'scout', scale: 0.8, color: 0x8888FF, health: CONFIG.DRONE.HEALTH * 0.8, speed: 1.2 },
            { name: 'standard', scale: 1.0, color: 0xAAAAAA, health: CONFIG.DRONE.HEALTH, speed: 1.0 },
            { name: 'heavy', scale: 1.3, color: 0xDD5555, health: CONFIG.DRONE.HEALTH * 1.5, speed: 0.8 }
        ];
        
        for (const type of types) {
            // Simple drone model
            const drone = this.createDroneModel(type);
            this.droneModels.push(drone);
        }
    }
    
    /**
     * Create a drone model template
     */
    createDroneModel(type) {
        // Drone body - center sphere 
        const body = new THREE.Group();
        
        // Body sphere
        const bodyGeometry = new THREE.SphereGeometry(0.5 * type.scale, 16, 12);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: type.color });
        const bodySphere = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodySphere.castShadow = true;
        body.add(bodySphere);
        
        // Add propeller arms
        for (let i = 0; i < 4; i++) {
            const armGroup = new THREE.Group();
            
            // Arm
            const angle = (i * Math.PI / 2);
            const armLength = 0.8 * type.scale;
            const armGeometry = new THREE.BoxGeometry(0.1 * type.scale, 0.05 * type.scale, armLength);
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.z = armLength / 2;
            arm.castShadow = true;
            armGroup.add(arm);
            
            // Propeller
            const propGeometry = new THREE.BoxGeometry(0.6 * type.scale, 0.05 * type.scale, 0.1 * type.scale);
            const propMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
            const propeller = new THREE.Mesh(propGeometry, propMaterial);
            propeller.position.z = armLength;
            propeller.name = `propeller_${i}`;
            propeller.castShadow = true;
            armGroup.add(propeller);
            
            // Position arm at the correct angle
            armGroup.rotation.y = angle;
            body.add(armGroup);
        }
        
        // Add camera/sensor on bottom
        const cameraGeometry = new THREE.CylinderGeometry(0.15 * type.scale, 0.15 * type.scale, 0.2 * type.scale, 8);
        const cameraMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
        camera.rotation.x = Math.PI / 2;
        camera.position.y = -0.3 * type.scale;
        body.add(camera);
        
        // Add lights to the drone
        const lightGeometry = new THREE.SphereGeometry(0.06 * type.scale, 8, 8);
        const redLightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
        const greenLightMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00, emissive: 0x00FF00 });
        
        // Front-right light (red)
        const frontRightLight = new THREE.Mesh(lightGeometry, redLightMaterial);
        frontRightLight.position.set(0.4 * type.scale, 0, 0.4 * type.scale);
        body.add(frontRightLight);
        
        // Back-left light (red)
        const backLeftLight = new THREE.Mesh(lightGeometry, redLightMaterial);
        backLeftLight.position.set(-0.4 * type.scale, 0, -0.4 * type.scale);
        body.add(backLeftLight);
        
        // Front-left light (green)
        const frontLeftLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
        frontLeftLight.position.set(-0.4 * type.scale, 0, 0.4 * type.scale);
        body.add(frontLeftLight);
        
        // Back-right light (green)
        const backRightLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
        backRightLight.position.set(0.4 * type.scale, 0, -0.4 * type.scale);
        body.add(backRightLight);
        
        // Store drone type info
        body.userData = {
            type: type.name,
            scale: type.scale,
            health: type.health,
            speed: type.speed,
            baseColor: type.color
        };
        
        return body;
    }
    
    /**
     * Start drone spawning loop
     */
    startDroneSpawning() {
        this.lastSpawnTime = Date.now();
        
        // Adjust spawn interval based on number of players
        this.updateSpawnRates();
    }
    
    /**
     * Update spawn rates based on player count
     */
    updateSpawnRates() {
        // Increase spawn rate (decrease interval) as more players join
        const playerCount = this.game.playerManager ? 
            1 + this.game.playerManager.remotePlayers.size : 1;
        
        // Base interval reduced by 15% per player, minimum 40% of base interval
        const playerMultiplier = Math.max(0.4, 1 - (playerCount - 1) * 0.15);
        this.spawnInterval = CONFIG.DRONE.SPAWN_INTERVAL * playerMultiplier;
        
        // Increase max drone count with more players
        this.maxDrones = CONFIG.DRONE.MAX_COUNT + Math.floor((playerCount - 1) * 5);
    }
    
    /**
     * Add a drone to the game
     */
    addDrone(id, droneData = {}) {
        // Check if drone already exists
        if (this.drones.has(id)) return this.drones.get(id);
        
        // Create new drone
        const drone = new Drone(this.game, id, droneData);
        drone.init();
        
        // Add to drones map
        this.drones.set(id, drone);
        
        return drone;
    }
    
    /**
     * Remove a drone
     */
    removeDrone(id) {
        if (!this.drones.has(id)) return;
        
        const drone = this.drones.get(id);
        drone.dispose();
        this.drones.delete(id);
    }
    
    /**
     * Update a drone's state
     */
    updateDrone(id, droneData) {
        if (!this.drones.has(id)) {
            this.addDrone(id, droneData);
            return;
        }
        
        const drone = this.drones.get(id);
        drone.updateFromData(droneData);
    }
    
    /**
     * Get a random drone model
     */
    getRandomDroneModel() {
        const index = Math.floor(Math.random() * this.droneModels.length);
        return this.droneModels[index].clone();
    }
    
    /**
     * Spawn a new drone at a random position
     */
    spawnDrone() {
        // Don't spawn if we're at the max
        if (this.drones.size >= this.maxDrones) return null;
        
        // In multiplayer, only server spawns drones
        if (this.game.networkManager.isConnected && !this.game.networkManager.isMockServer) return null;
        
        // Generate a unique ID
        const id = `drone_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Get random spawn position
        const citySize = CONFIG.CITY.SIZE / 2;
        const height = CONFIG.DRONE.MIN_HEIGHT + Math.random() * 
            (CONFIG.DRONE.MAX_HEIGHT - CONFIG.DRONE.MIN_HEIGHT);
        
        const position = new THREE.Vector3(
            (Math.random() * 2 - 1) * citySize * 0.8,
            height,
            (Math.random() * 2 - 1) * citySize * 0.8
        );
        
        // Create drone data
        const drone = this.addDrone(id, {
            position: { x: position.x, y: position.y, z: position.z },
            rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
            health: CONFIG.DRONE.HEALTH,
            type: Math.floor(Math.random() * 3) // 0: scout, 1: standard, 2: heavy
        });
        
        // Notify other players in multiplayer mode
        if (this.game.networkManager.isMockServer) {
            this.game.networkManager.broadcastDroneSpawn(id, {
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: 0, y: drone.rotation.y, z: 0 },
                health: drone.health,
                type: drone.type
            });
        }
        
        return drone;
    }
    
    /**
     * Register a hit on a drone
     */
    registerHit(droneId, damage, playerId) {
        if (!this.drones.has(droneId)) return;
        
        const drone = this.drones.get(droneId);
        const destroyed = drone.takeDamage(damage);
        
        // Award points to player who hit the drone
        if (destroyed && this.game.playerManager) {
            const player = this.game.playerManager.getPlayer(playerId);
            if (player) {
                // Award points based on drone type
                let points = 0;
                switch (drone.type) {
                    case 0: // scout
                        points = 5;
                        break;
                    case 1: // standard
                        points = 10;
                        break;
                    case 2: // heavy
                        points = 20;
                        break;
                }
                
                // Update player score
                if (this.game.networkManager.isConnected) {
                    this.game.networkManager.sendScoreUpdate(playerId, points);
                } else {
                    player.score += points;
                    
                    // Update UI if local player
                    if (player.isLocal) {
                        document.getElementById('score').textContent = player.score;
                    }
                }
            }
        }
    }
    
    /**
     * Update all drones
     */
    update(deltaTime) {
        const now = Date.now();
        
        // Spawn new drones if needed
        if ((!this.game.networkManager.isConnected || this.game.networkManager.isMockServer) &&
            now - this.lastSpawnTime > this.spawnInterval && 
            this.drones.size < this.maxDrones) {
            
            this.spawnDrone();
            this.lastSpawnTime = now;
        }
        
        // Update all drones
        for (const drone of this.drones.values()) {
            drone.update(deltaTime);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        for (const drone of this.drones.values()) {
            drone.dispose();
        }
        
        this.drones.clear();
        
        // Clean up preloaded models
        for (const model of this.droneModels) {
            this.disposeObject(model);
        }
        
        this.droneModels = [];
    }
    
    /**
     * Recursive dispose of an object and its children
     */
    disposeObject(obj) {
        if (!obj) return;
        
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                for (const material of obj.material) {
                    this.disposeMaterial(material);
                }
            } else {
                this.disposeMaterial(obj.material);
            }
        }
        
        if (obj.children) {
            for (const child of obj.children) {
                this.disposeObject(child);
            }
        }
    }
    
    /**
     * Dispose material and its textures
     */
    disposeMaterial(material) {
        if (!material) return;
        
        // Dispose textures
        for (const prop in material) {
            if (material[prop] && material[prop].isTexture) {
                material[prop].dispose();
            }
        }
        
        material.dispose();
    }
}

class Drone {
    constructor(game, id, data = {}) {
        this.game = game;
        this.scene = game.scene;
        this.id = id;
        
        // Position and movement
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        
        // Drone state
        this.health = data.health || CONFIG.DRONE.HEALTH;
        this.maxHealth = this.health;
        this.isAlive = true;
        this.type = data.type !== undefined ? data.type : 1; // 0: scout, 1: standard, 2: heavy
        
        // Movement parameters (will be set based on type)
        this.speed = CONFIG.DRONE.SPEED;
        this.turnSpeed = CONFIG.DRONE.TURN_SPEED;
        this.idleBehavior = Math.floor(Math.random() * 3); // 0: hover, 1: patrol, 2: chase
        this.behaviorChangeTime = 0;
        this.behaviorDuration = 10000 + Math.random() * 10000; // 10-20 seconds
        
        // Initialize from data if provided
        if (data.position) {
            this.position.set(data.position.x, data.position.y, data.position.z);
        }
        
        if (data.rotation) {
            this.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        // Visual elements
        this.mesh = null;
        this.propellers = [];
        this.propellerSpeed = 0.2;
        this.hitEffectTime = 0;
    }
    
    /**
     * Initialize the drone
     */
    init() {
        this.createDroneMesh();
        this.setTypeProperties();
        
        // Set initial state
        this.mesh.position.copy(this.position);
        this.mesh.rotation.setFromVector3(this.rotation);
        this.behaviorChangeTime = Date.now();
        
        // Set initial target position
        this.updateTargetPosition();
        
        return this;
    }
    
    /**
     * Create drone mesh
     */
    createDroneMesh() {
        // Get a random drone model
        this.mesh = this.game.droneManager.getRandomDroneModel();
        this.mesh.name = `drone_${this.id}`;
        
        // Find propellers
        this.propellers = [];
        this.mesh.traverse((object) => {
            if (object.name && object.name.startsWith('propeller_')) {
                this.propellers.push(object);
            }
        });
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    /**
     * Set properties based on drone type
     */
    setTypeProperties() {
        // Get properties from the model
        const userData = this.mesh.userData;
        
        if (userData) {
            this.speed = CONFIG.DRONE.SPEED * userData.speed;
            this.health = userData.health;
            this.maxHealth = this.health;
        } else {
            // Fallback based on type
            switch (this.type) {
                case 0: // scout
                    this.speed = CONFIG.DRONE.SPEED * 1.2;
                    this.health = CONFIG.DRONE.HEALTH * 0.8;
                    this.propellerSpeed = 0.25;
                    break;
                case 1: // standard
                    this.speed = CONFIG.DRONE.SPEED;
                    this.health = CONFIG.DRONE.HEALTH;
                    this.propellerSpeed = 0.2;
                    break;
                case 2: // heavy
                    this.speed = CONFIG.DRONE.SPEED * 0.8;
                    this.health = CONFIG.DRONE.HEALTH * 1.5;
                    this.propellerSpeed = 0.15;
                    break;
            }
            
            this.maxHealth = this.health;
        }
    }
    
    /**
     * Update the drone's target position based on behavior
     */
    updateTargetPosition() {
        const now = Date.now();
        
        // Change behavior periodically
        if (now - this.behaviorChangeTime > this.behaviorDuration) {
            // Randomly select new behavior
            // 0: hover, 1: patrol, 2: chase
            this.idleBehavior = Math.floor(Math.random() * 3);
            this.behaviorChangeTime = now;
            this.behaviorDuration = 10000 + Math.random() * 10000; // 10-20 seconds
        }
        
        const citySize = CONFIG.CITY.SIZE / 2;
        
        switch (this.idleBehavior) {
            case 0: // Hover - stay in the same area with small movements
                this.targetPosition.set(
                    this.position.x + (Math.random() * 10 - 5),
                    this.position.y + (Math.random() * 3 - 1.5),
                    this.position.z + (Math.random() * 10 - 5)
                );
                break;
                
            case 1: // Patrol - move to a new random position
                this.targetPosition.set(
                    (Math.random() * 2 - 1) * citySize * 0.8,
                    CONFIG.DRONE.MIN_HEIGHT + Math.random() * 
                        (CONFIG.DRONE.MAX_HEIGHT - CONFIG.DRONE.MIN_HEIGHT),
                    (Math.random() * 2 - 1) * citySize * 0.8
                );
                break;
                
            case 2: // Chase - target a random player
                if (this.game.playerManager && this.game.playerManager.localPlayer) {
                    // Start with local player as target
                    let targetPlayer = this.game.playerManager.localPlayer;
                    
                    // 30% chance to pick a random player if there are others
                    if (this.game.playerManager.remotePlayers.size > 0 && Math.random() < 0.3) {
                        const remotePlayers = Array.from(this.game.playerManager.remotePlayers.values());
                        const randomIndex = Math.floor(Math.random() * remotePlayers.length);
                        targetPlayer = remotePlayers[randomIndex];
                    }
                    
                    // Only chase if player is alive
                    if (targetPlayer.isAlive) {
                        // Target slightly above the player
                        this.targetPosition.set(
                            targetPlayer.position.x + (Math.random() * 6 - 3),
                            targetPlayer.position.y + 3 + Math.random() * 2,
                            targetPlayer.position.z + (Math.random() * 6 - 3)
                        );
                    } else {
                        // Player is dead, switch to patrol mode
                        this.idleBehavior = 1;
                        this.updateTargetPosition();
                    }
                } else {
                    // No player found, switch to patrol mode
                    this.idleBehavior = 1;
                    this.updateTargetPosition();
                }
                break;
        }
        
        // Clamp target position within city boundaries
        this.targetPosition.x = Math.max(-citySize, Math.min(citySize, this.targetPosition.x));
        this.targetPosition.z = Math.max(-citySize, Math.min(citySize, this.targetPosition.z));
        
        // Clamp height
        this.targetPosition.y = Math.max(CONFIG.DRONE.MIN_HEIGHT, 
            Math.min(CONFIG.DRONE.MAX_HEIGHT, this.targetPosition.y));
    }
    
    /**
     * Update drone with network data
     */
    updateFromData(data) {
        if (data.position) {
            // Smoothly interpolate to new position
            const targetPosition = new THREE.Vector3(
                data.position.x,
                data.position.y,
                data.position.z
            );
            
            // Calculate interpolation factor
            const lerpFactor = 0.3;
            
            // Interpolate position
            this.position.lerp(targetPosition, lerpFactor);
            this.mesh.position.copy(this.position);
        }
        
        if (data.rotation) {
            // Update rotation
            this.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
            this.mesh.rotation.setFromVector3(this.rotation);
        }
        
        if (data.health !== undefined) {
            this.health = data.health;
            
            // Check if drone is destroyed
            if (this.health <= 0 && this.isAlive) {
                this.isAlive = false;
                this.onDestroyed();
            }
        }
        
        if (data.velocity) {
            this.velocity.set(data.velocity.x, data.velocity.y, data.velocity.z);
        }
    }
    
    /**
     * Apply damage to the drone
     */
    takeDamage(amount) {
        if (!this.isAlive) return false;
        
        this.health -= amount;
        this.hitEffectTime = Date.now();
        
        // Play hit sound
        // this.game.audioManager.playSound('drone_hit', 0.5);
        
        // Check if destroyed
        if (this.health <= 0) {
            this.isAlive = false;
            this.onDestroyed();
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle drone destruction
     */
    onDestroyed() {
        // Spawn explosion effect
        this.spawnExplosion();
        
        // Play explosion sound
        // this.game.audioManager.playSound('drone_explosion');
        
        // In multiplayer mode, remove drone only from server
        if (this.game.networkManager.isConnected && !this.game.networkManager.isMockServer) {
            // Make drone invisible but keep it until server removes it
            this.mesh.visible = false;
        } else {
            // In singleplayer or if server, remove drone after a short delay
            setTimeout(() => {
                this.game.droneManager.removeDrone(this.id);
            }, 2000);
        }
    }
    
    /**
     * Create explosion effect
     */
    spawnExplosion() {
        // Get the current drone position
        const position = this.position.clone();
        
        // Create a particle system for the explosion
        const particleCount = 30;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFF5500,
            size: 0.2,
            transparent: true,
            opacity: 1
        });
        
        // Create particles with random velocities
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
                ),
                lifetime: 1 + Math.random() * 0.5
            };
            
            particles.push(particle);
        }
        
        // Create the particle system
        const positions = new Float32Array(particleCount * 3);
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particleSystem);
        
        // Animation loop for particles
        let elapsedTime = 0;
        const animate = (deltaTime) => {
            elapsedTime += deltaTime;
            
            // Update particle positions
            for (let i = 0; i < particleCount; i++) {
                const particle = particles[i];
                particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
                particle.velocity.y -= 2 * deltaTime; // gravity
                
                positions[i * 3] = particle.position.x;
                positions[i * 3 + 1] = particle.position.y;
                positions[i * 3 + 2] = particle.position.z;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Update opacity based on lifetime
            particleMaterial.opacity = Math.max(0, 1 - elapsedTime / 2);
            
            // Remove when animation is complete
            if (elapsedTime >= 2) {
                this.scene.remove(particleSystem);
                particleGeometry.dispose();
                particleMaterial.dispose();
                return false; // stop animation
            }
            
            return true; // continue animation
        };
        
        // Add to animation loop
        this.game.addAnimation(animate);
    }
    
    /**
     * Update drone logic
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        // Only update AI in singleplayer or if server in multiplayer
        if (!this.game.networkManager.isConnected || this.game.networkManager.isMockServer) {
            // Check if we need a new target
            if (this.position.distanceTo(this.targetPosition) < 2 ||
                Math.random() < 0.005) { // small chance to change target even if not reached
                this.updateTargetPosition();
            }
            
            // Move towards target
            const direction = this.targetPosition.clone().sub(this.position).normalize();
            this.velocity.set(
                direction.x * this.speed * deltaTime,
                direction.y * this.speed * deltaTime,
                direction.z * this.speed * deltaTime
            );
            
            // Update position
            this.position.add(this.velocity);
            this.mesh.position.copy(this.position);
            
            // Update rotation to face movement direction
            if (this.velocity.length() > 0.01) {
                const targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
                
                // Smoothly rotate towards target direction
                let angleDiff = targetRotation - this.rotation.y;
                
                // Normalize angle difference to [-PI, PI]
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                
                // Apply rotation
                this.rotation.y += angleDiff * this.turnSpeed * deltaTime;
                this.mesh.rotation.y = this.rotation.y;
            }
        }
        
        // Update propellers
        for (const propeller of this.propellers) {
            propeller.rotation.y += this.propellerSpeed;
        }
        
        // Update hit effect
        if (Date.now() - this.hitEffectTime < 200) {
            // Flash drone when hit
            if (!this.originalMaterials) {
                this.originalMaterials = new Map();
                this.mesh.traverse((object) => {
                    if (object.material) {
                        this.originalMaterials.set(object, object.material.clone());
                        object.material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
                    }
                });
            }
        } else if (this.originalMaterials) {
            // Restore original materials
            this.mesh.traverse((object) => {
                if (this.originalMaterials.has(object)) {
                    object.material.dispose();
                    object.material = this.originalMaterials.get(object);
                }
            });
            this.originalMaterials = null;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.game.droneManager.disposeObject(this.mesh);
            this.mesh = null;
        }
        
        this.propellers = [];
        
        if (this.originalMaterials) {
            this.originalMaterials.forEach((material) => {
                material.dispose();
            });
            this.originalMaterials.clear();
            this.originalMaterials = null;
        }
    }
} 