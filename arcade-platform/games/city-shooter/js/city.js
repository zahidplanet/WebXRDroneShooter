/**
 * City Drone Shooter - City Generator
 * Creates a procedural city environment with buildings and streets
 */

class CityGenerator {
    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.streetLights = [];
        this.spawnPoints = [];
    }
    
    /**
     * Generate the entire city
     */
    generateCity() {
        this.createGround();
        this.createSkybox();
        this.createBuildings();
        this.createStreetLights();
        this.createSpawnPoints();
        this.addFog();
        this.addLighting();
    }
    
    /**
     * Create the ground plane
     */
    createGround() {
        const citySize = CONFIG.CITY.SIZE;
        
        // Create ground geometry and material
        const groundGeometry = new THREE.PlaneGeometry(citySize, citySize);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.CITY.GROUND_COLOR,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create ground mesh
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = 0;
        ground.receiveShadow = true;
        
        // Add ground to scene
        this.scene.add(ground);
        
        // Create a grid of streets
        this.createStreets();
    }
    
    /**
     * Create streets in a grid pattern
     */
    createStreets() {
        const citySize = CONFIG.CITY.SIZE;
        const blockSize = CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = CONFIG.CITY.STREET_WIDTH;
        const streets = [];
        
        // Material for streets
        const streetMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create north-south streets
        for (let x = -citySize/2 + blockSize; x < citySize/2; x += blockSize + streetWidth) {
            const streetGeometry = new THREE.PlaneGeometry(streetWidth, citySize);
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2; // Horizontal
            street.position.set(x, 0.05, 0); // Slightly above ground to prevent z-fighting
            street.receiveShadow = true;
            streets.push(street);
            this.scene.add(street);
        }
        
        // Create east-west streets
        for (let z = -citySize/2 + blockSize; z < citySize/2; z += blockSize + streetWidth) {
            const streetGeometry = new THREE.PlaneGeometry(citySize, streetWidth);
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2; // Horizontal
            street.position.set(0, 0.05, z); // Slightly above ground to prevent z-fighting
            street.receiveShadow = true;
            streets.push(street);
            this.scene.add(street);
        }
        
        // Add street markings
        this.addStreetMarkings(streets);
    }
    
    /**
     * Add markings to streets (centerlines, crosswalks, etc.)
     */
    addStreetMarkings(streets) {
        const citySize = CONFIG.CITY.SIZE;
        const blockSize = CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = CONFIG.CITY.STREET_WIDTH;
        
        // Material for street markings
        const markingMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF
        });
        
        // Create centerlines for north-south streets
        for (let x = -citySize/2 + blockSize; x < citySize/2; x += blockSize + streetWidth) {
            const lineGeometry = new THREE.PlaneGeometry(0.5, citySize);
            const line = new THREE.Mesh(lineGeometry, markingMaterial);
            line.rotation.x = -Math.PI / 2; // Horizontal
            line.position.set(x, 0.06, 0); // Slightly above street
            this.scene.add(line);
        }
        
        // Create centerlines for east-west streets
        for (let z = -citySize/2 + blockSize; z < citySize/2; z += blockSize + streetWidth) {
            const lineGeometry = new THREE.PlaneGeometry(citySize, 0.5);
            const line = new THREE.Mesh(lineGeometry, markingMaterial);
            line.rotation.x = -Math.PI / 2; // Horizontal
            line.position.set(0, 0.06, z); // Slightly above street
            this.scene.add(line);
        }
        
        // Create crosswalks at intersections
        for (let x = -citySize/2 + blockSize; x < citySize/2; x += blockSize + streetWidth) {
            for (let z = -citySize/2 + blockSize; z < citySize/2; z += blockSize + streetWidth) {
                // Create crosswalks in each direction
                for (let dir = 0; dir < 4; dir++) {
                    const crosswalkGeometry = new THREE.PlaneGeometry(streetWidth - 2, 5);
                    const crosswalk = new THREE.Mesh(crosswalkGeometry, markingMaterial);
                    crosswalk.rotation.x = -Math.PI / 2; // Horizontal
                    
                    // Position based on direction
                    let posX = x;
                    let posZ = z;
                    let rotY = 0;
                    
                    if (dir === 0) { // North
                        posZ -= 7;
                    } else if (dir === 1) { // East
                        posX += 7;
                        rotY = Math.PI / 2;
                    } else if (dir === 2) { // South
                        posZ += 7;
                    } else { // West
                        posX -= 7;
                        rotY = Math.PI / 2;
                    }
                    
                    crosswalk.rotation.y = rotY;
                    crosswalk.position.set(posX, 0.07, posZ); // Slightly above centerlines
                    this.scene.add(crosswalk);
                }
            }
        }
    }
    
    /**
     * Create a skybox for the scene
     */
    createSkybox() {
        // Create a large sphere to serve as the sky
        const skyGeometry = new THREE.SphereGeometry(CONFIG.CITY.SIZE, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.CITY.SKY_COLOR,
            side: THREE.BackSide // Render on the inside of the sphere
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    /**
     * Create buildings throughout the city
     */
    createBuildings() {
        const citySize = CONFIG.CITY.SIZE;
        const blockSize = CONFIG.CITY.BLOCK_SIZE;
        const streetWidth = CONFIG.CITY.STREET_WIDTH;
        const buildingCount = CONFIG.CITY.BUILDING_COUNT;
        
        // Create a reusable geometry for buildings
        const buildingMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.2 }), // Gray
            new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.3 }), // Dark gray
            new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8, metalness: 0.1 }), // Light gray
            new THREE.MeshStandardMaterial({ color: 0x775533, roughness: 0.7, metalness: 0.0 })  // Brown
        ];
        
        // Window material (emissive for nighttime)
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFF99,
            emissiveIntensity: 0.2,
            roughness: 0.5,
            metalness: 0.8
        });
        
        // Create buildings at grid positions with variations
        for (let x = -citySize/2 + blockSize/2; x < citySize/2; x += blockSize + streetWidth) {
            for (let z = -citySize/2 + blockSize/2; z < citySize/2; z += blockSize + streetWidth) {
                
                // Skip some grid positions to create empty lots and variation
                if (Math.random() < 0.2) continue;
                
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
                const materialIndex = Math.floor(Math.random() * buildingMaterials.length);
                const buildingMaterial = buildingMaterials[materialIndex];
                
                // Create building mesh
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                building.position.set(
                    x + (Math.random() - 0.5) * (blockSize - buildingWidth),  // Add some position variation 
                    buildingHeight / 2, // Position at ground level with height/2 offset for center
                    z + (Math.random() - 0.5) * (blockSize - buildingDepth)
                );
                
                building.castShadow = true;
                building.receiveShadow = true;
                
                // Add building to scene
                this.scene.add(building);
                this.buildings.push(building);
                
                // Add windows to the building
                this.addWindowsToBuilding(building, buildingWidth, buildingHeight, buildingDepth, windowMaterial);
            }
        }
        
        console.log(`Created ${this.buildings.length} buildings`);
    }
    
    /**
     * Add windows to a building
     */
    addWindowsToBuilding(building, width, height, depth, windowMaterial) {
        const windowSize = 1.2;
        const windowSpacing = 3;
        const windowDepth = 0.1;
        
        // Calculate number of windows in each dimension
        const windowsX = Math.floor(width / windowSpacing);
        const windowsY = Math.floor(height / windowSpacing);
        const windowsZ = Math.floor(depth / windowSpacing);
        
        // Skip windows for buildings that are too small
        if (windowsX < 1 || windowsY < 2 || windowsZ < 1) return;
        
        // Window geometry (reused for all windows)
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
        
        // Create windows for each face of the building
        for (let side = 0; side < 4; side++) {
            const isXFace = side % 2 === 0;
            const maxWindows = isXFace ? windowsZ : windowsX;
            const maxWindowsY = windowsY;
            
            // Determine direction and starting position
            let position = new THREE.Vector3();
            let rotation = new THREE.Euler(0, 0, 0);
            let startX, startZ;
            
            if (side === 0) { // Front face (+Z)
                rotation.y = 0;
                startX = -width/2 + windowSpacing/2;
                position.z = depth/2 + windowDepth;
            } else if (side === 1) { // Right face (+X)
                rotation.y = Math.PI / 2;
                startZ = -depth/2 + windowSpacing/2;
                position.x = width/2 + windowDepth;
            } else if (side === 2) { // Back face (-Z)
                rotation.y = Math.PI;
                startX = -width/2 + windowSpacing/2;
                position.z = -depth/2 - windowDepth;
            } else { // Left face (-X)
                rotation.y = -Math.PI / 2;
                startZ = -depth/2 + windowSpacing/2;
                position.x = -width/2 - windowDepth;
            }
            
            // Create windows
            for (let y = 0; y < maxWindowsY; y++) {
                position.y = -height/2 + windowSpacing/2 + y * windowSpacing;
                
                for (let i = 0; i < maxWindows; i++) {
                    // Skip some windows randomly to create variety
                    if (Math.random() < 0.3) continue;
                    
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    window.rotation.copy(rotation);
                    
                    // Set window position based on side
                    if (isXFace) {
                        position.x = startX + i * windowSpacing;
                    } else {
                        position.z = startZ + i * windowSpacing;
                    }
                    
                    window.position.copy(position);
                    
                    // Add window to building
                    building.add(window);
                }
            }
        }
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
     * Create spawn points for players
     */
    createSpawnPoints() {
        const citySize = CONFIG.CITY.SIZE;
        const numSpawnPoints = 20;
        
        for (let i = 0; i < numSpawnPoints; i++) {
            // Create spawn points on rooftops and around the city
            let spawnPoint;
            
            if (i < 10 && this.buildings.length > 0) {
                // Rooftop spawn points
                const randomBuildingIndex = Math.floor(Math.random() * this.buildings.length);
                const building = this.buildings[randomBuildingIndex];
                
                // Get building dimensions
                const buildingSize = new THREE.Vector3();
                building.geometry.computeBoundingBox();
                building.geometry.boundingBox.getSize(buildingSize);
                
                spawnPoint = new THREE.Vector3(
                    building.position.x + (Math.random() - 0.5) * (buildingSize.x * 0.8),
                    building.position.y + buildingSize.y/2 + 1, // On top of building with a small offset
                    building.position.z + (Math.random() - 0.5) * (buildingSize.z * 0.8)
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
     * Add fog to the scene
     */
    addFog() {
        this.scene.fog = new THREE.FogExp2(0xCCCCCC, CONFIG.CITY.FOG_DENSITY);
    }
    
    /**
     * Add lighting to the scene
     */
    addLighting() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, CONFIG.CITY.AMBIENT_LIGHT_INTENSITY);
        this.scene.add(ambientLight);
        
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
    
    /**
     * Get a random spawn point
     */
    getRandomSpawnPoint() {
        if (this.spawnPoints.length === 0) return new THREE.Vector3(0, 2, 0);
        const index = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[index].clone();
    }
    
    /**
     * Check for collisions with buildings
     */
    checkCollision(position, radius = 1) {
        // Simplified collision detection using bounding boxes
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