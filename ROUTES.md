# Application Routes Reference

## Available Routes

### Main Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Home (redirects to dashboard) | ✅ Working |
| `/dashboard` | Main dashboard | ✅ Working |

### CRM Module (`/crm`)

#### Farmers
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/farmers` | Farmers list page | ✅ Complete |
| `/crm/farmers/new` | Add new farmer form | ✅ Complete |
| `/crm/farmers/[id]` | Farmer detail page | ✅ Complete |
| `/crm/farmers/[id]/edit` | Edit farmer form | ⏳ Pending |

#### Dealers
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/dealers` | Dealers list page | ✅ Complete |
| `/crm/dealers/new` | Add new dealer form | ⏳ Pending |
| `/crm/dealers/[id]` | Dealer detail page | ⏳ Pending |
| `/crm/dealers/[id]/edit` | Edit dealer form | ⏳ Pending |

#### Calls
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/calls` | Calls log page | ⏳ Pending |
| `/crm/calls/new` | Log new call | ⏳ Pending |

#### Meetings
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/meetings` | Meetings list | ⏳ Pending |
| `/crm/meetings/new` | Create meeting | ⏳ Pending |
| `/crm/meetings/[id]` | Meeting details | ⏳ Pending |

#### Visits
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/visits` | Visits list | ⏳ Pending |
| `/crm/visits/new` | Schedule visit | ⏳ Pending |

#### Sales
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/sales` | Sales transactions list | ⏳ Pending |
| `/crm/sales/new` | New transaction | ⏳ Pending |

#### Field Staff
| Route | Description | Status |
|-------|-------------|--------|
| `/crm/field-staff` | Field staff list | ⏳ Pending |
| `/crm/field-staff/new` | Add field staff | ⏳ Pending |
| `/crm/field-staff/[id]` | Staff details | ⏳ Pending |

### Complaints Module (`/complaints`)

| Route | Description | Status |
|-------|-------------|--------|
| `/complaints` | Complaints list | ✅ Complete |
| `/complaints/new` | Register complaint | ⏳ Pending |
| `/complaints/[id]` | Complaint details | ⏳ Pending |

### Products Module (`/products`)

| Route | Description | Status |
|-------|-------------|--------|
| `/products` | Products catalog | ✅ Complete |
| `/products/new` | Add product | ⏳ Pending |
| `/products/[id]` | Product details | ⏳ Pending |
| `/products/[id]/edit` | Edit product | ⏳ Pending |

### Materials Module (`/materials`)

| Route | Description | Status |
|-------|-------------|--------|
| `/materials` | Materials library | ✅ Complete |
| `/materials/upload` | Upload material | ⏳ Pending |
| `/materials/[id]` | Material details | ⏳ Pending |

### Events Module (`/events`)

| Route | Description | Status |
|-------|-------------|--------|
| `/events` | Events list | ✅ Complete |
| `/events/new` | Create event | ⏳ Pending |
| `/events/[id]` | Event details | ⏳ Pending |
| `/events/[id]/edit` | Edit event | ⏳ Pending |

### Campaigns Module (`/campaigns`)

| Route | Description | Status |
|-------|-------------|--------|
| `/campaigns` | Campaigns list | ✅ Complete |
| `/campaigns/new` | Create campaign | ⏳ Pending |
| `/campaigns/[id]` | Campaign details | ⏳ Pending |
| `/campaigns/[id]/edit` | Edit campaign | ⏳ Pending |

### Data Bank Module (`/data-bank`)

| Route | Description | Status |
|-------|-------------|--------|
| `/data-bank` | Central profiling hub | ✅ Complete |

### Settings & Admin

| Route | Description | Status |
|-------|-------------|--------|
| `/settings` | Application settings | ⏳ Pending |
| `/settings/profile` | User profile | ⏳ Pending |
| `/settings/users` | User management (admin) | ⏳ Pending |
| `/settings/zones` | Zones management | ⏳ Pending |
| `/settings/areas` | Areas management | ⏳ Pending |

### Authentication (To be implemented)

| Route | Description | Status |
|-------|-------------|--------|
| `/login` | Login page | ⏳ Pending |
| `/logout` | Logout | ⏳ Pending |
| `/forgot-password` | Password recovery | ⏳ Pending |
| `/reset-password` | Reset password | ⏳ Pending |

