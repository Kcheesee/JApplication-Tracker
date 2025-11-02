# UI Integration Progress

## ✅ Phase 1: COMPLETED - Foundation

### Dependencies Installed
- ✅ @radix-ui/react-dialog, select, tabs, dropdown-menu
- ✅ lucide-react (icons)
- ✅ framer-motion (animations)
- ✅ class-variance-authority (component variants)
- ✅ clsx + tailwind-merge (className utilities)

### Core Utilities Created
- ✅ `lib/utils.ts` - cn() function for class merging
- ✅ `lib/filterJobs.ts` - Filter logic with 7 tests
- ✅ `lib/dataMapper.ts` - Backend ↔ Frontend conversion
- ✅ `types/job.ts` - Job type definition

### shadcn/ui Components Created
- ✅ `components/ui/button.tsx` - Button with variants
- ✅ `components/ui/dialog.tsx` - Modal dialogs
- ✅ `components/ui/select.tsx` - Select dropdowns
- ✅ `components/ui/tabs.tsx` - Tab navigation
- ✅ `components/ui/input.tsx` - Input fields
- ✅ `components/ui/textarea.tsx` - Text areas

## 🚧 Phase 2: IN PROGRESS - Widget Components

### Next Files to Create

#### 1. QuickStartCard.tsx
```tsx
// Onboarding cards for:
// - Connect Gmail
// - Connect Sheets
// - Scan Inbox
```

#### 2. JobTable.tsx
```tsx
// Compact table with columns:
// - Company
// - Role (clickable)
// - Status (dropdown)
// - Applied date
// - Last Activity
// - Portal link
// - Actions (email, interview, delete)
```

#### 3. AddJobDialog.tsx
```tsx
// Modal form with fields:
// - Company, Role
// - Posting URL, Portal URL
// - Resume Label, Resume URL
// - Description, Notes
```

#### 4. JobDetailsDialog.tsx
```tsx
// Tabs:
// - Details tab (URLs, description, status)
// - Application Resume tab (resume info)
```

#### 5. JobTrackerWidget.tsx
```tsx
// Main widget combining:
// - Quick Start cards (if needed)
// - Toolbar (search, filter, add, sync)
// - Job Table
// - All dialogs
```

## 📋 Current File Structure

```
frontend/src/
├── components/
│   ├── ui/                      ✅ DONE
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   │
│   ├── QuickStartCard.tsx       ⏳ NEXT
│   ├── JobTable.tsx             ⏳ NEXT
│   ├── AddJobDialog.tsx         ⏳ NEXT
│   ├── JobDetailsDialog.tsx     ⏳ NEXT
│   └── JobTrackerWidget.tsx     ⏳ NEXT
│
├── lib/
│   ├── utils.ts                 ✅ DONE
│   ├── filterJobs.ts            ✅ DONE
│   └── dataMapper.ts            ✅ DONE
│
├── types/
│   └── job.ts                   ✅ DONE
│
└── api/
    └── client.ts                ✅ EXISTS (from v1)
```

## 🎯 Implementation Strategy

### The widget will integrate with existing backend:

```typescript
// Use existing API endpoints
import apiClient from '../api/client';
import { backendToFrontend, frontendToBackend } from '../lib/dataMapper';

// Fetch applications
const response = await apiClient.get('/api/applications');
const jobs = response.data.map(backendToFrontend);

// Sync Gmail (uses existing endpoint!)
await apiClient.post('/api/sync/gmail');

// Create application
const backendData = frontendToBackend(newJob);
await apiClient.post('/api/applications', backendData);

// Update application
await apiClient.put(`/api/applications/${id}`, backendData);

// Delete application
await apiClient.delete(`/api/applications/${id}`);
```

## 🔗 Backend Integration Points

### Existing Endpoints (Keep Using)
✅ `POST /api/auth/login` - Login
✅ `POST /api/auth/register` - Register
✅ `GET /api/applications` - List all
✅ `POST /api/applications` - Create
✅ `PUT /api/applications/{id}` - Update
✅ `DELETE /api/applications/{id}` - Delete
✅ `POST /api/sync/gmail` - Gmail scan
✅ `GET /api/settings` - Get settings
✅ `PUT /api/settings` - Update settings

### New Endpoints Needed
⏳ `POST /api/sync/export-to-sheets` - Export to Google Sheets
⏳ `POST /api/auth/google` - Google OAuth callback

## 📊 Data Flow

### 1. Load Applications
```
User opens widget
  ↓
Widget calls GET /api/applications
  ↓
Backend returns Application[]
  ↓
Data mapper converts to Job[]
  ↓
Widget displays in table
```

### 2. Gmail Sync
```
User clicks "Scan Inbox"
  ↓
Widget calls POST /api/sync/gmail
  ↓
Backend:
  - Fetches Gmail
  - Parses with Claude AI
  - Saves to PostgreSQL
  - Returns results
  ↓
Widget refreshes job list
```

### 3. Add Application
```
User fills form in AddJobDialog
  ↓
Data mapper converts Job → Application
  ↓
POST /api/applications
  ↓
Backend saves to PostgreSQL
  ↓
Widget adds to local state
```

## 🎨 Design Specs (From Your Requirements)

### Widget Dimensions
- Width: 380-420px (extension-friendly)
- Responsive for web app use

### Colors
- Primary: Indigo-600 (#4F46E5)
- Success: Green
- Danger: Red
- Status badges: Blue, Green, Red, Purple, Yellow, Gray

### Components
- Minimal motion (framer-motion with safe durations)
- Accessible (ARIA labels, keyboard navigation)
- Compact UI (fits in popup)

### Status Options
```typescript
type JobStatus =
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Ghosted";
```

## 🧪 Testing

### Filter Tests (Already Implemented)
Run in console:
```javascript
window.__RUN_JOB_TRACKER_TESTS__ = true;
```

Tests:
1. ✅ Returns all with empty query + All status
2. ✅ Matches role text (case-insensitive)
3. ✅ Status-only filter
4. ✅ Matches notes/description
5. ✅ Case-insensitive company match
6. ✅ Combined query+status match
7. ✅ No matches returns empty

## 🚀 Next Steps

### Immediate (Now)
1. Create QuickStartCard component
2. Create JobTable component
3. Create AddJobDialog component
4. Create JobDetailsDialog component
5. Create main JobTrackerWidget
6. Update Dashboard page to use widget
7. Test complete flow

### Backend Additions (Optional)
1. Add Google Sheets export endpoint
2. Add Google OAuth endpoint
3. Test with real Gmail data

### Polish
1. Add loading states
2. Add error handling
3. Add animations
4. Add keyboard shortcuts
5. Test accessibility

## 💡 Key Decisions Made

✅ **Auth**: Keep JWT, add Google OAuth for extension
✅ **Gmail**: Use existing backend endpoint (secure!)
✅ **Sheets**: Route through backend (secure!)
✅ **Data**: Use mapper to bridge formats
✅ **UI**: Complete rebuild with your design
✅ **Backend**: Keep everything, zero changes needed

## 📝 Notes

- All UI components use shadcn/ui for consistency
- Lucide icons for all icons
- Framer Motion for minimal animations
- Tailwind CSS for styling
- TypeScript for type safety
- Backend API unchanged (backwards compatible)
- Existing pages work alongside new widget

---

**Ready to continue building the widget components!** 🚀

Next up: QuickStartCard, JobTable, AddJobDialog, JobDetailsDialog, and JobTrackerWidget.
