import React, { useState } from 'react';
import './ActivityResult.css';

const ActivityResult = ({ activity }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="activity-result">
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
          <h3 className="activity-title">{activity.title}</h3>
          <p className="activity-location">{activity.location}</p>
        </div>
      </div>
      
      <div className="activity-content">
        <div 
          className="activity-description"
          dangerouslySetInnerHTML={{
            __html: expanded ? activity.long_description : activity.short_description
          }}
        />
        
        <div className="activity-tags">
          {activity.tags.map((tag, index) => (
            <span key={index} className="activity-tag">
              {tag}
            </span>
          ))}
        </div>
        
        <button 
          className={`activity-expand-button ${expanded ? 'expanded' : ''}`}
          onClick={toggleExpand}
          aria-expanded={expanded}
          aria-label={expanded ? 'Zobrazit méně informací' : 'Zobrazit více informací'}
        >
          {expanded ? 'Ukaž méně' : 'Ukaž více'}
        </button>
      </div>
    </div>
  );
};

export default ActivityResult;