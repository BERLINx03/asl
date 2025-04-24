# ASL Backend - 1v1 Matchmaking with JWT Authentication

This backend system provides user authentication and real-time matchmaking for an ASL recognition game. Players can create matches, join existing matches, and compete to correctly sign sentences in American Sign Language.

## Features

- 🔒 **JWT Authentication**

  - Secure user registration and login
  - Role-based authorization
  - Token-based authentication

- ⚔️ **1v1 Matchmaking**

  - Create and join matches with a unique session ID
  - Match difficulty selection (easy, medium, hard)
  - Real-time communication via SignalR

- 📊 **Game State Management**
  - Track active matches
  - Record match results and player statistics
  - Sentence selection based on difficulty

## Technical Stack

- **ASP.NET Core 9.0** - Modern web API framework
- **Entity Framework Core** - ORM for database operations
- **ASP.NET Core Identity** - User management and authentication
- **SignalR** - Real-time communication
- **JWT Authentication** - Secure token-based auth
- **SQL Server** - Database storage

## API Response Format

All API endpoints follow a consistent response format:

```json
{
  "success": true|false,
  "message": "Descriptive message about the result",
  "data": { /* Response data object */ },
  "errors": [ /* Array of error messages (only present when success is false) */ ]
}
```

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Log in and get a JWT token

### Game Management

- **POST /api/game/create** - Create a new match
- **POST /api/game/join** - Join an existing match
- **POST /api/game/complete** - Complete a match (declare winner)
- **GET /api/game/active** - Get all active matches
- **GET /api/game/{id}** - Get match details by ID
- **GET /api/game/user** - Get all matches for the current user

## SignalR Hub

A real-time communication hub is available at `/gamehub` with the following methods:

### Client Methods (to call)

- **JoinMatch(string matchId)** - Join a match room
- **CompleteMatch(string matchId)** - Complete a match (win)

### Server Events (to listen for)

- **PlayerJoined** - When another player joins the match
- **PlayerDisconnected** - When a player disconnects
- **MatchStarted** - When both players are present and the match begins
- **MatchCompleted** - When a player wins the match

## Getting Started

1. **Configure the database**:
   Update the connection string in `appsettings.json` if needed.

2. **Run migrations**:

   ```
   dotnet ef database update
   ```

3. **Start the server**:

   ```
   dotnet run
   ```

4. **Access the API**:
   The API will be available at `https://localhost:7214` and `http://localhost:5207`

## Authentication Flow

1. Register a user via `/api/auth/register`
2. Login via `/api/auth/login` to get a JWT token
3. Include the token in the Authorization header as `Bearer {token}` for all subsequent requests

## Game Flow

1. Player A creates a match via `/api/game/create`
2. Player A shares the match ID with Player B
3. Player B joins the match via `/api/game/join`
4. Both players connect to the SignalR hub
5. Both players receive the sentence to sign
6. When a player correctly signs the sentence, they call `CompleteMatch`
7. The backend updates the match and notifies both players through SignalR
