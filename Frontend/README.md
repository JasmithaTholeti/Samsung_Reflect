# SamsungReflect
# Frontend – Samsung Reflect 

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

## 4. Installation & Setup

Follow these steps to get the frontend development server running locally:

```bash
# Navigate into the frontend directory from the project root
cd Frontend

# 4.1. Install dependencies (Dependencies are listed in package.json)
npm install

# 4.2. Copy environment example if required
cp .env.example .env
# Edit .env with your configuration (e.g., if the backend is on a different port)

# 4.3. Start the development server
npm run dev
```


