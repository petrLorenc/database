import React, { useState, memo } from 'react';
import './ActivityResult.css';
import analyticsService from '../services/analyticsService';

const ActivityResult = memo(({ 
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
        <div className="activity-thumbnail">
          {activity.thumbnail_url && activity.thumbnail_url.includes('<svg') ? (
            <div 
              dangerouslySetInnerHTML={{ __html: activity.thumbnail_url }}
              aria-label={activity.title}
            />
          ) : activity.thumbnail_url && activity.thumbnail_url.endsWith('.svg') ? (
            <object 
              data={activity.thumbnail_url} 
              type="image/svg+xml"
              alt={activity.title}
              aria-label={activity.title}
            >
              <img src={activity.thumbnail_url} alt={activity.title} loading="lazy" />
            </object>
          ) : (
            <img 
              src={activity.thumbnail_url} 
              alt={activity.title} 
              loading="lazy"
            />
          )}
        </div>
        <div className="activity-title-container">
          <h3 className="activity-title">
            {activity.title}
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
          <div className="activity-actions">
            <button 
              className={`activity-expand-button ${expanded || showFullContent ? 'expanded' : ''}`}
              onClick={toggleExpand}
              aria-expanded={expanded || showFullContent}
              aria-label={expanded || showFullContent ? 'Zobrazit méně informací' : 'Zobrazit více informací'}
            >
              {expanded || showFullContent ? 'Ukaž méně' : 'Ukaž více'}
            </button>
            <a 
              href={`/activities/${activity.id}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="activity-share-link"
            >
              🔗 Sdílet
            </a>
          </div>
        )}
      </div>
    </div>
  );
});

export default ActivityResult;