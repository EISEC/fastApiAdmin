# FastAPI Admin Backend - API Endpoints Summary

## 🚀 Quick Start

**Base URL:** `http://localhost:8000/api/v1/`  
**Authentication:** JWT Bearer Token  
**Documentation:** `/api/v1/swagger/`

---

## 🔑 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/token/` | Get JWT token |
| POST | `/auth/token/refresh/` | Refresh JWT token |
| POST | `/auth/register/` | Register new user |
| GET | `/auth/profile/` | Get current user profile |
| POST | `/auth/logout/` | Logout user |

---

## 👥 Users & Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/users/` | List users |
| POST | `/auth/users/` | Create user |
| GET | `/auth/users/{id}/` | Get user details |
| PUT | `/auth/users/{id}/` | Update user |
| DELETE | `/auth/users/{id}/` | Delete user |
| POST | `/auth/users/{id}/toggle_active/` | Toggle user active status |
| POST | `/auth/users/{id}/reset_password/` | Reset user password |
| GET | `/auth/roles/` | List roles |

---

## 🌐 Sites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sites/` | List sites |
| POST | `/sites/` | Create site |
| GET | `/sites/{id}/` | Get site details |
| PUT | `/sites/{id}/` | Update site |
| DELETE | `/sites/{id}/` | Delete site |
| GET | `/sites/{id}/stats/` | Get site statistics |
| POST | `/sites/{id}/assign_users/` | Assign users to site |
| POST | `/sites/{id}/remove_user/` | Remove user from site |
| POST | `/sites/{id}/toggle_active/` | Toggle site active status |
| GET | `/sites/my_sites/` | Get current user's sites |
| GET | `/sites/available_users/` | Get available users for assignment |

---

## 📝 Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/` | List posts |
| POST | `/posts/` | Create post |
| GET | `/posts/{id}/` | Get post details |
| PUT | `/posts/{id}/` | Update post |
| DELETE | `/posts/{id}/` | Delete post |
| POST | `/posts/{id}/duplicate/` | Duplicate post |
| PATCH | `/posts/{id}/change_status/` | Change post status |
| POST | `/posts/{id}/increment_views/` | Increment post views |
| GET | `/posts/my_posts/` | Get current user's posts |
| GET | `/posts/published/` | Get published posts |
| GET | `/posts/stats/` | Get posts statistics |
| GET | `/posts/available_sites/` | Get available sites |

### Categories & Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/categories/` | List post categories |
| POST | `/posts/categories/` | Create category |
| GET | `/posts/categories/{id}/` | Get category details |
| PUT | `/posts/categories/{id}/` | Update category |
| DELETE | `/posts/categories/{id}/` | Delete category |
| GET | `/posts/tags/` | List post tags |
| POST | `/posts/tags/` | Create tag |
| GET | `/posts/tags/{id}/` | Get tag details |
| PUT | `/posts/tags/{id}/` | Update tag |
| DELETE | `/posts/tags/{id}/` | Delete tag |

---

## 📄 Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pages/` | List pages |
| POST | `/pages/` | Create page |
| GET | `/pages/{id}/` | Get page details |
| PUT | `/pages/{id}/` | Update page |
| DELETE | `/pages/{id}/` | Delete page |
| POST | `/pages/{id}/compile/` | Compile page |
| GET | `/pages/{id}/preview/` | Preview page |
| GET | `/pages/{id}/render/` | Render page HTML |
| POST | `/pages/{id}/publish/` | Publish page |
| POST | `/pages/{id}/unpublish/` | Unpublish page |
| POST | `/pages/{id}/set_home/` | Set as homepage |
| GET | `/pages/my_pages/` | Get current user's pages |
| GET | `/pages/published/` | Get published pages |
| GET | `/pages/home_pages/` | Get homepages |
| GET | `/pages/stats/` | Get pages statistics |
| GET | `/pages/available_sites/` | Get available sites |
| GET | `/pages/templates/` | Get available templates |

---

## ⚙️ Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/` | List settings |
| POST | `/settings/` | Create setting |
| GET | `/settings/{key}/` | Get setting by key |
| PUT | `/settings/{key}/` | Update setting |
| DELETE | `/settings/{key}/` | Delete setting |
| GET | `/settings/all/` | Get all settings structured |
| PUT | `/settings/bulk/` | Bulk update settings |
| PUT | `/settings/import/` | Import settings from JSON |
| GET | `/settings/export/` | Export settings to JSON |

### Categories & Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings/categories/` | List setting categories |
| POST | `/settings/categories/` | Create category |
| GET | `/settings/groups/` | List setting groups |
| POST | `/settings/groups/` | Create group |
| GET | `/settings/templates/` | List setting templates |
| POST | `/settings/templates/` | Create template |
| POST | `/settings/templates/{id}/apply/` | Apply template |

---

## 🔧 Common Query Parameters

### Filtering & Search
- `search` - Search in relevant fields
- `ordering` - Sort results (`field` or `-field` for desc)
- `page` - Page number for pagination
- `page_size` - Items per page (max 100)

### Example Requests

```bash
# Get JWT Token
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# List posts with search and pagination
curl -X GET "http://localhost:8000/api/v1/posts/?search=django&page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create new site
curl -X POST http://localhost:8000/api/v1/sites/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Site", "domain": "mysite.com"}'

# Bulk update settings
curl -X PUT http://localhost:8000/api/v1/settings/bulk/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"updates": [{"key": "site_name", "value": "New Site Name"}]}'
```

---

## 📊 Response Format

### Success Response
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

### Paginated Response
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/v1/posts/?page=3",
  "previous": "http://localhost:8000/api/v1/posts/?page=1",
  "results": [...]
}
```

---

**Total Endpoints:** 137  
**API Version:** v1.0  
**Status:** ✅ Production Ready 