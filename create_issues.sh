#!/bin/bash

# Issue 1: Photon & AR Foundation Integration Setup
gh issue create --title "Set Up Photon & AR Foundation Integration for Mobile and Quest" --body "## Description:
- Install AR Foundation, ARCore XR Plugin, and Oculus XR Plugin.
- Import Photon PUN 2 and configure it (enter AppId, set region, etc.).
- Integrate ARCore Extensions to enable Cloud Anchors for spatial alignment.
- Ensure devices joining the Photon room can host/resolve Cloud Anchors.

## Acceptance Criteria:
- Both mobile and Quest devices can connect to the same Photon room.
- The host device creates a Cloud Anchor, and joining devices resolve it, aligning their AR sessions.
- Debug logs confirm successful connection and Cloud Anchor sharing." --label "integration,networking,setup"

# Issue 2: Meshing System & Shared Collision Setup
gh issue create --title "Configure AR Meshing System with Shared Collision" --body "## Description:
- Set up AR Session Origin with an AR Plane Manager and AR Mesh Manager.
- Ensure that colliders are generated for the room mesh.
- Adapt the meshing so that both devices (mobile and Quest) interpret the spatial mapping in the same way based on the Cloud Anchor.

## Acceptance Criteria:
- Both devices display the same room mesh and collision geometry.
- Testing shows consistent collision detection for spawned enemies across devices." --label "AR,meshing,collision"

# Issue 3: Input & Shooting Mechanics Implementation
gh issue create --title "Implement Device-Specific Shooting Controls" --body "## Description:
- Mobile: Configure tap-to-shoot functionality.
- Quest: Integrate XR Interaction Toolkit for controller-based shooting.
- Ensure that both input methods trigger projectile instantiation and enemy hit detection.

## Acceptance Criteria:
- Mobile users can tap the screen to fire projectiles.
- Quest users can use controllers to shoot.
- Basic shooting mechanics (projectile creation, trajectory, collision) are operational and consistent across both platforms." --label "input,gameplay"

# Issue 4: Enemy Wave Spawner & Network Synchronization
gh issue create --title "Develop Enemy Wave Spawner with Photon Synchronization" --body "## Description:
- Create an enemy spawner script that uses PhotonNetwork.Instantiate for synchronized enemy creation.
- Develop a wave manager to control the timing and number of enemy waves.
- Ensure that enemy states (spawn, movement, destruction) and projectile interactions are synchronized via Photon.

## Acceptance Criteria:
- When a wave is triggered, enemies spawn simultaneously on both mobile and Quest.
- Destruction events and projectile collisions are reflected in real-time across devices.
- Photon logs confirm network instantiation and synchronization." --label "networking,gameplay,enemies"

# Issue 5: Room and Scene Management for Co-Location
gh issue create --title "Implement Co-Location Logic via Cloud Anchor and Room Management" --body "## Description:
- Develop scripts that automatically align AR sessions to the shared Cloud Anchor when joining a Photon room.
- Manage room properties so that any updates (e.g., new enemy spawns, room mesh changes) are communicated across devices.

## Acceptance Criteria:
- Devices in the same room display the same spatial environment.
- Changes (such as enemy spawns) are immediately visible and in-sync on both mobile and Quest.
- A robust error handling mechanism is in place for Cloud Anchor resolution failures." --label "AR,networking,co-location"

# Issue 6: Testing & Debugging Framework
gh issue create --title "Set Up Testing and Debugging for Shared AR Experience" --body "## Description:
- Create test cases and debug logs for each integration point (Photon connection, Cloud Anchor sharing, meshing, input, and enemy synchronization).
- Ensure both simulated and real-device testing scenarios are documented.

## Acceptance Criteria:
- All critical functions (connection, meshing, shooting, enemy behavior) have corresponding test cases.
- A checklist and log output are available to verify successful tests on both platforms." --label "testing,debugging"

# Issue 7: Documentation and Onboarding Guide
gh issue create --title "Create Detailed Documentation for Project Setup and Onboarding" --body "## Description:
- Write a comprehensive onboarding guide detailing project setup, package configurations, and testing procedures.
- Document how to add and test mobile and Quest builds, including steps for Cloud Anchor setup, Photon room joining, and troubleshooting common issues.

## Acceptance Criteria:
- Documentation is added to the repository (e.g., in a README.md or dedicated docs folder).
- New team members can follow the guide to set up their environment and run basic tests without additional assistance." --label "documentation,onboarding" 