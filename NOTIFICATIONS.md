# Notification System Documentation

## Overview

Your backend automatically creates and sends notifications for three key user interactions:

## Notification Types

### 1. **Like Notifications** (`type: "like"`)

**Trigger:** When a user likes another user's post  
**Location:** `src/modules/post/post.controller.ts` → `toggleLike()`  
**Recipient:** Post author  
**Data Stored:** `{ postId: string }`

**Flow:**

1. User likes a post (POST `/api/posts/:postId/like`)
2. Backend checks: Is this the post author liking their own post?
   - If YES: No notification created (self-like)
   - If NO: Proceed to create notification
3. Notification created in database with:
   - `userId`: Post author's ID (recipient)
   - `actorId`: Liker's ID
   - `type`: "like"
   - `data`: Contains postId for reference
4. Real-time notification emitted via Socket.io to `user:${postAuthorId}`
5. Frontend receives notification and updates UI

### 2. **Comment Notifications** (`type: "comment"`)

**Trigger:** When a user comments on another user's post  
**Location:** `src/modules/post/post.controller.ts` → `createComment()`  
**Recipient:** Post author  
**Data Stored:** `{ postId: string, commentId: number }`

**Flow:**

1. User creates a comment (POST `/api/posts/:postId/comments`)
2. Backend checks: Is this the post author commenting on their own post?
   - If YES: No notification created (self-comment)
   - If NO: Proceed to create notification
3. Notification created in database with:
   - `userId`: Post author's ID (recipient)
   - `actorId`: Commenter's ID
   - `type`: "comment"
   - `data`: Contains postId and commentId for reference
4. Real-time notification emitted via Socket.io to `user:${postAuthorId}`
5. Frontend receives notification and updates UI

### 3. **Follow Request Notifications** (`type: "follow_request"`)

**Trigger:** When a user sends a follow request to another user  
**Location:** `src/modules/follow/follow.controller.ts` → `requestFollow()`  
**Recipient:** User being followed (target)  
**Data Stored:** `{ requestId: string }`

**Flow:**

1. User sends follow request (POST `/api/follow/:id/request`)
2. Backend creates a UserFollowRequest record
3. Notification created in database with:
   - `userId`: Target user's ID (person being followed)
   - `actorId`: Requester's ID
   - `type`: "follow_request"
   - `data`: Contains requestId for accepting/rejecting
4. Real-time notification emitted via Socket.io to `user:${targetUserId}`
5. Frontend receives notification and updates UI

## Additional Notification Types (Already Implemented)

### 4. **Follow Accepted** (`type: "follow_accepted"`)

**Trigger:** When a user accepts a follow request  
**Location:** `src/modules/follow/follow.controller.ts` → `acceptFollowRequest()`  
**Recipient:** Original requester  
**Data Stored:** `{ requestId: string }`

### 5. **New Post** (`type: "new_post"`)

**Trigger:** When a user creates a new post  
**Location:** `src/modules/post/post.controller.ts` → `createPost()`  
**Recipient:** All followers of the post author  
**Data Stored:** `{ postId: string }`

## Technical Implementation

### Database Schema

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  actor     User?    @relation("NotificationActor", fields: [actorId], references: [id], onDelete: Cascade)
  actorId   Int?
  type      String
  data      Json?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### API Endpoints

#### Get All Notifications

```http
GET /api/notifications
Authorization: Bearer <token>
```

**Response:**

```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 5,
      "actorId": 3,
      "actor": {
        "id": 3,
        "username": "johndoe",
        "name": "John Doe"
      },
      "type": "like",
      "data": { "postId": "abc123" },
      "read": false,
      "createdAt": "2025-12-19T10:30:00Z"
    }
  ]
}
```

#### Mark Notification as Read

```http
POST /api/notifications/:id/read
Authorization: Bearer <token>
```

### Socket.io Real-time Delivery

**Event Name:** `notification`  
**Room:** `user:${userId}` (user-specific room)

**Client Connection:**

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: userToken },
});

// Listen for notifications
socket.on("notification", (notification) => {
  console.log("New notification:", notification);
  // Update UI, show toast, increment badge count, etc.
});
```

## Frontend Integration Checklist

✅ **Backend is ready!** All notification creation and emission is working.

To complete the integration on your frontend:

1. **Fetch notifications on page load:**

   ```javascript
   const response = await fetch("/api/notifications", {
     headers: { Authorization: `Bearer ${token}` },
   });
   const { notifications } = await response.json();
   ```

2. **Connect to Socket.io for real-time updates:**

   ```javascript
   socket.on("notification", (newNotification) => {
     // Add to your notifications list
     // Show a toast/popup
     // Increment notification badge count
   });
   ```

3. **Mark notifications as read when clicked:**

   ```javascript
   await fetch(`/api/notifications/${notificationId}/read`, {
     method: "POST",
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

4. **Display notification messages based on type:**

   ```javascript
   function getNotificationMessage(notification) {
     const { type, actor, data } = notification;

     switch (type) {
       case "like":
         return `${actor.username} liked your post`;
       case "comment":
         return `${actor.username} commented on your post`;
       case "follow_request":
         return `${actor.username} sent you a follow request`;
       case "follow_accepted":
         return `${actor.username} accepted your follow request`;
       case "new_post":
         return `${actor.username} created a new post`;
       default:
         return "New notification";
     }
   }
   ```

## Testing

Run the test suite to verify notification functionality:

```bash
npm test
```

All notification tests are passing! ✅

## Debugging

Enable debug logs by checking your server console when:

- Creating a like: Look for "DEBUG: toggleLike created notification"
- Creating a comment: Look for "DEBUG: createComment created notification"
- Sending follow request: Look for "DEBUG: requestFollow created notification"

Each log shows the created notification object and confirms socket emission.

## Environment Variables

No additional environment variables needed for notifications. Socket.io uses the same port as your Express server.

---

**Summary:** Your notification system is fully operational! All three requested notification types (like, comment, follow_request) are being created in the database and emitted in real-time via Socket.io. The frontend just needs to connect and listen.
