/**
 * City Drone Shooter - Weapon Module
 * Handles shooting mechanics, bullet physics, and hit detection
 */

class Weapon {
    constructor(game, player) {
        this.game = game;
        this.scene = game.scene;
        this.player = player;
        this.camera = player.camera;
        
        // Weapon state
        this.isReloading = false;
        this.lastShotTime = 0;
        this.ammo = CONFIG.WEAPON.AMMO_CAPACITY;
        this.maxAmmo = CONFIG.WEAPON.AMMO_CAPACITY;
        
        // Bullet management
        this.bullets = [];
        this.bulletPool = [];
        
        // Weapon model
        this.mesh = null;
        
        // Visual effects
        this.muzzleFlash = null;
        this.muzzleFlashVisible = false;
        this.muzzleFlashTime = 0;
        
        // Audio
        this.shootSound = null;
        this.reloadSound = null;
        this.emptySound = null;
    }
    
    /**
     * Initialize the weapon
     */
    init() {
        // Create weapon model
        this.createWeaponModel();
        
        // Create muzzle flash effect
        this.createMuzzleFlash();
        
        // Pre-create bullet pool
        this.createBulletPool(20);
        
        // Initialize UI if local player
        if (this.player.isLocal) {
            this.updateAmmoDisplay();
        }
        
        return this;
    }
    
    /**
     * Create weapon model
     */
    createWeaponModel() {
        // Only show weapon model for remote players
        if (!this.player.isLocal) return;
        
        // For local player, create a simplified first-person model
        const group = new THREE.Group();
        
        // Gun body
        const bodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0, -0.2);
        group.add(body);
        
        // Gun barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, -0.05, -0.6);
        group.add(barrel);
        
