import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ActivityResult.css';
import analyticsService from '../services/analyticsService';

const ActivityResult = ({ 
  activity, 
  showFullContent = false, 
  onToggleExpand = null,
  isStandalonePage = false 
}) => {
  const [expanded, setExpanded] = useState(showFullContent);

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(); // Use parent's handler when in ActivityPanel
    } else {
      const newExpanded = !expanded;
      setExpanded(newExpanded);
      // Track activity result click and expansion
      analyticsService.trackActivityResultClick(activity.title, isStandalonePage ? 'Standalone Page' : 'Chat Interface');
      if (newExpanded) {
        analyticsService.trackEvent('Activity Result Expand', isStandalonePage ? 'Standalone Page' : 'Chat Interface', activity.title);
      }
    }
  };

  return (
    <div className={`activity-result ${isStandalonePage ? 'standalone' : ''}`}>
      {/* SEO enhancement for standalone pages */}
      {isStandalonePage && (
        <>
          {/* These meta tags would be better handled by React Helmet */}
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": activity.title,
              "description": activity.short_description?.replace(/<[^>]*>/g, '') || '',
              "location": activity.location || 'Česká republika',
              "image": activity.thumbnail_url
            })}
          </script>
        </>
      )}

      <div className="activity-header">
        <img 
          src={activity.thumbnail_url} 
          alt={activity.title}
          className="activity-thumbnail"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-image.jpg'; // Fallback image
          }}
        />
        <div className="activity-title-container">
          <h3 className="activity-title">
            {isStandalonePage ? (
              activity.title
            ) : (
              <Link 
                to={`/activity/${activity.id}`} 
                className="activity-title-link"
                onClick={() => analyticsService.trackEvent('Activity Title Click', 'Activity Panel', activity.title)}
              >
                {activity.title}
              </Link>
            )}
          </h3>
          <p className="activity-location">{activity.location}</p>
        </div>
      </div>
      
      <div className="activity-content">
        <div 
          className="activity-description"
          dangerouslySetInnerHTML={{
            __html: (expanded || showFullContent) ? activity.long_description : activity.short_description
          }}
        />
        
        <div className="activity-tags">
          {(() => {
            // Handle different data structures
            let allActivityTags = [];
            
            // Check if this is the new structure with separate arrays
            if (activity.location && Array.isArray(activity.location)) {
              allActivityTags = [
                ...(activity.location || []),
                ...(activity.tags || []),
                ...(activity.education_level || [])
              ];
            } 
            // Handle the real data structure where tags is an array and location is a string
            else if (activity.tags && Array.isArray(activity.tags)) {
              allActivityTags = activity.tags;
            }
            
            return allActivityTags.map((tag, index) => (
              <span key={index} className="activity-tag">{tag}</span>
            ));
          })()}
        </div>
        
        {!isStandalonePage && (
          <button 
            className={`activity-expand-button ${expanded || showFullContent ? 'expanded' : ''}`}
            onClick={toggleExpand}
            aria-expanded={expanded || showFullContent}
            aria-label={expanded || showFullContent ? 'Zobrazit méně informací' : 'Zobrazit více informací'}
          >
            {expanded || showFullContent ? 'Ukaž méně' : 'Ukaž více'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivityResult;