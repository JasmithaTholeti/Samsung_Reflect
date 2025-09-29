# Backend – Samsung Reflect 

## 1. Overview

The `backend` directory implements the core **API, data processing, and routing** for Samsung Reflect. It exposes REST endpoints for journals, media, insights, and advanced AI-powered image search.

The backend acts as the central orchestrator, connecting to:

* **MongoDB** for persistent data storage (via Mongoose ODM).
* **Redis** for high-performance job queueing (BullMQ) to handle asynchronous tasks.
* **Qdrant** for vector search, enabling semantic image similarity.
* The separate **ML Service** for AI analysis (YOLO, CLIP, Places365).

It manages file processing, analytics, and orchestrates the entire image analysis pipeline.

***

## 2. Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Runtime** | **Node.js (TypeScript)** | Server environment and language. |
| **Framework** | **Express** | API routing and middleware foundation. |
| **Database** | **MongoDB (Mongoose ODM)** | Primary data persistence and schema definition. |
| **Job Queue** | **BullMQ with Redis** | Manages asynchronous tasks (e.g., image analysis). |
| **Vector Search** | **Qdrant** | High-performance vector database for image embeddings. |
| **File Processing** | **Sharp** | Image manipulation and processing before analysis/storage. |
| **API Design** | **RESTful** | Modular routes with comprehensive error handling. |

***

## 3. Prerequisites

To run the backend locally, you need:

* **Node.js 18+** installed on your system.
* The following external services running: **MongoDB, Redis, and Qdrant**. These are typically run locally via Docker (see the root project `README` for `docker-compose` instructions).

***

## 4. Installation & Setup

Follow these steps to get the backend API server running locally:

```bash
# Navigate into the backend directory from the project root
cd backend

# 4.1. Install dependencies (Dependencies are listed in package.json)
npm install

# 4.2. Copy environment example for configuration
cp .env.example .env
# Edit .env with your configuration (MongoDB URI, Redis URL, Qdrant URL, etc.)

# 4.3. Start the API server with hot-reloading
npm run dev
```

## 5. Key API Endpoints

The backend exposes the following primary REST endpoints:

### Core Functionality

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check. |
| `POST` | `/api/entries` | Create a new journal entry. |
| `GET` | `/api/entries` | List journal entries. |
| `POST` | `/api/media` | Upload media files (deprecated in favor of AI upload). |
| `GET` | `/api/insights` | Retrieve analytics and insights data. |

### AI and Search Functionality

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/images/upload` | Upload image for asynchronous AI analysis. |
| `GET` | `/api/images/:id` | Get image data including detection results. |
| `POST` | `/api/search` | Text-based image search using CLIP embeddings. |
| `POST` | `/api/search/similar/:imageId` | Find visually similar images (vector search). |
| `GET` | `/api/models/health` | Get the status of external ML models. |

## 6. Testing

To run unit and integration tests for the backend:

```bash
npm test
```

## 7. Developer Notes 

This section outlines important conventions and internal architectural details:

1.  **Directory Structure:**
    * `src/models/`: Mongoose data models (Journals, Media, etc.).
    * `src/routes/`: Express route definitions (API endpoints).
    * `src/services/`: Business logic, job queue handlers, integration with Qdrant and ML service.
    * `src/middleware/`: Express middleware (auth, error handling, etc.).
    * `src/utils/`: Utility functions.
2.  **Job Queue:** **BullMQ** jobs are managed in `src/services/` and require a running Redis instance. The queue is used exclusively for asynchronous, heavy tasks like image analysis.
3.  **File Processing:** Images are processed using the **Sharp** library for resizing and optimization *before* analysis or storage.
4.  **Vector Search:** **Qdrant** integration is handled via services for high-performance semantic search on image embeddings.
5.  **Hot Reload:** For development, the `npm run dev` command uses a watcher for instant code reloads.
6.  **Error Handling:** All routes implement structured error responses to provide clear feedback to the frontend client.

For ML service details, frontend instructions, or full deployment guides, see the main project `README`.