## Route Patterns

### Dynamic Routes
- `[id]` - Single item detail page
- `[id]/edit` - Edit form for item
- `new` - Create new item form

### Protected Routes
All routes under `(dashboard)` will be protected and require authentication (to be implemented).

## Navigation Structure

### Sidebar Menu
```
Dashboard
Telemarketing/CRM
  ├── Farmers
  ├── Dealers
  ├── Field Staff
  ├── Calls Log
  ├── Meetings
  ├── Visits
  └── Sales
Complaints
Products
Materials
Events
Campaigns
Data Bank
Settings
```

## API Routes (To be implemented)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Farmers
- `GET /api/farmers` - List farmers
- `POST /api/farmers` - Create farmer
- `GET /api/farmers/[id]` - Get farmer details
- `PUT /api/farmers/[id]` - Update farmer
- `DELETE /api/farmers/[id]` - Delete farmer

### Dealers
- `GET /api/dealers` - List dealers
- `POST /api/dealers` - Create dealer
- `GET /api/dealers/[id]` - Get dealer details
- `PUT /api/dealers/[id]` - Update dealer
- `DELETE /api/dealers/[id]` - Delete dealer

### Calls
- `GET /api/calls` - List calls
- `POST /api/calls` - Log call
- `GET /api/calls/[id]` - Get call details

### Other Modules
Similar CRUD endpoints for:
- Meetings
- Visits
- Sales Transactions
- Complaints
- Products
- Materials
- Events
- Campaigns

## URL Parameters

### Common Query Parameters
- `?page=1` - Pagination
- `?limit=20` - Items per page
- `?search=query` - Search term
- `?sort=name` - Sort field
- `?order=asc` - Sort order
- `?filter[status]=active` - Filter by field

### Example URLs
```
/crm/farmers?page=2&limit=50&search=ali&sort=name&order=asc
/crm/dealers?filter[status]=active&filter[city]=Faisalabad
/complaints?priority=high&status=in_progress
/products?category=seeds&stage=commercial
```

## Redirects

- `/` → `/dashboard` (Home page redirects to dashboard)
- Any invalid route → 404 page (to be implemented)
- Unauthenticated access → `/login` (to be implemented)

## Status Legend

- ✅ Complete - Page built and working with UI
- ⏳ Pending - Not yet implemented
- 🚧 In Progress - Currently being built
- ❌ Deprecated - No longer used

## Testing URLs

Once the dev server is running (`npm run dev`), test these URLs:

### Working URLs ✅
```
http://localhost:3000
http://localhost:3000/dashboard
http://localhost:3000/crm/farmers
http://localhost:3000/crm/farmers/1
http://localhost:3000/crm/farmers/new
http://localhost:3000/crm/dealers
http://localhost:3000/complaints
http://localhost:3000/products
http://localhost:3000/materials
http://localhost:3000/events
http://localhost:3000/campaigns
http://localhost:3000/data-bank
```

### Pending URLs ⏳
These routes need to be created:
```
http://localhost:3000/crm/calls
http://localhost:3000/crm/meetings
http://localhost:3000/crm/visits
http://localhost:3000/crm/sales
http://localhost:3000/crm/field-staff
http://localhost:3000/settings
http://localhost:3000/login
```

## Route Guards (To be implemented)

### Permission-based Access
Different routes will have different permission requirements:

| Route | Requires | Roles Allowed |
|-------|----------|---------------|
| `/dashboard` | Authentication | All |
| `/crm/farmers` | Authentication | TMO, Manager, Admin |
| `/crm/dealers` | Authentication | TMO, Manager, Admin |
| `/complaints` | Authentication | All |
| `/products` | Authentication | All |
| `/materials` | Authentication | TMO, Event Coord, Manager, Admin |
| `/events` | Authentication | Event Coord, Manager, Admin |
| `/campaigns` | Authentication | Manager, Admin |
| `/settings/users` | Authentication + Admin | Admin only |

---

**Last Updated**: October 2024  
**Total Routes Implemented**: 12 / 40+  
**Completion**: ~30%