        // Gun grip
        const gripGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.1);
        const gripMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const grip = new THREE.Mesh(gripGeometry, gripMaterial);
        grip.position.set(0, -0.15, -0.15);
        group.add(grip);
        
        // Position the weapon in the camera view
        group.position.set(0.25, -0.2, -0.5);
        this.mesh = group;
        
        // Add to camera so it moves with the player view
        this.camera.add(this.mesh);
    }
    
    /**
     * Create a muzzle flash effect
     */
    createMuzzleFlash() {
        if (!this.player.isLocal) return;
        
        // Create a bright muzzle flash
        const flashGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
        this.muzzleFlash.position.set(0, -0.05, -0.9);
        this.muzzleFlash.visible = false;
        
        if (this.mesh) {
            this.mesh.add(this.muzzleFlash);
        }
    }
    
    /**
     * Create a pool of reusable bullets
     */
    createBulletPool(count) {
        for (let i = 0; i < count; i++) {
            const bullet = this.createBullet();
            bullet.visible = false;
            this.bulletPool.push(bullet);
        }
    }
    
    /**
     * Create a single bullet
     */
    createBullet() {
        // Create a small, fast-moving projectile
        const geometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const bullet = new THREE.Mesh(geometry, material);
        
        // Add to scene
        this.scene.add(bullet);
        
        // Add trail effect
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xFFAA00,
            transparent: true,
            opacity: 0.5
        });
        
        // Prepare positions for line segments
        const points = [];
        for (let i = 0; i < 10; i++) {
            points.push(0, 0, -i * 0.1);
        }
        
        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        bullet.add(trail);
        
        return bullet;
    }
    
    /**
     * Shoot the weapon
     */
    shoot() {
        // Check if we can shoot
        const now = Date.now();
        const timeSinceLastShot = now - this.lastShotTime;
        
        if (this.isReloading || timeSinceLastShot < CONFIG.WEAPON.FIRE_RATE) {
            return false;
        }
        
        // Check ammo
        if (this.ammo <= 0) {
            this.playEmptySound();
            this.reload();
            return false;
        }
        
        // Update state
        this.lastShotTime = now;
        this.ammo--;
        
        // Update UI for local player
        if (this.player.isLocal) {
            this.updateAmmoDisplay();
        }
        
        // Create bullet
        this.fireBullet();
        
        // Play sound
        this.playShootSound();
        
        // Show muzzle flash
        this.showMuzzleFlash();
        
        // Auto-reload if empty
        if (this.ammo <= 0) {
            this.reload();
        }
        
        return true;
    }
    
    /**
     * Fire a bullet
     */
    fireBullet() {
        // Get bullet from pool or create a new one
        let bullet;
        if (this.bulletPool.length > 0) {
            bullet = this.bulletPool.pop();
        } else {
            bullet = this.createBullet();
        }
        
        // Set bullet position and orientation
        const startPosition = new THREE.Vector3();
        const direction = new THREE.Vector3();
        
        if (this.player.isLocal && this.camera) {
            // Use camera for accurate aiming
            this.camera.getWorldPosition(startPosition);
            this.camera.getWorldDirection(direction);
            
            // Add a bit of randomness for bullet spread
            const spread = CONFIG.WEAPON.SPREAD;
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.z += (Math.random() - 0.5) * spread;
            direction.normalize();
            
            // Move bullet start position slightly forward from camera
            startPosition.add(direction.clone().multiplyScalar(0.5));
        } else {
            // For remote players, use player position
            startPosition.copy(this.player.position);
            startPosition.y += CONFIG.PLAYER.CAMERA_HEIGHT;
            
            // Use player's forward direction
            const forwardDir = new THREE.Vector3(0, 0, -1);
            forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.rotation.y);
            direction.copy(forwardDir);
        }
        
        // Setup bullet properties
        bullet.visible = true;
        bullet.position.copy(startPosition);
        
        // Orient bullet along trajectory
        bullet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        // Store bullet data
        const bulletData = {
            mesh: bullet,
            velocity: direction.clone().multiplyScalar(CONFIG.WEAPON.BULLET_SPEED),
            damage: CONFIG.WEAPON.DAMAGE,
            distance: 0,
            maxDistance: CONFIG.WEAPON.BULLET_RANGE,
            playerId: this.player.id,
            active: true
        };
        
        this.bullets.push(bulletData);
        
        // Send bullet info to server in multiplayer mode
        if (this.player.isLocal && this.game.networkManager.isConnected) {
            this.game.networkManager.sendShotFired({
                origin: {
                    x: startPosition.x,
                    y: startPosition.y,
                    z: startPosition.z
                },
                direction: {
                    x: direction.x,
                    y: direction.y,
                    z: direction.z
                }
            });
        }
    }
    
    /**
     * Reload the weapon
     */
    reload() {
        if (this.isReloading || this.ammo === this.maxAmmo) return;
        
        this.isReloading = true;
        this.playReloadSound();
        
        // Update UI for local player
        if (this.player.isLocal) {
            document.getElementById('ammo').textContent = 'Reloading...';
        }
        
        // Reload after delay
        setTimeout(() => {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
            
            // Update UI for local player
            if (this.player.isLocal) {
                this.updateAmmoDisplay();
            }
        }, CONFIG.WEAPON.RELOAD_TIME);
    }
    
    /**
     * Show muzzle flash briefly
     */
    showMuzzleFlash() {
        if (!this.muzzleFlash) return;
        
        this.muzzleFlash.visible = true;
        this.muzzleFlashTime = Date.now();
        
        // Random rotation for variety
        this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
        
        // Add point light for dynamic lighting effect
        if (!this.muzzleLight) {
            this.muzzleLight = new THREE.PointLight(0xFFFF00, 2, 3);
            this.muzzleLight.position.set(0, -0.05, -0.9);
            this.mesh.add(this.muzzleLight);
        }
        
        this.muzzleLight.visible = true;
        
        // Hide after a short time
        setTimeout(() => {
            this.muzzleFlash.visible = false;
            if (this.muzzleLight) this.muzzleLight.visible = false;
        }, 50);
    }
    
    /**
     * Update ammo display
     */
    updateAmmoDisplay() {
        const ammoDisplay = document.getElementById('ammo');
        if (ammoDisplay) {
            ammoDisplay.textContent = `${this.ammo} / ${this.maxAmmo}`;
        }
    }
    
    /**
     * Play sound effects
     */
    playShootSound() {
        // this.game.audioManager.playSound('gun_shot');
    }
    
    playReloadSound() {
        // this.game.audioManager.playSound('gun_reload');
    }
    
    playEmptySound() {
        // this.game.audioManager.playSound('gun_empty');
    }
    
    /**
     * Check for collision between a bullet and objects in the scene
     */
    checkBulletCollisions(bullet) {
        const raycaster = new THREE.Raycaster();
        const bulletPosition = bullet.mesh.position.clone();
        const bulletDirection = bullet.velocity.clone().normalize();
        
        // Setup raycaster from bullet's current position along its trajectory
        raycaster.set(bulletPosition, bulletDirection);
        
        // Calculate distance to check - either the remaining distance or the distance traveled this frame
        const distanceToCheck = Math.min(
            bullet.maxDistance - bullet.distance,
            bullet.velocity.length()
        );
        
        // Handle different collision types
        this.checkDroneCollisions(bullet, raycaster, distanceToCheck);
        this.checkPlayerCollisions(bullet, raycaster, distanceToCheck);
        this.checkBuildingCollisions(bullet, raycaster, distanceToCheck);
    }
    
    /**
     * Check for collisions with drones
     */
    checkDroneCollisions(bullet, raycaster, distance) {
        if (!this.game.droneManager) return;
        
        for (const drone of this.game.droneManager.drones.values()) {
            if (!drone.isAlive) continue;
            
            // Simple collision check - distance from bullet to drone center
            const bulletToDrone = drone.position.clone().sub(bullet.mesh.position);
            const projection = bulletToDrone.dot(bullet.velocity.clone().normalize());
            
            // Only check if bullet is moving toward the drone
            if (projection < 0) continue;
            
            // Create a sphere representing the drone collision area
            const droneRadius = 0.8; // Approximate drone radius
            if (bulletToDrone.lengthSq() < droneRadius * droneRadius) {
                // Bullet hit the drone
                this.game.droneManager.registerHit(drone.id, bullet.damage, bullet.playerId);
                
                // Create impact effect
                this.createImpactEffect(bullet.mesh.position.clone());
                
                // Deactivate bullet
                this.deactivateBullet(bullet);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check for collisions with other players (PvP mode)
     */
    checkPlayerCollisions(bullet, raycaster, distance) {
        // Skip if PvP is disabled or if checking own bullets
        if (!CONFIG.GAME.PVP_ENABLED || bullet.playerId === this.player.id) return false;
        
        // Skip if no player manager
        if (!this.game.playerManager) return false;
        
        // Check local player
        const localPlayer = this.game.playerManager.localPlayer;
        if (localPlayer && localPlayer.isAlive && this.checkPlayerHit(bullet, localPlayer)) {
            return true;
        }
        
        // Check remote players
        for (const player of this.game.playerManager.remotePlayers.values()) {
            if (player.isAlive && player.id !== bullet.playerId && this.checkPlayerHit(bullet, player)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if a bullet hits a specific player
     */
    checkPlayerHit(bullet, player) {
        // Skip if this is the player who fired the bullet
        if (player.id === bullet.playerId) return false;
        
        // Simple collision detection using distance
        const bulletToPlayer = player.position.clone().sub(bullet.mesh.position);
        
        // Adjust to check against player's body center (slightly higher than position)
        bulletToPlayer.y += player.height / 2;
        
        // Check distance against player hitbox
        if (bulletToPlayer.lengthSq() < (player.radius * player.radius * 2)) {
            // Bullet hit the player
            player.takeDamage(bullet.damage);
            
            // Create impact effect
            this.createImpactEffect(bullet.mesh.position.clone());
            
            // Deactivate bullet
            this.deactivateBullet(bullet);
            return true;
        }
        
        return false;
    }
    
    /**
     * Check for collisions with buildings
     */
    checkBuildingCollisions(bullet, raycaster, distance) {
        // Collect all building meshes from the city
        const buildings = [];
        this.scene.traverse((object) => {
            if (object.isMesh && object.name && object.name.startsWith('building_')) {
                buildings.push(object);
            }
        });
        
        // Fast check if no buildings
        if (buildings.length === 0) return false;
        
        // Perform raycast
        const intersects = raycaster.intersectObjects(buildings, false);
        
        if (intersects.length > 0 && intersects[0].distance < distance) {
            // Create impact effect at the hit point
            this.createImpactEffect(intersects[0].point);
            
            // Deactivate bullet
            this.deactivateBullet(bullet);
            return true;
        }
        
        return false;
    }
    
    /**
     * Create an impact effect at the specified position
     */
    createImpactEffect(position) {
        // Create a small particle burst
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFAA00,
            size: 0.1,
            transparent: true,
            opacity: 1
        });
        
        // Random positions for particles around impact point
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Random position offset
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            // Set positions
            positions[i * 3] = position.x + offset.x;
            positions[i * 3 + 1] = position.y + offset.y;
            positions[i * 3 + 2] = position.z + offset.z;
            
            // Random velocities
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ));
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Play impact sound
        // this.game.audioManager.playSound('bullet_impact', 0.3);
        
        // Animate particles
        let aliveTime = 0;
        const lifetime = 0.5; // half a second
        
        const animate = (deltaTime) => {
            aliveTime += deltaTime;
            
            // Update particle positions
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x * deltaTime;
                positions[i * 3 + 1] += velocities[i].y * deltaTime;
                positions[i * 3 + 2] += velocities[i].z * deltaTime;
                
                // Add gravity
                velocities[i].y -= 5 * deltaTime;
            }
            
            particleGeometry.attributes.position.needsUpdate = true;
            
            // Fade out
            particleMaterial.opacity = 1 - (aliveTime / lifetime);
            
            // Remove when animation complete
            if (aliveTime >= lifetime) {
                this.scene.remove(particles);
                particleGeometry.dispose();
                particleMaterial.dispose();
                return false;
            }
            
            return true;
        };
        
        // Add to animation loop
        this.game.addAnimation(animate);
    }
    
    /**
     * Deactivate a bullet and return it to the pool
     */
    deactivateBullet(bullet) {
        bullet.active = false;
        bullet.mesh.visible = false;
        this.bulletPool.push(bullet.mesh);
        
        // Remove from active bullets array
        const index = this.bullets.indexOf(bullet);
        if (index !== -1) {
            this.bullets.splice(index, 1);
        }
    }
    
    /**
     * Update bullet physics
     */
    updateBullets(deltaTime) {
        // Update each active bullet
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Skip inactive bullets
            if (!bullet.active) continue;
            
            // Update position
            const movement = bullet.velocity.clone().multiplyScalar(deltaTime);
            bullet.mesh.position.add(movement);
            
            // Update distance traveled
            bullet.distance += movement.length();
            
            // Check for collisions
            this.checkBulletCollisions(bullet);
            
            // Check if bullet has reached max distance
            if (bullet.distance >= bullet.maxDistance) {
                this.deactivateBullet(bullet);
                continue;
            }
            
            // Update bullet trail
            const trail = bullet.mesh.children[0];
            if (trail && trail.geometry) {
                const positions = trail.geometry.attributes.position.array;
                
                // Shift all points backward (away from bullet)
                for (let j = positions.length - 3; j >= 3; j -= 3) {
                    positions[j] = positions[j - 3];
                    positions[j + 1] = positions[j - 2];
                    positions[j + 2] = positions[j - 1];
                }
                
                // Set first point to current position
                positions[0] = 0;
                positions[1] = 0;
                positions[2] = 0;
                
                trail.geometry.attributes.position.needsUpdate = true;
            }
        }
    }
    
    /**
     * Update weapon state
     */
    update(deltaTime) {
        // Update bullets
        this.updateBullets(deltaTime);
        
        // Animate weapon
        if (this.mesh) {
            // Add weapon sway based on movement
            if (this.player.isLocal) {
                const swayAmount = 0.002;
                const now = Date.now() / 1000;
                
                // Natural sway
                const sway = {
                    x: Math.sin(now * 2) * swayAmount,
                    y: Math.cos(now * 1.5) * swayAmount
                };
                
                // Add player movement effect
                if (this.player.moveForward || this.player.moveBackward || 
                    this.player.moveLeft || this.player.moveRight) {
                    sway.x += Math.sin(now * 10) * swayAmount * 2;
                    sway.y += Math.cos(now * 10) * swayAmount;
                }
                
                // Apply sway
                this.mesh.position.x = 0.25 + sway.x;
                this.mesh.position.y = -0.2 + sway.y;
            }
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Remove weapon model
        if (this.mesh) {
            if (this.player.isLocal && this.camera) {
                this.camera.remove(this.mesh);
            } else {
                this.scene.remove(this.mesh);
            }
            
            this.mesh.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            
            this.mesh = null;
        }
        
        // Clean up bullets
        for (const bullet of this.bullets) {
            this.scene.remove(bullet.mesh);
            bullet.mesh.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        }
        
        this.bullets = [];
        
        // Clean up bullet pool
        for (const bullet of this.bulletPool) {
            this.scene.remove(bullet);
            bullet.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        }
        
        this.bulletPool = [];
        
        // Clean up muzzle flash
        if (this.muzzleFlash) {
            if (this.mesh) this.mesh.remove(this.muzzleFlash);
            if (this.muzzleFlash.geometry) this.muzzleFlash.geometry.dispose();
            if (this.muzzleFlash.material) this.muzzleFlash.material.dispose();
            this.muzzleFlash = null;
        }
        
        // Clean up muzzle light
        if (this.muzzleLight) {
            if (this.mesh) this.mesh.remove(this.muzzleLight);
            this.muzzleLight = null;
        }
    }
} 