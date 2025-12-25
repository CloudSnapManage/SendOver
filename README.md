# SendOver P2P

SendOver is a secure, direct peer-to-peer file transfer application running entirely in the browser. It enables users to share files of any size between devices without storing data on any intermediate servers.

## Key Features

- **Serverless Data Transfer**: Files move directly between peers using WebRTC.
- **End-to-End Encryption**: Data is encrypted in transit using standard WebRTC security protocols.
- **No File Size Limits**: Stream files as large as your device memory allows.
- **Cross-Platform**: Works on any device with a modern web browser.
- **Secure Connection Rotation**: Connection IDs rotate automatically for enhanced privacy.

## Getting Started

1.  **Open the App**: Launch SendOver on both the sender and receiver devices.
2.  **Establish Connection**:
    -   **Receiver**: The app generates a 6-digit connection code.
    -   **Sender**: Enter this code to pair the devices.
3.  **Transfer**: Drag and drop files to start the transfer instantly.

## Technologies

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **P2P Protocol**: PeerJS (WebRTC)
-   **Icons**: Lucide React

## Local Development

To run the project locally:

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## Building for Local Use

To build the optimized application for use within your private local network:

1.  Run the build command:
    ```bash
    npm run build
    ```
2.  The static files will be generated in the `dist` folder. You may serve these files using a local static server (e.g., `serve -s dist`) within your private environment.

## License

**Copyright © 2025 Shrijan Paudel. All Rights Reserved.**

This software is proprietary. You are granted a limited license to use this software solely for **personal, non-commercial purposes within your own local environment** (e.g., localhost, private home network).

**Permissions:**
- You may clone and run this repository on your personal machine for private use, study, or portfolio viewing.
- You may build and run the application on a local server or private network not accessible to the general public.

**Restrictions:**
- **No Public Deployment**: You may not host, deploy, or make this application accessible via a public URL (e.g., GitHub Pages, Vercel, Netlify, AWS, or any public-facing server).
- **No Commercial Use**: You may not use this software for any commercial purpose, business, revenue generation, or financial gain.
- **No Redistribution**: You may not re-upload, share, or distribute the source code or modified versions of it to others without explicit permission.

Unauthorized public hosting or commercial exploitation of this software is strictly prohibited.