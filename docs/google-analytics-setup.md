# Google Analytics Setup Guide

This application now includes Google Analytics 4 (GA4) integration to track user behavior and interactions.

## Setup Instructions

### 1. Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your website
3. Follow the setup wizard to configure your property
4. Note down your **Measurement ID** (format: G-XXXXXXXXXX)

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace `GA_MEASUREMENT_ID` with your actual Measurement ID:
   ```bash
   REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### 3. Deploy and Verify

1. Build and deploy your application:
   ```bash
   npm run build
   ```

2. Visit your deployed website and verify tracking is working:
   - Go to Google Analytics > Reports > Realtime
   - Navigate through your website
   - You should see real-time user activity

## Tracked Events

The application automatically tracks the following user interactions:

### Page Views
- Automatic page view tracking when the app loads

### Activity Panel Interactions
- **Activity Click**: When users click on activity cards
- **Activity Expand**: When users expand activity details
- **Search**: User search queries (debounced to 1 second)
- **Tag Selection**: When users select/deselect tags for filtering
- **Panel Toggle**: When users expand/collapse the activity panel
- **Clear Filters**: When users clear search filters

### Chat Interface Interactions
- **Message Sent**: When users submit chat messages (tracks message length)
- **Chat Toggle**: When users expand/collapse the chat interface
- **Chat Response**: Tracks successful responses and result counts
- **Activity Result Click**: When users interact with activity results in chat
- **Activity Result Expand**: When users expand activity details in chat results

### Error Tracking
- **Application Errors**: Automatic error tracking with location context
- **Chat Errors**: Specific tracking for chat service failures

## Custom Event Structure

All events follow Google Analytics 4 event structure:
- **event_name**: Action being tracked
- **event_category**: Section of the app (e.g., 'Activity Panel', 'Chat Interface')
- **event_label**: Additional context (e.g., activity title, search term)
- **value**: Numeric value when applicable

## Privacy Considerations

- No personally identifiable information (PII) is tracked
- User messages content is not stored in analytics (only message length)
- All tracking complies with GDPR and privacy best practices
- Users' IP addresses are anonymized by default in GA4

## Development Testing

In development mode, you can test analytics by:

1. Setting up a separate GA4 property for development
2. Using the development Measurement ID in your `.env.local`
3. Monitoring the browser console for analytics events
4. Checking the GA4 DebugView for real-time event verification

## Analytics Dashboard

Once data is collected, you can view insights in Google Analytics:

1. **Audience Reports**: User demographics and behavior
2. **Event Reports**: Custom event tracking data
3. **Real-time Reports**: Live user activity
4. **Conversion Reports**: Set up goals and funnels for key actions

## Troubleshooting

### Events Not Showing
- Verify your Measurement ID is correct
- Check browser console for errors
- Ensure ad blockers aren't preventing tracking
- Confirm the environment variable is properly set

### Development vs Production
- Use separate GA4 properties for development and production
- Test thoroughly in development before deploying
- Monitor GA4 DebugView during development

## Additional Configuration

For advanced analytics features, you can extend the `analyticsService.js` file to include:
- Enhanced e-commerce tracking
- Custom user properties
- Advanced conversion tracking
- Cross-domain tracking (if needed)