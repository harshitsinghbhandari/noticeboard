# Noticeboard

A real-time noticeboard application built with React, Node.js, and PostgreSQL.

## Features

- **Real-time Updates**: Powered by Socket.io.
- **Authentication**: Secure login with Keycloak integration.
- **Responsive Design**: Modern UI built with TailwindCSS.
- **RESTful API**: Express-based backend.

## Tech Stack

### Frontend
- React
- Vite
- TailwindCSS
- Axios
- Socket.io Client

### Backend
- Node.js
- Express
- PostgreSQL
- Socket.io
- TypeScript

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL
- Keycloak (for authentication)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd noticeboard
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    # Create a .env file based on your configuration
    npm run start
    ```

3.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Scripts

- `npm run dev`: Start frontend development server.
- `npm run start`: Start backend server.
- `npm run build`: Build for production.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.