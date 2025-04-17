# ResQ Backend ( पहिलो उद्धार )

The backend server for ResQ ( पहिलो उद्धार ), built with Node.js, Express, and Socket.IO.

## Features

- **RESTful API**

  - User authentication and authorization
  - Emergency request management
  - Service provider management
  - Location tracking endpoints

- **Real-time Communication**

  - WebSocket-based updates
  - Location broadcasting
  - Emergency room management
  - Provider-user matching

- **Database Management**
  - PostgreSQL with Drizzle ORM
  - Efficient query handling
  - Data validation and sanitization
  - Migration support

## Tech Stack

- Node.js with Express
- TypeScript
- Socket.IO for real-time communication
- PostgreSQL with Drizzle ORM
- JWT for authentication
- TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL
- Redis (optional, for session management)

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Update .env with your database credentials
   ```

3. **Run database migrations**

   ```bash
   npm run migrate
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/resq
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=development
```

## Project Structure

```
src/
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── routes/         # API routes
├── services/       # Business logic
├── socket/         # WebSocket handlers
├── db/            # Database configuration
└── utils/         # Utility functions
```

## API Documentation

The API documentation is available at `/api-docs` when running the server. It includes:

- Authentication endpoints
- User management
- Emergency request handling
- Location tracking
- Service provider management

## Real-time Features

### Socket Events

- `JOIN_EMERGENCY_ROOM`: Join an emergency response room
- `SEND_LOCATION`: Send location updates
- `UPDATE_LOCATION`: Receive location updates
- `NEED_LOCATION`: Request location updates
- `PROVIDER_FOUND`: Notify when a provider is found

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users`: User accounts
- `service_providers`: Emergency service providers
- `emergency_requests`: Emergency service requests
- `emergency_responses`: Provider responses to requests
- `locations`: Location tracking data

## Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure WebSocket connections
- Rate limiting
- CORS protection

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
# Create a new migration
npm run migrate:create

# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback
```

## Contributing

Please read our [Contributing Guidelines](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE.md) file for details.
