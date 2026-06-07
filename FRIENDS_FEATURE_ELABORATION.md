# Friends/Connections Tab - Feature Elaboration

## Overview
This document elaborates on the new **Friends/Connections** tab that sits between the Home and Settings tabs in the MyList app. This feature enables users to build and manage their social network within the application, facilitating improved task-sharing capabilities.

---

## 1. Core Features

### 1.1 Friends Tab Interface
- **Location**: Middle tab in the bottom navigation (between Home and Settings)
- **Icon**: `person.2.fill` (two people icon)
- **Tab Label**: "Friends"

### 1.2 Two Sections
The Friends tab is divided into two main sections:

#### Search Section
- Search bar at the top allowing users to find other users by email
- Real-time search with minimum 2 characters required
- Displays matching users from the database
- Each result shows the user's email
- "Add" button next to each user to send a connection request

#### Friends List Section
- All confirmed friends are displayed in a scrollable list
- Shows each friend's email address
- "Remove" button to unfriend a user
- "No friends yet" message when the list is empty

---

## 2. User Journey

### 2.1 Adding a Friend
1. User navigates to the Friends tab
2. Enters a search query (minimum 2 characters)
3. System searches and displays matching users
4. User taps the "Add" button next to a user
5. Friend relationship is created in the database
6. User is added to the Friends list

### 2.2 Removing a Friend
1. User navigates to Friends tab
2. Locates a friend in the friends list
3. Taps the "Remove" button
4. Friend relationship is deleted
5. User is removed from the friends list

### 2.3 Sharing Tasks with Multiple Friends
1. User navigates to a task
2. Opens the share dialog/menu
3. Sees a list of their friends (auto-suggestions)
4. Can select multiple friends from the list
5. Selects "Share" 
6. Task is shared with all selected friends simultaneously

---

## 3. Technical Implementation

### 3.1 Database Schema

#### UserFriend Entity
```csharp
public class UserFriend
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string FriendId { get; set; }
    public DateTime AddedAt { get; set; }
    
    public TodoUser? User { get; set; }
    public TodoUser? Friend { get; set; }
}
```

#### TodoUser Updates
- Added `Friends` collection: Represents friends the user has added
- Added `FriendOf` collection: Represents users who have added this user as a friend

#### Relationships
- One-to-many: A TodoUser can have many UserFriends as the initiator
- One-to-many: A TodoUser can have many UserFriends where they are the recipient
- Foreign keys with cascade delete for data integrity

### 3.2 API Endpoints

#### User Search
- **GET** `/users/search?q={query}`
- **Authentication**: Required (JWT)
- **Response**: List of users matching the search query (excluding current user)
- **Validation**: Query must be at least 2 characters

#### Get Friends List
- **GET** `/friends`
- **Authentication**: Required
- **Response**: List of all confirmed friends for the authenticated user

#### Add Friend
- **POST** `/friends`
- **Body**: `{ "friendEmail": "user@example.com" }`
- **Authentication**: Required
- **Response**: Success message or error
- **Validation**: 
  - Cannot add yourself
  - User must exist
  - Duplicate friendships prevented

#### Remove Friend
- **DELETE** `/friends/{friendEmail}`
- **Authentication**: Required
- **Response**: 204 No Content on success
- **Validation**: Friendship must exist

### 3.3 Task Sharing with Multiple Users

#### Updated Share Endpoint
- **POST** `/items/{id}/share`
- **Body**: `{ "emails": ["user1@example.com", "user2@example.com", ...] }`
- **Changes from Original**:
  - Now accepts array of emails instead of single email
  - Share with multiple users in one request
  - Invalid users are skipped; operation doesn't fail entirely

#### Logic
1. Validate task ownership
2. For each email in the list:
   - Look up the user
   - Skip invalid/non-existent users and self
   - Create SharedTodo records for the task and all descendants
3. Return success if at least one share was created

### 3.4 Repository Methods (TodoRepository)

```csharp
// Search users by email or name
Task<List<TodoUser>> SearchUsersAsync(string query, string currentUserId)

// Get all friends of a user
Task<List<TodoUser>> GetFriendsAsync(string userId)

// Add a friend relationship
Task<bool> AddFriendAsync(string userId, string friendId)

// Remove a friend relationship
Task<bool> RemoveFriendAsync(string userId, string friendId)
```

### 3.5 Service Methods (TodoService)

```csharp
// Search users with validation
Task<List<TodoUser>> SearchUsersAsync(string query, string currentUserId)

// Get user's friends list
Task<List<TodoUser>> GetFriendsAsync(string userId)

// Add friend by email (with user lookup)
Task<bool> AddFriendAsync(string userId, string friendEmail)

// Remove friend by email
Task<bool> RemoveFriendAsync(string userId, string friendEmail)

// Updated share method - now accepts multiple emails
Task<bool> ShareTaskAsync(int id, string ownerId, List<string> recipientEmails)
```

### 3.6 Frontend (React Native/Expo)

#### Friends Screen Component (`friends.tsx`)
- Search bar with real-time user search
- Search results displayed in a list
- Friends list with add/remove functionality
- Loading states and error handling
- Success/error alerts

