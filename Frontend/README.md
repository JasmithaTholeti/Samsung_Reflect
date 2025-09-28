# SamsungReflect
# Frontend – Samsung Reflect 🚀

## 1. Overview

The `Frontend` directory provides the user interface for **Samsung Reflect**, an **AI-powered image search and journal platform**. This React-based frontend allows users to create rich journal entries, upload and analyze images, search with natural language, visualize results, and manage preferences. It communicates with the backend API (typically served at `http://localhost:3001`) for all data and AI features.

***

## 2. Architecture

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **Vite + React 18 + TypeScript** | Modern, fast development build and application foundation. |
| **Styling** | **Tailwind CSS** | Utility-first approach for rapid and flexible UI styling. |
| **UI Components** | **shadcn/ui** | Accessible, reusable, and composable UI components. |
| **State Management** | **TanStack Query** (react-query) | Efficient data fetching, caching, and state synchronization. |
| **Routing** | **React Router v6** | Declarative navigation and routing logic. |
| **Testing** | **Jest** | Framework used for unit and component testing. |

***

## 3. Prerequisites

Before starting the frontend application, ensure you have:

* **Node.js 18+** installed on your system.
* The backend services (API, ML Service, Databases) running (recommended via `docker-compose up -d` from the root directory).

***

## 4. Installation & Setup

Follow these steps to get the frontend development server running locally:

```bash
# Navigate into the frontend directory from the project root
cd Frontend

# 4.1. Install dependencies
npm install

# 4.2. Copy environment example if required
cp .env.example .env
# Edit .env with your configuration (e.g., if the backend is on a different port)

# 4.3. Start the development server
npm run dev

## 5. Features ✨

This application provides the following core and AI-powered features for users:

1.  **Journal System:** Rich text journal entries with mood tracking.
2.  **Image Upload:** Drag & drop interface, supporting large images and files.
3.  **AI-Powered Analysis:** Initiates object detection (YOLO), scene recognition (Places365), and CLIP-based semantic search via the backend.
4.  **Search Interface:** Natural language search with class and scene filters, displaying similar/related images.
5.  **Detection Overlays:** Visualizes detected objects and scenes on uploaded images.
6.  **Dashboard & Insights:** Data visualizations of journal and image analytics.
7.  **Mobile Support:** Responsive design optimized for touch and Android WebView.

***

## 6. Access

Once the development server is running, access the frontend application in your web browser at:

**$\rightarrow$ `http://localhost:5173`**

***

## 7. Testing

To run unit and component tests for the frontend:

```bash
npm test

## 8. Developer Notes 🛠️

This section provides critical information for working on the frontend code:

1.  **Tailwind CSS:** Styling is managed using a utility-first approach. All configuration, including custom themes and extensions, is defined in `tailwind.config.js`.
2.  **shadcn/ui:** Used for consistent, accessible UI components. Check their documentation for customization and usage examples.
3.  **Component Structure:**
    * Shared UI components are located in `src/components/ui/`.
    * Feature-specific UI (like AI search) is structured within `src/features/search/`.
    * Journal-specific logic is found in `src/components/journal/`.
4.  **API Communication:** All backend requests are routed to the API at port **`3001`** (check the local `.env` file for any necessary overrides).
5.  **Feature Development:** New features must be implemented as modular, testable units within the `src/features/` directory to maintain separation of concerns.
