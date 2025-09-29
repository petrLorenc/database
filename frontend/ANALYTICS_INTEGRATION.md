# Analytics Integration Summary

This document summarizes the analytics tracking that has been added to the website.

## Overview
The website now has comprehensive analytics tracking using Google Analytics 4 (GA4) through the `analyticsService.js`. All major user interactions are tracked to provide insights into user behavior.

## Tracking Implementation

### 1. Page Views
- **Main page**: Tracked when users visit the homepage
- **Route changes**: React Router navigation within the SPA is tracked
- **Static HTML pages**: Activity detail pages (e.g., `/activities/123.html`) are served as static HTML and use separate analytics tracking

### 2. Activity Interactions
- **Activity clicks**: When users click on activity cards
- **Activity expansions**: When users expand activity details
- **Static page links**: Links to static HTML activity pages (`/activities/:id.html`)

### 3. Search & Filtering
- **Search queries**: Search terms are tracked (with 1-second debounce)
- **Tag selections**: When users select/deselect filter tags
- **Filter dropdowns**: When users expand/collapse filter dropdowns
- **Clear filters**: When users clear all filters

### 4. Navigation & UI
- **Pagination**: Previous/Next page clicks
- **External links**: Clicks to budaktivni.cz
- **Back navigation**: "Back to Activities" link clicks
- **Chat toggle**: Expanding/collapsing the chat interface

### 5. Chat Interface
- **Message submissions**: Chat queries with message length
- **Chat responses**: Success/error states with result counts
- **Activity result clicks**: Clicks on activities from chat results

### 6. Error Tracking
- **Application errors**: Errors are tracked with location context

## Testing Analytics

### Browser Console Verification
1. Open browser developer tools (F12)
2. Go to the Console tab
3. Look for messages like:
   - "Google Analytics initialized with ID: [ID]"
   - GA4 event calls

### GA4 Real-time Reports
1. Go to Google Analytics dashboard
2. Navigate to Reports → Realtime
3. Interact with the website and watch events appear

### DebugView (GA4)
1. Install Google Analytics Debugger browser extension
2. Enable debug mode
3. View detailed event data in GA4 DebugView

## Architecture Notes

### Static HTML Activity Pages
- Individual activity pages are served as static HTML files (`/activities/:id.html`)
- These pages are pre-generated and don't use React Router
- Analytics for these pages would need to be implemented separately in the static HTML files
- The React SPA only handles the main page with activity listings and search functionality

### React SPA Tracking
- All analytics tracking described above applies to the React single-page application
- Route changes are tracked within the SPA (mainly just the homepage and test routes)
- Activity interactions within the SPA are comprehensively tracked

| Category | Description | Examples |
|----------|-------------|----------|
| User Interaction | General UI interactions | Button clicks, link clicks |
| Activity Panel | Activity-related actions | Search, filter, pagination |
| Chat Interface | Chat-related actions | Message sent, chat toggle |
| Navigation | Navigation events | Page changes, back buttons |
| Activity Detail | Individual activity interactions | Page views, detail clicks |
| Application Error | Error tracking | Failed API calls, JS errors |

## Analytics Service Methods

All tracking is handled through the `analyticsService` singleton:

```javascript
// Page tracking
analyticsService.trackPageView('/activities/123')

// Activity interactions
analyticsService.trackActivityClick(title, id)
analyticsService.trackActivityExpand(title, id)
analyticsService.trackActivityPageView(id, title)

// Search and filters
analyticsService.trackSearch('hiking')
analyticsService.trackTagSelection('outdoor', true)

// Chat interface
analyticsService.trackChatSubmit(messageLength)
analyticsService.trackChatResponse('Success', 5)

// General events
analyticsService.trackEvent(action, category, label, value)
```

## Environment Setup

Make sure the following environment variable is set:
```
REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Without this, analytics will not be initialized and a warning will be logged.