#### API Utility (`api.ts`)
- New helper object for common HTTP operations:
  - `api.get(endpoint)`
  - `api.post(endpoint, data)`
  - `api.put(endpoint, data)`
  - `api.delete(endpoint)`

---

## 4. Advanced Features (Future Enhancements)

### 4.1 Auto-Suggestions in Share Dialog
When sharing a task, auto-populate suggestions with:
- Recent contacts (by share frequency)
- Frequent sharers
- Recently added friends
- Search filter within friends list

### 4.2 Bidirectional Friendships (Optional)
- Currently one-directional (you add someone)
- Future: Mutual friend requests
- Accept/reject friend requests
- Pending friend status

### 4.3 Friend Groups
- Create groups of friends (e.g., "Work", "Family")
- Share tasks to entire groups at once
- Different permission levels per group

### 4.4 Friend Activity Feed
- See when friends complete tasks
- See recently shared tasks
- Notifications for friend activities

### 4.5 Presence/Online Status
- Show online/offline status of friends
- Last seen timestamp

---

## 5. Data Flow Diagram

```
User Search → Query Backend → Find Users → Display List
                    ↓
              Validate (not self, not duplicate)
                    ↓
User Adds Friend → Create UserFriend Record → Update Local State
                    ↓
              Show in Friends List

User Shares Task → Get Friends List → Auto-suggest Friends → Multi-select → Send to API
                    ↓
              Create Multiple SharedTodo Records (one per friend)
                    ↓
              Task visible to all selected friends
```

---

## 6. Migration & Deployment

### 6.1 Database Migration
- Created: `AddFriendsSupport` migration
- Adds `UserFriends` table
- Sets up foreign key relationships
- Enables cascade delete for data cleanup

### 6.2 Backward Compatibility
- Existing `SharedTodo` functionality remains unchanged
- Old single-user share still works (now accepts array of one element)
- No breaking changes to existing endpoints

---

## 7. Security Considerations

### 7.1 Authorization
- All friend endpoints require JWT authentication
- Users can only access their own friend list
- Users cannot add themselves as friends
- Users cannot view other users' friend lists

### 7.2 Data Privacy
- Search only returns basic user info (email)
- friend relationships are user-specific
- Deleted friends data is cascade-removed

### 7.3 Input Validation
- Email validation before lookup
- Query length validation (min 2 chars)
- Prevent duplicate friendships
- Only task owners can share

---

## 8. Benefits

### 8.1 For Users
✅ Easily manage social connections within the app
✅ Quickly find and add collaborators
✅ Share tasks with multiple people simultaneously
✅ Clear visibility into their network
✅ Organized collaboration workflow

### 8.2 For Application
✅ Increased user engagement and stickiness
✅ Better task collaboration features
✅ Foundation for community features
✅ Better analytics on user connections
✅ Scalable architecture for future social features

---

## 9. Testing Recommendations

### 9.1 Unit Tests
- SearchUsersAsync filters correctly
- AddFriendAsync prevents duplicates
- RemoveFriendAsync works bidirectionally
- ShareTaskAsync handles multiple recipients

### 9.2 Integration Tests
- Full friend add/remove workflow
- Task sharing with multiple users
- Search functionality end-to-end
- Permission validation

### 9.3 UI Tests
- Search results update in real-time
- Friend list updates after add/remove
- Loading states display correctly
- Error messages show appropriately

---

## 10. Rollout Plan

### Phase 1: Backend Foundation
- ✅ Create UserFriend entity and migration
- ✅ Implement repository methods
- ✅ Create service layer methods
- ✅ Add API endpoints

### Phase 2: Frontend Implementation
- ✅ Create Friends screen component
- ✅ Implement search functionality
- ✅ Implement add/remove friends UI
- ✅ Connect API utilities

### Phase 3: Testing & Refinement
- Test all endpoints
- Test UI flows
- Performance optimization
- Bug fixes

### Phase 4: Multi-Share Feature
- Update share dialog
- Implement multi-select UI
- Add auto-suggestions
- Test with multiple users

---

## 11. Example Usage Scenarios

### Scenario 1: Adding a Colleague
1. Sarah navigates to Friends tab
2. Types "john@company.com"
3. Sees John's profile in results
4. Taps "Add"
5. John appears in her friends list

### Scenario 2: Sharing a Project Task
1. Sarah opens a task "Q2 Planning"
2. Taps Share button
3. Friends list auto-appears with suggestions
4. Selects: John, Emma, Mike
5. Taps "Share with 3 people"
6. Task now visible to all three friends

### Scenario 3: Removing Inactive Friend
1. Sarah reviews her friends list
2. Finds "Tom" who she no longer collaborates with
3. Taps "Remove"
4. Confirmation: "Friend removed"
5. Tom no longer has access to Sarah's new shares

---

## Summary

The Friends/Connections tab transforms MyList from a personal task manager into a collaborative platform. By enabling users to build networks and share tasks with multiple collaborators simultaneously, the app becomes more valuable for teams, project groups, and social task management workflows.
