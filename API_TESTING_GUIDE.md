# VOCH Platform - API Testing Guide 🧪

> **Purpose**: Complete guide for testing VOCH backend APIs  
> **Tools**: Postman, Thunder Client, cURL  
> **Base URL**: `http://localhost:3001/api`

## Quick Start

### Prerequisites
1. Backend server running: `cd backend && npm run start:dev`
2. Database migrated: `npx prisma migrate dev`
3. API client installed (Postman/Thunder Client)

---

## 🔐 Authentication APIs

### 1. Register New User

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "username": "testuser",
  "fullName": "Test User",
  "phoneNumber": "+919876543210"
}
```

**Success Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "username": "testuser",
    "fullName": "Test User"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "username": "testuser"
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### 3. Get Current User Profile

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Success Response** (200):
```json
{
  "id": "uuid",
  "email": "test@example.com",
  "username": "testuser",
  "fullName": "Test User",
  "bio": "User bio",
  "avatarUrl": "https://...",
  "createdAt": "2025-11-06T16:00:00Z"
}
```

---

## 📝 Post/Content APIs

### 1. Create Post

**Endpoint**: `POST /posts`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "content": "This is my first post on VOCH! #SocialImpact",
  "type": "text",
  "visibility": "public",
  "location": "Mumbai, India"
}
```

**Success Response** (201):
```json
{
  "id": "post_uuid",
  "content": "This is my first post on VOCH! #SocialImpact",
  "type": "text",
  "authorId": "user_uuid",
  "likesCount": 0,
  "commentsCount": 0,
  "createdAt": "2025-11-06T16:00:00Z"
}
```

### 2. Get Feed

**Endpoint**: `GET /feed`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `type`: 'following' | 'explore' | 'trending'

**Success Response** (200):
```json
{
  "posts": [
    {
      "id": "post_uuid",
      "content": "Post content",
      "author": {
        "id": "user_uuid",
        "username": "testuser",
        "avatarUrl": "https://..."
      },
      "likesCount": 10,
      "commentsCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 3. Like Post

**Endpoint**: `POST /posts/:postId/like`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Success Response** (200):
```json
{
  "liked": true,
  "likesCount": 11
}
```

---

## 💬 Comment APIs

### 1. Add Comment

**Endpoint**: `POST /posts/:postId/comments`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "content": "Great post! 👍",
  "parentId": null
}
```

**Success Response** (201):
```json
{
  "id": "comment_uuid",
  "content": "Great post! 👍",
  "authorId": "user_uuid",
  "postId": "post_uuid",
  "createdAt": "2025-11-06T16:00:00Z"
}
```

---

## 👥 Follow APIs

### 1. Follow User

**Endpoint**: `POST /users/:userId/follow`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Success Response** (200):
```json
{
  "following": true,
  "followersCount": 101
}
```

### 2. Get Followers

**Endpoint**: `GET /users/:userId/followers`

**Success Response** (200):
```json
{
  "followers": [
    {
      "id": "user_uuid",
      "username": "follower1",
      "fullName": "Follower Name",
      "avatarUrl": "https://..."
    }
  ],
  "total": 100
}
```

---

## 💰 Fundraiser APIs

### 1. Create Fundraiser

**Endpoint**: `POST /fundraisers`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "title": "Help Build School in Rural India",
  "description": "Fundraising for education",
  "goalAmount": 100000,
  "category": "education",
  "endDate": "2025-12-31T23:59:59Z"
}
```

**Success Response** (201):
```json
{
  "id": "fundraiser_uuid",
  "title": "Help Build School in Rural India",
  "goalAmount": 100000,
  "raisedAmount": 0,
  "status": "active"
}
```

### 2. Make Donation

**Endpoint**: `POST /fundraisers/:fundraiserId/donate`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "amount": 1000,
  "message": "Supporting this cause!",
  "anonymous": false
}
```

---

## 🧪 Testing Workflows

### Complete User Journey Test

1. **Register** → Get tokens
2. **Login** → Verify authentication
3. **Create Post** → Verify post creation
4. **Like Post** → Test interaction
5. **Add Comment** → Test commenting
6. **Follow User** → Test social features
7. **Create Fundraiser** → Test impact features

### Postman Collection

Import this collection for quick testing:

```json
{
  "info": {
    "name": "VOCH API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api"
    },
    {
      "key": "accessToken",
      "value": ""
    }
  ]
}
```

---

## 🐛 Common Issues & Solutions

### 401 Unauthorized
- **Cause**: Invalid or expired token
- **Solution**: Login again to get fresh token

### 400 Bad Request
- **Cause**: Invalid request body
- **Solution**: Check required fields and data types

### 500 Internal Server Error
- **Cause**: Server issue
- **Solution**: Check server logs, verify database connection

---

## 📊 Response Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🔧 cURL Examples

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "username": "testuser",
    "fullName": "Test User"
  }'
```

### Create Post (with auth)
```bash
curl -X POST http://localhost:3001/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "My first VOCH post!",
    "type": "text"
  }'
```

---

**Happy Testing! 🚀**
