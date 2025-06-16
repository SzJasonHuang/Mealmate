# MealMate Backend

A Node.js Express backend with MySQL database for user authentication and data management.

## Features

- **User Authentication**: Register, login, logout with JWT tokens
- **Password Security**: Bcrypt hashing with salt rounds
- **User Favorites**: Save and manage favorite recipes
- **Search History**: Track user search queries
- **Input Validation**: Comprehensive validation using express-validator
- **Security**: Helmet, CORS, rate limiting
- **Database**: MySQL with connection pooling

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Make sure you have MySQL installed and running. Create a database:

```sql
CREATE DATABASE mealmate;
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Update the database credentials and other settings in `.env`.

### 4. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (requires auth)
- `POST /api/auth/logout` - Logout user (requires auth)

### User Data
- `GET /api/users/favorites` - Get user's favorite recipes (requires auth)
- `POST /api/users/favorites` - Add recipe to favorites (requires auth)
- `DELETE /api/users/favorites/:recipeId` - Remove recipe from favorites (requires auth)
- `GET /api/users/search-history` - Get user's search history (requires auth)
- `POST /api/users/search-history` - Add search query to history (requires auth)
- `DELETE /api/users/search-history` - Clear search history (requires auth)

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL
);
```

### User Favorites Table
```sql
CREATE TABLE user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  recipe_title VARCHAR(255) NOT NULL,
  recipe_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### User Search History Table
```sql
CREATE TABLE user_search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  search_query VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Security Features

- **Password Hashing**: Bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Prevents abuse with request limits
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express apps

## Usage Examples

### Register a User
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'johndoe',
    email: 'john@example.com',
    password: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe'
  })
});
```

### Login
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'SecurePass123'
  })
});
```

### Add Recipe to Favorites (with auth token)
```javascript
const response = await fetch('http://localhost:3000/api/users/favorites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    recipeId: 12345,
    recipeTitle: 'Delicious Pasta',
    recipeImage: 'https://example.com/pasta.jpg'
  })
});
```

## Development

The backend is built with:
- **Express.js**: Web framework
- **MySQL2**: Database driver with promise support
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token handling
- **express-validator**: Input validation
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: Rate limiting

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a strong `JWT_SECRET`
3. Configure proper database credentials
4. Set up SSL/TLS for HTTPS
5. Use a process manager like PM2
6. Set up proper logging and monitoring