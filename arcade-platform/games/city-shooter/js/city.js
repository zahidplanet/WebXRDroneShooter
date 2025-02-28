/**
 * City Drone Shooter - City Generator
 * Creates a procedural city environment with buildings and streets
 */

class CityGenerator {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.buildings = [];
        this.streetLights = [];
        this.spawnPoints = [];
        this.isMobile = game.isMobile;
        this.buildingMaterials = []; // Cache materials
        
        // ULTRA-SIMPLIFIED mode for mobile to ensure it loads
        this.ultraSimplified = this.isMobile;
    }
    
    /**
     * Generate the entire city
     */
    generateCity() {
        // Create ground and skybox first
        this.createGround();
        this.createSkybox();
        
        if (this.ultraSimplified) {
            // Use super simplified city for mobile
            this.createSimplifiedCity();
        } else {
            // Normal city for desktop
            this.createBuildings();
            this.createStreetLights();
        }
        
        this.createSpawnPoints();
        this.addFog();
        this.addLighting();
        
        console.log(`City created with ${this.buildings.length} buildings`);
    }
    
    /**
     * Create a very simplified city for mobile devices
     */
    createSimplifiedCity() {
        console.log("Creating ultra-simplified city for mobile");
        
        // Create materials cache if not created yet
        if (this.buildingMaterials.length === 0) {
            this.createSimplifiedMaterials();
        }
        
        const citySize = CONFIG.CITY.SIZE;
        
        // Create just a few buildings in a simple grid
        const numBuildingsPerSide = 6; // 6x6 grid = 36 buildings max
        const spacing = citySize / numBuildingsPerSide;
        
        let buildingCount = 0;
        const maxBuildings = 20; // Hard limit for mobile
        
        // Create buildings in a grid pattern
        for (let x = -citySize/2 + spacing/2; x < citySize/2 && buildingCount < maxBuildings; x += spacing) {
            for (let z = -citySize/2 + spacing/2; z < citySize/2 && buildingCount < maxBuildings; z += spacing) {
                // Skip some grid positions for variety (70% chance to create a building)
                if (Math.random() < 0.3) continue;
                
                // Vary building size
                const buildingWidth = spacing * 0.7;
                const buildingDepth = spacing * 0.7;
                
                // Simple height variation
                const buildingHeight = 5 + Math.random() * 15;
                
                // Create a simplified building - use box geometry with basic material
                const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
                const materialIndex = Math.floor(Math.random() * this.buildingMaterials.length);
                const building = new THREE.Mesh(buildingGeometry, this.buildingMaterials[materialIndex]);
                
                building.position.set(
                    x,
                    buildingHeight / 2,
                    z
                );
                
                building.castShadow = false;
                building.receiveShadow = false;
                building.name = `building_${buildingCount}`;
                
                this.scene.add(building);
                this.buildings.push(building);
                buildingCount++;
            }
        }
        
        // Create just a few street lights (much fewer than normal)
        this.createSimplifiedStreetLights(numBuildingsPerSide);
        
        console.log(`Created simplified city with ${buildingCount} buildings`);
    }
    
    /**
     * Create simplified materials for mobile
     */
    createSimplifiedMaterials() {
        // Just two materials for buildings to reduce state changes
        this.buildingMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x555555 }), // Gray
            new THREE.MeshBasicMaterial({ color: 0x333333 })  // Dark gray
        ];
    }
    
    /**
     * Create simplified street lights for mobile
     */
    createSimplifiedStreetLights(gridSize) {
        const citySize = CONFIG.CITY.SIZE;
        const spacing = citySize / gridSize;
        
        // Unified materials for all lights to reduce draw calls
        const poleMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFAA });
        
        // Create lights at grid intersections
        const numLights = 4; // Just a few lights for mobile
        const lightPositions = [];
        
        // Add lights at key positions
        for (let i = 0; i < numLights; i++) {
            // Distribute lights around the center
            const angle = (i / numLights) * Math.PI * 2;
            const radius = citySize / 4;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            lightPositions.push({ x, z });
        }
        
        // Create the lights
        for (const pos of lightPositions) {
            // Simple pole
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 4);
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 3, pos.z);
            this.scene.add(pole);
            
            // Simple bulb
            const bulbGeometry = new THREE.SphereGeometry(0.5, 4, 4);
            const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
            bulb.position.set(pos.x, 6, pos.z);
            this.scene.add(bulb);
            
            // Add a point light
            const light = new THREE.PointLight(0xFFFFAA, 1, 50);
            light.position.set(pos.x, 6, pos.z);
            light.castShadow = false;
            this.scene.add(light);
            
            this.streetLights.push({ pole, bulb, light });
        }
    }
    
    /**
     * Create the ground plane
     */
    createGround() {
        const citySize = CONFIG.CITY.SIZE;
        
        // Create ground with simplified material on mobile
        const groundGeometry = new THREE.PlaneGeometry(citySize, citySize);
        const groundMaterial = this.isMobile ? 
            new THREE.MeshBasicMaterial({ color: CONFIG.CITY.GROUND_COLOR }) : 
            new THREE.MeshStandardMaterial({
                color: CONFIG.CITY.GROUND_COLOR,
                roughness: 0.8,
                metalness: 0.2
            });
        
        // Create ground mesh
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = 0;
        ground.receiveShadow = !this.isMobile;
        
        // Add ground to scene
        this.scene.add(ground);
        
        // Create a grid of streets (simplified on mobile)
        if (this.isMobile) {
            this.createSimplifiedStreets();
        } else {
            this.createStreets();
        }
    }
    
    /**
     * Create simplified streets for mobile
     */
    createSimplifiedStreets() {
        const citySize = CONFIG.CITY.SIZE;
        const streetWidth = 10;
        
        // Just create two crossing streets
        const streetMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        
        // North-South street
        const nsStreetGeometry = new THREE.PlaneGeometry(streetWidth, citySize);
        const nsStreet = new THREE.Mesh(nsStreetGeometry, streetMaterial);
        nsStreet.rotation.x = -Math.PI / 2; // Horizontal
        nsStreet.position.set(0, 0.05, 0);
        this.scene.add(nsStreet);
        
        // East-West street
        const ewStreetGeometry = new THREE.PlaneGeometry(citySize, streetWidth);
        const ewStreet = new THREE.Mesh(ewStreetGeometry, streetMaterial);
        ewStreet.rotation.x = -Math.PI / 2; // Horizontal
        ewStreet.position.set(0, 0.05, 0);
        this.scene.add(ewStreet);
        
        // Add minimal street markings
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        // Center line for NS street
        const nsLineGeometry = new THREE.PlaneGeometry(0.5, citySize);
        const nsLine = new THREE.Mesh(nsLineGeometry, markingMaterial);
        nsLine.rotation.x = -Math.PI / 2;
        nsLine.position.set(0, 0.06, 0);
        this.scene.add(nsLine);
        
        // Center line for EW street
        const ewLineGeometry = new THREE.PlaneGeometry(citySize, 0.5);
        const ewLine = new THREE.Mesh(ewLineGeometry, markingMaterial);
        ewLine.rotation.x = -Math.PI / 2;
        ewLine.position.set(0, 0.06, 0);
        this.scene.add(ewLine);
    }
    
    /**
     * Create a skybox for the scene
     */
    createSkybox() {
        // Simpler skybox on mobile
        const segments = this.isMobile ? 16 : 32;
        
        // Create a large sphere to serve as the sky
        const skyGeometry = new THREE.SphereGeometry(CONFIG.CITY.SIZE, segments, segments);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.CITY.SKY_COLOR,
            side: THREE.BackSide // Render on the inside of the sphere
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    /**
     * Add fog to the scene
     */
    addFog() {
        // Skip fog on mobile for better performance
        if (!this.isMobile) {
            this.scene.fog = new THREE.FogExp2(0xCCCCCC, CONFIG.CITY.FOG_DENSITY);
        }
    }
    
    /**
     * Add lighting to the scene
     */
    addLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, CONFIG.CITY.AMBIENT_LIGHT_INTENSITY);
        this.scene.add(ambientLight);
        
        // On mobile, skip directional light and shadows
        if (!this.isMobile) {
            // Add directional light (sun)
            const sunlight = new THREE.DirectionalLight(0xFFFFFF, CONFIG.CITY.SUN_LIGHT_INTENSITY);
            sunlight.position.set(200, 400, 300);
            sunlight.castShadow = true;
            
            // Configure shadow properties
            sunlight.shadow.mapSize.width = CONFIG.RENDER.SHADOW_MAP_SIZE;
            sunlight.shadow.mapSize.height = CONFIG.RENDER.SHADOW_MAP_SIZE;
            const shadowSize = CONFIG.CITY.SIZE / 2;
            sunlight.shadow.camera.left = -shadowSize;
            sunlight.shadow.camera.right = shadowSize;
            sunlight.shadow.camera.top = shadowSize;
            sunlight.shadow.camera.bottom = -shadowSize;
            sunlight.shadow.camera.near = 1;
            sunlight.shadow.camera.far = 1000;
            
            this.scene.add(sunlight);
        }
    }
    
    /**
     * Create spawn points for players
     */
    createSpawnPoints() {
        const citySize = CONFIG.CITY.SIZE;
        // Fewer spawn points on mobile
        const numSpawnPoints = this.isMobile ? 5 : 20;
        
        for (let i = 0; i < numSpawnPoints; i++) {
            let spawnPoint;
            
            if (i < (numSpawnPoints/2) && this.buildings.length > 0 && !this.isMobile) {
                // Rooftop spawn points (only on desktop)
                const randomBuildingIndex = Math.floor(Math.random() * this.buildings.length);
                const building = this.buildings[randomBuildingIndex];
                
                // Get building dimensions
                const buildingSize = new THREE.Vector3();
                building.geometry.computeBoundingBox();
                building.geometry.boundingBox.getSize(buildingSize);
                
                spawnPoint = new THREE.Vector3(
                    building.position.x,
                    building.position.y + buildingSize.y/2 + 1, // On top of building with a small offset
                    building.position.z
                );
            } else {
                // Street-level spawn points
                spawnPoint = new THREE.Vector3(
                    (Math.random() - 0.5) * citySize * 0.9,
                    1.8, // Player height
                    (Math.random() - 0.5) * citySize * 0.9
                );
            }
            
            this.spawnPoints.push(spawnPoint);
        }
    }
    
    /**
     * Check for collisions with buildings
     */
    checkCollision(position, radius = 1) {
        // Simplified collision detection for mobile
        if (this.isMobile) {
            for (const building of this.buildings) {
                const dx = position.x - building.position.x;
                const dz = position.z - building.position.z;
                const distance = Math.sqrt(dx*dx + dz*dz);
                
                // Get building dimensions (simplified as box)
                const size = new THREE.Vector3();
                building.geometry.computeBoundingBox();
                building.geometry.boundingBox.getSize(size);
                
                // Simple radius check
                if (distance < (Math.max(size.x, size.z)/2 + radius)) {
                    return true;
                }
            }
            return false;
        }
        
        // Original collision detection for desktop
        for (const building of this.buildings) {
            const buildingBox = new THREE.Box3().setFromObject(building);
            
            // Expand box by radius for character collision
            buildingBox.min.x -= radius;
            buildingBox.min.z -= radius;
            buildingBox.max.x += radius;
            buildingBox.max.z += radius;
            
            // Only check X and Z coordinates
            if (position.x >= buildingBox.min.x && position.x <= buildingBox.max.x &&
                position.z >= buildingBox.min.z && position.z <= buildingBox.max.z) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get a random spawn point
     */
    getRandomSpawnPoint() {
        if (this.spawnPoints.length === 0) return new THREE.Vector3(0, 2, 0);
        const index = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[index].clone();
    }
    
    /**
     * Create buildings throughout the city
     */
    createBuildings() {
        const citySize = CONFIG.CITY.SIZE;
        const blockSize = CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = CONFIG.CITY.STREET_WIDTH;
        
        // Create building materials if not already created
        if (this.buildingMaterials.length === 0) {
            this.createBuildingMaterials();
        }
        
        // Create buildings at grid positions with variations
        for (let x = -citySize/2 + blockSize/2; x < citySize/2; x += blockSize + streetWidth) {
            for (let z = -citySize/2 + blockSize/2; z < citySize/2; z += blockSize + streetWidth) {
                
                // Skip some grid positions to create empty lots and variation
                if (Math.random() < 0.2) continue;
                
                // Create a building at this position
                this.createSingleBuilding(x, z);
            }
        }
        
        console.log(`Created ${this.buildings.length} buildings`);
    }
    
    /**
     * Create a single building at the specified position
     */
    createSingleBuilding(x, z) {
        const blockSize = CONFIG.CITY.BLOCK_SIZE;
            
        // Vary building size
        const buildingWidth = blockSize * (0.5 + Math.random() * 0.5);
        const buildingDepth = blockSize * (0.5 + Math.random() * 0.5);
        
        // Vary building height
        const minHeight = CONFIG.CITY.MIN_BUILDING_HEIGHT;
        const maxHeight = CONFIG.CITY.MAX_BUILDING_HEIGHT;
        let buildingHeight;
        
        // Create height variation with some probability of tall buildings
        if (Math.random() < 0.1) {
            // Tall skyscraper
            buildingHeight = maxHeight * 0.7 + Math.random() * (maxHeight * 0.3);
        } else if (Math.random() < 0.3) {
            // Medium building
            buildingHeight = minHeight + Math.random() * (maxHeight - minHeight) * 0.6;
        } else {
            // Shorter building
            buildingHeight = minHeight + Math.random() * (maxHeight - minHeight) * 0.3;
        }
        
        // Create building geometry
        const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
        
        // Use a random material from our selection
        const materialIndex = Math.floor(Math.random() * this.buildingMaterials.length);
        const buildingMaterial = this.buildingMaterials[materialIndex];
        
        // Create building mesh
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(
            x + (Math.random() - 0.5) * (blockSize - buildingWidth),  // Add some position variation 
            buildingHeight / 2, // Position at ground level with height/2 offset for center
            z + (Math.random() - 0.5) * (blockSize - buildingDepth)
        );
        
        building.castShadow = CONFIG.RENDERING.SHADOWS;
        building.receiveShadow = CONFIG.RENDERING.SHADOWS;
        building.name = `building_${this.buildings.length}`;
        
        // Add building to scene
        this.scene.add(building);
        this.buildings.push(building);
        
        // Add windows to the building (skip on low-end mobile devices)
        if (!this.isMobile || Math.random() < 0.3) { // Only add windows to 30% of buildings on mobile
            this.addWindowsToBuilding(building, buildingWidth, buildingHeight, buildingDepth);
        }
        
        return building;
    }
    
    /**
     * Add windows to a building
     */
    addWindowsToBuilding(building, width, height, depth, windowMaterial) {
        // ... [existing window creation code remains the same] 
        
        // On mobile, reduce the number of windows per building
        const windowSize = 1.2;
        const windowSpacing = this.isMobile ? 4 : 3; // Increased spacing on mobile = fewer windows
        const windowDepth = 0.1;
        
        // ... [rest of the code remains the same]
    }
    
    /**
     * Create street lights along streets
     */
    createStreetLights() {
        const citySize = CONFIG.CITY.SIZE;
        const blockSize = CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = CONFIG.CITY.STREET_WIDTH;
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Light bulb material (emissive)
        const lightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFAA,
            emissive: 0xFFFFAA,
            emissiveIntensity: 1.0
        });
        
        // Place street lights at intersections
        for (let x = -citySize/2 + blockSize; x < citySize/2; x += blockSize + streetWidth) {
            for (let z = -citySize/2 + blockSize; z < citySize/2; z += blockSize + streetWidth) {
                
                // Create a street light
                const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
                const pole = new THREE.Mesh(poleGeometry, lampMaterial);
                pole.position.set(x + streetWidth/2, 3, z + streetWidth/2);
                pole.castShadow = true;
                this.scene.add(pole);
                
                // Add light bulb
                const bulbGeometry = new THREE.SphereGeometry(0.5, 16, 16);
                const bulb = new THREE.Mesh(bulbGeometry, lightMaterial);
                bulb.position.set(x + streetWidth/2, 6, z + streetWidth/2);
                this.scene.add(bulb);
                
                // Add actual light source
                const light = new THREE.PointLight(0xFFFFAA, 1, 30);
                light.position.set(x + streetWidth/2, 6, z + streetWidth/2);
                light.castShadow = true;
                light.shadow.mapSize.width = 512;
                light.shadow.mapSize.height = 512;
                this.scene.add(light);
                
                this.streetLights.push({ pole, bulb, light });
            }
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        // Remove all objects from scene and dispose of geometries/materials
        for (const building of this.buildings) {
            this.scene.remove(building);
            building.geometry.dispose();
            if (Array.isArray(building.material)) {
                building.material.forEach(material => material.dispose());
            } else {
                building.material.dispose();
            }
        }
        
        for (const { pole, bulb, light } of this.streetLights) {
            this.scene.remove(pole, bulb, light);
            pole.geometry.dispose();
            pole.material.dispose();
            bulb.geometry.dispose();
            bulb.material.dispose();
        }
        
        this.buildings = [];
        this.streetLights = [];
        this.spawnPoints = [];
    }
} 