import React, { useState, useEffect, useMemo } from 'react';
import './ActivityPanel.css';

const ActivityPanel = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded to show activities

  // Sample data as fallback
  const sampleActivities = [
    {
      id: 1,
      title: "Středoškolská odborná činnost",
      tags: ["soutěž", "student sš", "celá čr/online"],
      short_description: "SOČ je prestižní soutěž pro středoškolské studenty. Ti nejlepší mají možnost pokračovat na zahraniční soutěže.",
      long_description: "SOČ je prestižní soutěž pro středoškolské studenty. Ti nejlepší mají možnost pokračovat na zahraniční soutěže. Pro řadu účastníků je soutěž počátkem jejich vědecké kariéry.",
      thumbnail_url: "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
      location: "Česká republika"
    },
    {
      id: 2,
      title: "AIESEC stáže",
      tags: ["výjezd do zahraničí", "stáž"],
      short_description: "S AIESEC máš možnost vyjet na dobrovolnickou stáž nehledě na to, zda jsi už na vysoké nebo už ne.",
      long_description: "S AIESEC máš možnost vyjet na dobrovolnickou stáž nehledě na to, zda jsi už na vysoké nebo už ne, jako student můžeš vyjet na stáže ve startupech.",
      thumbnail_url: "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
      location: "Česká republika"
    },
    {
      id: 3,
      title: "Erasmus+ projekty",
      tags: ["výjezd do zahraničí", "vzdělávání", "student vš"],
      short_description: "Erasmus+ nabízí možnosti studia a stáží v zahraničí pro studenty vysokých škol.",
      long_description: "Erasmus+ je program Evropské unie pro vzdělávání, odbornou přípravu, mládež a sport. Nabízí možnosti studia a stáží v zahraničí.",
      thumbnail_url: "https://avatars.githubusercontent.com/u/7677243?s=48&v=4",
      location: "Evropa"
    }
  ];

  // Load activities data
  useEffect(() => {
    const loadActivities = async () => {
      try {
        console.log('Loading activities data...');
        const response = await fetch('/data/activities_real.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Activities loaded:', data.activities?.length || 0);
        
        if (data.activities && Array.isArray(data.activities)) {
          setActivities(data.activities);
          
          // Extract unique tags
          const tags = new Set();
          data.activities.forEach(activity => {
            if (activity.tags && Array.isArray(activity.tags)) {
              activity.tags.forEach(tag => tags.add(tag));
            }
          });
          setAllTags([...tags].sort());
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error loading activities:', error);
        setError(error.message);
        // Use sample data as fallback
        setActivities(sampleActivities);
        setAllTags(["soutěž", "student sš", "celá čr/online", "výjezd do zahraničí", "stáž", "vzdělávání", "student vš"]);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Filter activities based on search term and selected tags
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = searchTerm === '' || 
        (activity.title && activity.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.short_description && activity.short_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (activity.long_description && activity.long_description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTags = selectedTags.length === 0 || 
        (activity.tags && selectedTags.every(tag => activity.tags.includes(tag)));
      
      return matchesSearch && matchesTags;
    });
  }, [activities, searchTerm, selectedTags]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleActivityClick = (activityId) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) {
    return (
      <div className={`activity-panel ${isExpanded ? 'expanded' : ''}`}>
        <div className="activity-panel-header">
          <button className="toggle-button" onClick={togglePanel}>
            {isExpanded ? '→' : '←'}
          </button>
          {isExpanded && (
            <>
              <h1>Aktivity</h1>
            </>
          )}
        </div>
        {isExpanded && (
          <div className="activity-panel-main">
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p>Načítám aktivity...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`activity-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="activity-panel-header">
        <button className="toggle-button" onClick={togglePanel}>
          {isExpanded ? '→' : '←'}
        </button>
        {isExpanded && (
          <>
            <h1>Aktivity ({filteredActivities.length})</h1>
            <p>Prozkoumejte všechny dostupné aktivity a najděte ty, které vás zajímají</p>
          </>
        )}
      </div>

      {isExpanded && (
        <div className="activity-panel-main">
          <div className="search-section">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Hledat aktivity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            
            {(searchTerm || selectedTags.length > 0) && (
              <button 
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Vymazat filtry
              </button>
            )}
          </div>

          <div className="tags-section">
            <h3>Filtry podle tagů</h3>
            <div className="tags-container">
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="activities-list">
            {filteredActivities.length === 0 ? (
              <div className="no-results">
                <p>Žádné aktivity neodpovídají vašim kritériím.</p>
                {error && <p style={{color: '#6c757d', fontSize: '12px'}}>Aktuálně zobrazuji ukázková data.</p>}
              </div>
            ) : (
              <div className="activities-grid">
                {filteredActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className={`activity-card ${expandedActivity === activity.id ? 'expanded' : ''}`}
                    onClick={() => handleActivityClick(activity.id)}
                  >
                    <div className="activity-header">
                      <img 
                        src={activity.thumbnail_url || "https://avatars.githubusercontent.com/u/7677243?s=48&v=4"} 
                        alt={activity.title}
                        className="activity-thumbnail"
                        onError={(e) => {
                          e.target.src = "https://avatars.githubusercontent.com/u/7677243?s=48&v=4";
                        }}
                      />
                      <div className="activity-info">
                        <h4 className="activity-title">{activity.title}</h4>
                        <p className="activity-location">{activity.location || "Česká republika"}</p>
                        <div className="activity-tags">
                          {(activity.tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="tag-chip">{tag}</span>
                          ))}
                          {(activity.tags || []).length > 3 && (
                            <span className="tag-chip more">+{activity.tags.length - 3}</span>
                          )}
                        </div>
                      </div>
                      <div className="expand-icon">
                        {expandedActivity === activity.id ? '−' : '+'}
                      </div>
                    </div>
                    
                    <p className="activity-description">
                      {activity.short_description}
                    </p>
                    
                    {expandedActivity === activity.id && (
                      <div className="activity-expanded">
                        <div className="activity-full-description"
                             dangerouslySetInnerHTML={{ 
                               __html: activity.long_description || activity.short_description 
                             }}
                        />
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="activity-all-tags">
                            <strong>Všechny tagy:</strong>
                            <div className="tags-list">
                              {activity.tags.map(tag => (
                                <span key={tag} className="tag-chip">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPanel;