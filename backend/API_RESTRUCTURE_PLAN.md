# API Restructure Plan: Client vs Admin Separation

## Overview
Separate client-side APIs (for players) from admin APIs, with a story approval/publishing workflow.

## Database Changes

### 1. Add `status` field to Story model
- Add `status` column to `stories` table
- Values: `"pending"`, `"published"`, `"rejected"` (default: `"pending"`)
- Add migration to update existing stories to `"published"` status

```python
# In app/db/models.py - Story model
status = Column(String(20), default="pending", nullable=False, index=True)
# Options: "pending", "published", "rejected"
```

## New File Structure

### Client API (`app/api/client.py`)
Client-side endpoints for authenticated players:
- Story management (create, view own stories)
- Customer profile management (view/update own customer)
- View published stories

### Admin API (`app/api/admin.py`) - Modified
Admin-only endpoints:
- Story approval/rejection
- View all stories (including pending)
- Manage all customers
- User management

### New Schemas (`app/schemas/client.py`)
Client-side request/response schemas

## Endpoint Structure

### Client Endpoints (`/api/client/*`)

#### Authentication
- Uses JWT authentication (same as current auth)
- Players must be logged in

#### Story Endpoints
1. **POST `/api/client/story`** - Create a new story (status: pending)
   - Requires: authenticated user
   - Auto-assigns to user's customer
   - Story created with `status="pending"`

2. **GET `/api/client/stories`** - Get current user's stories
   - Returns: all stories for user's customer (pending, published, rejected)
   - Filtered by authenticated user

3. **GET `/api/client/story/{story_id}`** - Get specific story (if owned by user)
   - Returns: story details if user owns it

4. **PUT `/api/client/story/{story_id}`** - Update own story (only if pending)
   - Can only update if status is "pending"
   - Cannot update published/rejected stories

5. **DELETE `/api/client/story/{story_id}`** - Delete own story
   - Can only delete if status is "pending" or "rejected"
   - Cannot delete published stories (admin must handle)

6. **GET `/api/client/stories/published`** - Get all published stories
   - Returns: all stories with status="published" (for browsing)

#### Customer Endpoints
7. **GET `/api/client/customer`** - Get current user's customer profile
   - Returns: customer profile for authenticated user

8. **PUT `/api/client/customer`** - Update own customer profile
   - Can update: name, personality_traits, visual_description
   - Cannot change user_id

### Admin Endpoints (`/admin/*`) - Modified

#### Story Management (Admin Only)
1. **GET `/admin/stories`** - Get all stories (with filters)
   - Query params: `status` (pending/published/rejected), `customer_id`
   - Returns: all stories with optional filtering

2. **GET `/admin/story/{story_id}`** - Get any story by ID
   - Admin can view any story

3. **PUT `/admin/story/{story_id}`** - Update any story
   - Admin can update any story regardless of status

4. **POST `/admin/story/{story_id}/approve`** - Approve and publish story
   - Changes status from "pending" to "published"
   - Returns: updated story

5. **POST `/admin/story/{story_id}/reject`** - Reject story
   - Changes status from "pending" to "rejected"
   - Optional: rejection reason field
   - Returns: updated story

6. **DELETE `/admin/story/{story_id}`** - Delete any story
   - Admin can delete any story

#### Customer Management (Admin Only)
7. **GET `/admin/customers`** - Get all customers (unchanged)

8. **GET `/admin/customer/{customer_id}`** - Get customer with stories (unchanged)

9. **POST `/admin/customer`** - Create customer (unchanged)

10. **PUT `/admin/customer/{customer_id}`** - Update any customer (unchanged)

11. **DELETE `/admin/customer/{customer_id}`** - Delete customer (unchanged)

## Authentication & Authorization

### Current Auth Flow
- `/admin/auth/register` - Register new user (client or admin)
- `/admin/auth/login` - Login (returns JWT token)

### New: Admin Role System
- Add `is_admin` boolean field to User model
- Create admin check dependency: `get_admin_user()`
- Admin endpoints require `is_admin=True`

### Dependencies Needed
1. `get_current_user()` - Already exists, returns authenticated user
2. `get_current_customer()` - New: Get customer for current user
3. `get_admin_user()` - New: Verify user is admin

## Schema Changes

### Story Schemas
- Add `status` field to `StoryResponse`
- Add `StoryStatusUpdate` schema for admin approval/rejection
- Client schemas don't include status in create (auto-set to pending)

### New Client Schemas
```python
# app/schemas/client.py
- StoryCreate (same as admin, but no status)
- StoryResponse (includes status)
- CustomerUpdate (limited fields)
```

## Migration Steps

### Step 1: Database Migration
1. Create Alembic migration to add `status` column
2. Set existing stories to `"published"` status
3. Add `is_admin` column to users table (default: False)

### Step 2: Model Updates
1. Update `Story` model with `status` field
2. Update `User` model with `is_admin` field

### Step 3: Schema Updates
1. Create `app/schemas/client.py`
2. Update `StoryResponse` to include `status`
3. Create `StoryStatusUpdate` schema for admin

### Step 4: Dependency Updates
1. Create `get_current_customer()` dependency
2. Create `get_admin_user()` dependency
3. Update auth dependencies if needed

### Step 5: API Implementation
1. Create `app/api/client.py` with all client endpoints
2. Update `app/api/admin.py`:
   - Remove story creation (moved to client)
   - Add approval/rejection endpoints
   - Add admin-only filters
3. Update `app/main.py` to include client router

### Step 6: Update Game API
- Update `fetch_context_node` to only load published stories
- Or add filter parameter for admin testing

## Endpoint Summary

### Client API (`/api/client`)
```
POST   /api/client/story                    # Create story (pending)
GET    /api/client/stories                  # Get my stories
GET    /api/client/stories/published        # Browse published stories
GET    /api/client/story/{id}               # Get my story
PUT    /api/client/story/{id}               # Update my pending story
DELETE /api/client/story/{id}               # Delete my story
GET    /api/client/customer                  # Get my customer
PUT    /api/client/customer                 # Update my customer
```

### Admin API (`/admin`)
```
GET    /admin/stories?status=pending        # Get all stories (filtered)
GET    /admin/story/{id}                    # Get any story
PUT    /admin/story/{id}                    # Update any story
POST   /admin/story/{id}/approve            # Approve story
POST   /admin/story/{id}/reject             # Reject story
DELETE /admin/story/{id}                    # Delete any story
GET    /admin/customers                     # Get all customers
GET    /admin/customer/{id}                 # Get customer
POST   /admin/customer                      # Create customer
PUT    /admin/customer/{id}                 # Update customer
DELETE /admin/customer/{id}                 # Delete customer
```

## Security Considerations

1. **Client endpoints**: Require authentication, users can only access their own data
2. **Admin endpoints**: Require authentication + admin role check
3. **Story status**: Clients cannot change status (only admin can approve/reject)
4. **Published stories**: Visible to all authenticated users for browsing
5. **Pending stories**: Only visible to owner and admins

## Testing Strategy

1. Test client story creation (creates with pending status)
2. Test admin approval workflow
3. Test that clients can only see/edit their own stories
4. Test that published stories are visible to all
5. Test that pending stories are only visible to owner and admin

