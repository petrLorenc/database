import ReactGA from 'react-ga4';
import { track } from '@vercel/analytics';

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  }

  // Initialize Google Analytics
  initialize() {
    if (this.measurementId && !this.isInitialized) {
      ReactGA.initialize(this.measurementId);
      this.isInitialized = true;
      console.log('Google Analytics initialized with ID:', this.measurementId);
    } else if (!this.measurementId) {
      console.warn('Google Analytics Measurement ID not found in environment variables');
    }
  }

  // Track page views
  trackPageView(path = window.location.pathname) {
    if (this.isInitialized) {
      ReactGA.send({ hitType: "pageview", page: path });
      track(path); // Vercel Analytics
    }
  }

  // Track custom events
  trackEvent(action, category = 'User Interaction', label = '', value = 0) {
    if (this.isInitialized) {
      ReactGA.event({
        action: action,
        category: category,
        label: label,
        value: value,
      });
    }
    track(`${category} - ${action}`); // Vercel Analytics
  }

  // Specific tracking methods for common interactions
  
  // Activity Panel tracking
  trackActivityClick(activityTitle, activityId) {
    this.trackEvent('Activity Click', 'Activity Panel', `${activityTitle} (ID: ${activityId})`);
  }

  trackActivityExpand(activityTitle, activityId) {
    this.trackEvent('Activity Expand', 'Activity Panel', `${activityTitle} (ID: ${activityId})`);
  }

  trackActivityPageView(activityId, activityTitle) {
    // Track the page view event
    this.trackEvent('Activity Page View', 'Activity Detail', `${activityTitle} (ID: ${activityId})`);
    
    // Track as a page view for GA
    if (this.isInitialized) {
      ReactGA.gtag('event', 'page_view', {
        page_title: `Activity: ${activityTitle}`,
        page_location: window.location.href,
        custom_map: {
          custom_activity_id: activityId
        }
      });
    }
  }

  trackSearch(searchTerm) {
    this.trackEvent('Search', 'Activity Panel', searchTerm);
  }

  trackTagSelection(tag, isSelected) {
    const action = isSelected ? 'Tag Selected' : 'Tag Deselected';
    this.trackEvent(action, 'Activity Panel', tag);
  }

  trackPanelToggle(isExpanded) {
    const action = isExpanded ? 'Panel Expanded' : 'Panel Collapsed';
    this.trackEvent(action, 'Activity Panel');
  }

  // Chat Interface tracking
  trackChatSubmit(messageLength) {
    this.trackEvent('Message Sent', 'Chat Interface', 'Message Length', messageLength);
  }

  trackChatToggle(isExpanded) {
    const action = isExpanded ? 'Chat Expanded' : 'Chat Collapsed';
    this.trackEvent(action, 'Chat Interface');
  }

  trackChatResponse(responseType, activitiesCount) {
    this.trackEvent('Chat Response', 'Chat Interface', responseType, activitiesCount);
  }

  trackActivityResultClick(activityTitle, source) {
    this.trackEvent('Activity Result Click', 'Chat Interface', `${activityTitle} from ${source}`);
  }

  // General UI tracking
  trackButtonClick(buttonName, section) {
    this.trackEvent('Button Click', section, buttonName);
  }

  trackLinkClick(linkUrl, linkText) {
    this.trackEvent('Link Click', 'Navigation', `${linkText}: ${linkUrl}`);
  }

  // Error tracking
  trackError(errorMessage, errorLocation) {
    this.trackEvent('Error', 'Application Error', `${errorLocation}: ${errorMessage}`);
  }

  // Performance tracking
  trackTiming(category, variable, value, label = '') {
    if (this.isInitialized) {
      ReactGA.gtag('event', 'timing_complete', {
        name: variable,
        value: value,
        event_category: category,
        event_label: label
      });
    }
  }

  // User engagement tracking
  trackEngagement(engagementTime, section) {
    this.trackEvent('User Engagement', section, 'Time Spent', engagementTime);
  }
}

// Create and export a singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;