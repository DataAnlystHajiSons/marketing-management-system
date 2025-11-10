# Marketing Management System - Complete Documentation

## Overview
A comprehensive, state-of-the-art web application for managing all marketing operations for an agricultural products company. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

### 7 Core Modules

#### 1. Telemarketing/CRM Module
- **Farmers Management**: Complete lead lifecycle tracking from "new" to "converted"
  - Lead scoring (0-100) with quality classification (Hot/Warm/Cold)
  - 14-stage lead pipeline
  - Activity timeline and interaction history
  - Meeting and visit tracking
  - Sales transaction recording
  
- **Dealers Management**: Relationship scoring and performance tracking
  - Relationship status management (Active, Preferred, At Risk, etc.)
  - Relationship scoring (0-100)
  - Performance ratings
  - Sales analytics (6M, 12M trends)
  - Scheduled touchpoints (weekly reviews, monthly reports)
  
- **Field Staff Management**: Team coordination
  - Assignment to zones and areas
  - Performance tracking
  
- **Call Logging**: Comprehensive communication tracking
  - Multiple call purposes
  - Follow-up scheduling
  - Link to meetings, visits, complaints
  
- **Meetings**: Event coordination and attendance tracking
  - Invitee list management
  - Attendance recording
  - Automatic stage progression
  
- **Visits**: Field visit management
  - Visit scheduling and tracking
  - Outcome recording
  - Product discussions

#### 2. Complaints Management
- Multi-stakeholder complaint tracking (Farmers, Dealers, Field Staff)
- Priority levels (Low, Medium, High, Critical)
- Status workflow (Registered → Assigned → In Progress → Resolved → Closed)
- Multiple assignments support
- SLA monitoring
- Resolution tracking

#### 3. Products Catalog
- Complete product lifecycle management
- Product stages (Research → Development → Trial → Pre-Commercial → Commercial)
- Sowing calendar with regional variations
- Pricing and units management
- Category organization

#### 4. Marketing Materials Library
- Digital asset management
- Multiple material types:
  - Brochures
  - Presentations (PPT)
  - Post Designs
  - Posters
  - Flexes
  - Leaflets
  - Videos
- Version control
- Multi-language support
- File upload and storage (Supabase Storage)

#### 5. Events Management (360°)
- Complete event lifecycle
- Budget tracking
- Task assignment
- Material management
- Attendee registration and tracking
- Multiple event types (Farmer Meetings, Dealer Conferences, Product Launches)

#### 6. Campaigns Management
- Campaign planning and execution
- Budget vs. actual spend tracking
- Revenue target tracking
- Product associations
- Campaign metrics and outputs
- Timeline milestones
- Reach and conversion tracking

#### 7. Data Bank (Profiling Hub)
- 360° stakeholder profiles
- Unified search across all entities
- Quick access to:
  - Sales history (6M, 12M)
  - Top/bottom products
  - Credit limits and balances
  - Complaints history
  - Interaction summary
  - Performance metrics

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Custom components)
- **Icons**: Lucide React
- **State Management**: React Query + Zustand (ready to implement)
- **Charts**: Recharts (ready to implement)
- **Tables**: TanStack Table (ready to implement)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## User Roles & Permissions

### 7 Role Types:
1. **Admin** - Full system access
2. **Head of Marketing** - View-all, strategic oversight
3. **Country Manager** - Full access to assigned zones
4. **Telemarketing Manager** - Team management and monitoring
5. **Telemarketing Officer (TMO)** - Daily operations, lead management
6. **Event Coordinator** - Events and materials management
7. **Viewer** - Read-only access

## Project Structure

