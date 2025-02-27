# AR-Cade Platform

A dynamic WebXR arcade platform that hosts multiple augmented reality experiences. The platform features a central lobby that adapts to showcase available games, highlighting recently updated experiences.

## Platform Overview

The AR-Cade is built using:
- Three.js and A-Frame for WebXR experiences
- Dynamic content loading system to switch between games
- Adaptive lobby that prioritizes recently updated games
- Cross-platform compatibility for mobile devices and VR/AR headsets

## Available Experiences

### WebXR Drone Shooter
A cross-platform AR shared experience that allows mobile and Quest headset users to collaborate in the same AR space to shoot down virtual drones.

Features:
- Co-location of multiple devices in the same AR space
- Shared environmental meshing and collision detection
- Synchronized enemy spawning and state management
- Device-specific input methods (tap-to-shoot on mobile, controller-based shooting on Quest)

## Platform Architecture

The AR-Cade platform is structured as follows:
- **Lobby**: The central hub where users can browse and select available AR experiences
- **Games**: Individual AR experiences that can be launched from the lobby
  - **Drone Shooter**: The first game integrated into the platform
  - More games to be added in the future

## Dynamic Game Selection

The lobby automatically:
- Scans for available games in the repository
- Displays games in a visually appealing AR interface
- Prioritizes games based on recent updates and builds
- Provides a seamless transition between the lobby and selected games

## Development Roadmap

### Phase 1: Platform Foundation
- Set up the Three.js and A-Frame environment
- Create the dynamic lobby system
- Integrate WebXR Drone Shooter as the first game

### Phase 2: Dynamic Content System
- Develop the game discovery and prioritization system
- Create the visual AR hierarchy for game selection
- Implement seamless transitions between lobby and games

### Phase 3: Additional Games & Features
- Add more AR experiences to the platform
- Enhance lobby with user profiles and preferences
- Implement analytics to track game popularity

## Getting Started

### Prerequisites
- Web server for hosting the AR-Cade platform
- WebXR-compatible browser
- AR-capable device (smartphone, tablet, or AR headset)

### Setup Instructions
1. Clone this repository
2. Set up a local web server (or deploy to a hosting service)
3. Open the index.html file in a WebXR-compatible browser
4. Allow camera permissions when prompted

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License
This project is licensed under the terms specified in [LICENSE.md](LICENSE.md).
