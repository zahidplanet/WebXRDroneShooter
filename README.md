# WebXR Drone Shooter

A cross-platform AR shared experience that allows mobile and Quest headset users to collaborate in the same AR space to shoot down virtual drones.

## Project Overview

This project is built using Unity with the following key technologies:
- AR Foundation for cross-platform AR support
- Photon PUN 2 for networking and synchronization
- ARCore Extensions for Cloud Anchors (spatial alignment)
- XR Interaction Toolkit for Quest controller input

The experience enables:
- Co-location of multiple devices in the same AR space
- Shared environmental meshing and collision detection
- Synchronized enemy spawning and state management
- Device-specific input methods (tap-to-shoot on mobile, controller-based shooting on Quest)

## Development Roadmap

This project is being developed in phases:

1. **Phase 1: Integration Setup**
   - Photon & AR Foundation integration for mobile and Quest
   - Cloud Anchor setup for spatial alignment

2. **Phase 2: Core Functionality**
   - Meshing system with shared collision
   - Input & shooting mechanics implementation
   - Enemy wave spawner with network synchronization

3. **Phase 3: Polish & Optimization**
   - Room & scene management for co-location
   - Testing & debugging framework
   - Documentation & onboarding guide

## Getting Started

### Prerequisites
- Unity 2023.2 or newer
- AR Foundation 6.0
- Photon PUN 2 (you'll need your own Photon App ID)
- For Android: Google ARCore XR Plugin
- For iOS: Apple ARKit XR Plugin
- For Quest: Unity OpenXR Meta package

### Setup Instructions
1. Clone this repository
2. Open the project in Unity 2023.2+
3. Import the required packages via the Package Manager
4. Configure Photon with your App ID using the PUN Wizard
5. Build for your target platform (Android, iOS, or Quest)

## Testing
- Mobile: Enable AR Foundation and ARCore/ARKit
- Quest: Enable OpenXR and the Meta XR packages

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License
This project is licensed under the terms specified in [LICENSE.md](LICENSE.md).