```
marketing-system/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── crm/             # CRM module
│   │   │   │   ├── farmers/     # Farmers management
│   │   │   │   ├── dealers/     # Dealers management
│   │   │   │   ├── calls/       # Call logging
│   │   │   │   ├── meetings/    # Meetings
│   │   │   │   ├── visits/      # Visits
│   │   │   │   └── sales/       # Sales transactions
│   │   │   ├── complaints/      # Complaints module
│   │   │   ├── products/        # Products module
│   │   │   ├── materials/       # Materials module
│   │   │   ├── events/          # Events module
│   │   │   ├── campaigns/       # Campaigns module
│   │   │   └── data-bank/       # Data Bank module
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page (redirects to dashboard)
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   └── label.tsx
│   │   └── layout/              # Layout components
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   └── lib/
│       ├── utils.ts             # Utility functions
│       └── supabase.ts          # Supabase client
├── public/                      # Static assets
├── components.json              # shadcn/ui config
├── .env.local                   # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

The application uses the comprehensive database schema provided in `Database_creation_script.sql`. Key tables include:

### Core Tables:
- `departments` - Organizational departments
- `zones` - Geographic zones/regions
- `areas` - Territories within zones
- `user_profiles` - Extended user information

### Stakeholder Tables:
- `farmers` - Farmer/customer records with lead management
- `dealers` - Dealer records with relationship management
- `field_staff` - Field staff information

### CRM Tables:
- `calls_log` - All communications
- `meetings` - Meeting records
- `visits` - Visit tracking
- `sales_transactions` - Sales records
- `farmer_lists` - List management for meetings/events
- `dealer_activities` - Dealer interaction tracking
- `dealer_touchpoint_schedule` - Scheduled communications

### Module Tables:
- `complaints` - Complaint tracking
- `products` - Product catalog
- `marketing_materials` - Asset library
- `events` - Event management
- `campaigns` - Campaign tracking

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (for production)

### Installation Steps

1. **Clone or navigate to the project directory:**
   ```bash
   cd "D:\Hamza\Marketing Department\marketing-system"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase:**
   - Create a new Supabase project
   - Run the `Database_creation_script.sql` in the Supabase SQL editor
   - Configure Row Level Security (RLS) policies
   - Set up Storage buckets for file uploads

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

6. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Key Features Implemented

### Premium UI/UX Design
- Modern, professional interface with clean layouts
- Consistent color scheme and typography
- Responsive design for all screen sizes
- Smooth transitions and interactions
- Premium feel with attention to detail

### Data Tables
- Sortable columns
- Search and filter functionality
- Pagination ready
- Action buttons for quick operations
- Status badges with color coding

### Lead Lifecycle Management
- Automatic stage progression
- Lead scoring algorithm
- Quality classification (Hot/Warm/Cold)
- Activity tracking
- Stage history

### Dealer Relationship Management
- Relationship scoring (0-100)
- Performance ratings
- At-risk detection
- Scheduled touchpoints
- Communication tracking

### Navigation
- Sidebar navigation with module organization
- Breadcrumb navigation ready
- Quick search in header
- Notification center placeholder

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Component-first architecture
- Reusable UI components
- Consistent naming conventions

### Component Structure
```typescript
// Standard component template
"use client" // For client components

import { ComponentProps } from "react"
import { Component } from "@/components/ui/component"

export default function PageName() {
  // State management
  // Data fetching
  // Event handlers
  
  return (
    <div className="space-y-6">
      {/* Page content */}
    </div>
  )
}
```

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use design tokens from globals.css
- Consistent spacing (space-y-4, gap-4, etc.)

## Next Steps for Development

### Priority Tasks:
1. **Authentication Implementation**
   - Supabase Auth integration
   - Role-based access control
   - Protected routes
   - User session management

2. **State Management**
   - Set up React Query for server state
   - Implement Zustand for client state
   - Create custom hooks

3. **Database Integration**
   - Connect all pages to Supabase
   - Implement CRUD operations
   - Set up real-time subscriptions
   - Add data validation

4. **Additional CRM Features**
   - Call logging modal
   - Meeting creation wizard
   - Visit scheduling
   - Sales transaction form

5. **Analytics & Charts**
   - Integrate Recharts
   - Dashboard charts
   - Performance metrics
   - Trend analysis

6. **File Upload**
   - Marketing materials upload
   - Document management
   - Image optimization
   - File preview

7. **Notifications**
   - Real-time notifications
   - Email notifications
   - SMS integration
   - Push notifications

8. **Reports & Exports**
   - Excel export functionality
   - PDF generation
   - Custom reports
   - Scheduled reports

## Testing
- Unit tests for components
- Integration tests for workflows
- E2E tests for critical paths
- Performance testing

## Deployment

### Recommended Platform: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Environment Variables in Production:
- Set all environment variables in Vercel dashboard
- Enable preview deployments
- Configure custom domain

## Support & Maintenance
- Regular dependency updates
- Security patches
- Performance optimization
- Feature enhancements based on user feedback

## License
Proprietary - All rights reserved

## Contributors
- Senior Full Stack Developer
- Design Team
- Product Owner
- QA Team

---

**Version**: 1.0.0  
**Last Updated**: October 2024  
**Status**: Core modules implemented, ready for database integration
