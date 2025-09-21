import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './ActivityPanel.css';
import ActivityResult from './ActivityResult';
import analyticsService from '../services/analyticsService';
import logo from '../files/image.png';

// Sample data as fallback - moved outside component to avoid dependency issues
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

const ActivityPanel = () => {
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagCategories, setTagCategories] = useState({
    location: [],
    tags: [],
    education_level: []
  });
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load activities data
  useEffect(() => {
    const loadActivities = async () => {
      try {
        console.log('Loading activities data...');
        const activitiesResponse = await fetch('/data/activities_real.json');
        
        if (!activitiesResponse.ok) {
          throw new Error(`HTTP error! status: ${activitiesResponse.status}`);
        }
        
        const activitiesData = await activitiesResponse.json();
        console.log('Activities loaded:', activitiesData.activities?.length || 0);
        
        // Load unique tags data
        console.log('Loading unique tags data...');
        const tagsResponse = await fetch('/data/unique_tags.json');
        
        if (!tagsResponse.ok) {
          throw new Error(`HTTP error loading tags! status: ${tagsResponse.status}`);
        }
        
        const tagsData = await tagsResponse.json();
        console.log('Tags loaded:', tagsData);
        
        if (activitiesData.activities && Array.isArray(activitiesData.activities)) {
          setActivities(activitiesData.activities);
          
          // Use the unique tags from the separate file
          setTagCategories({
            location: tagsData.locations || [],
            tags: tagsData.tags || [],
            education_level: tagsData.education_levels || []
          });
        } else {
          throw new Error('Invalid activities data format');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message);
        // Use sample data as fallback
        setActivities(sampleActivities);
        setTagCategories({
          location: ["celá čr/online", "praha", "zahraničí"],
          tags: ["soutěž", "výjezd do zahraničí", "stáž", "vzdělávání", "dobrovolnictví", "osobní rozvoj"],
          education_level: ["student sš", "student vš", "student zš"]
        });
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
        selectedTags.every(tag => {
          // Check if tag exists in any of the three categories (new structure)
          if (activity.location && Array.isArray(activity.location)) {
            const inLocation = activity.location.includes(tag);
            const inTags = activity.tags && activity.tags.includes(tag);
            const inEducation = activity.education_level && activity.education_level.includes(tag);
            return inLocation || inTags || inEducation;
          } 
          // Handle old structure with combined tags array
          else if (activity.tags && Array.isArray(activity.tags)) {
            return activity.tags.includes(tag);
          }
          return false;
        });
      
      return matchesSearch && matchesTags;
    });
  }, [activities, searchTerm, selectedTags]);

  const handleTagToggle = (tag) => {
    const wasSelected = selectedTags.includes(tag);
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    // Track tag selection/deselection
    analyticsService.trackTagSelection(tag, !wasSelected);
  };

  const handleActivityClick = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    const wasExpanded = expandedActivity === activityId;
    
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
    
    if (activity) {
      if (!wasExpanded) {
        // Track activity expansion
        analyticsService.trackActivityExpand(activity.title, activityId);
      }
      // Always track the click
      analyticsService.trackActivityClick(activity.title, activityId);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    // Track filter clearing
    analyticsService.trackEvent('Clear Filters', 'Activity Panel');
  };

  // Track search actions with debounce effect
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        analyticsService.trackSearch(searchTerm);
      }, 1000); // Debounce search tracking by 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  if (loading) {
    return (
      <div className={`activity-panel expanded`}>
        <div className="activity-panel-header">
          <div className="header-content">
            <img src={logo} alt="Buď aktivní Logo" className="activity-panel-logo" />
            <div className="header-text">
              <h1>Aktivity</h1>
            </div>
          </div>
        </div>
        
          <div className="activity-panel-main">
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p>Načítám aktivity...</p>
            </div>
          </div>
        
      </div>
    );
  }

  return (
    <div className={`activity-panel expanded`}>
      <div className="activity-panel-header">
        <div className="header-content">
          <img src={logo} alt="Buď aktivní Logo" className="activity-panel-logo" />
          <div className="header-text">
            <h1>Aktivity ({filteredActivities.length})</h1>
            <p>Prozkoumejte všechny dostupné aktivity a najděte ty, které vás zajímají</p>
          </div>
        </div>
      </div>

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
            <h3>Filtry podle kategorií</h3>
            
            {/* Location Tags */}
            <div className="tag-category">
              <h4 className="category-title">Lokalita</h4>
              <div className="tags-container">
                {tagCategories.location.map(tag => (
                  <button
                    key={`location-${tag}`}
                    className={`tag location-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* General Tags */}
            <div className="tag-category">
              <h4 className="category-title">Druh aktivity</h4>
              <div className="tags-container">
                {tagCategories.tags.map(tag => (
                  <button
                    key={`tags-${tag}`}
                    className={`tag general-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Education Level Tags */}
            <div className="tag-category">
              <h4 className="category-title">Vzdělání</h4>
              <div className="tags-container">
                {tagCategories.education_level.map(tag => (
                  <button
                    key={`education-${tag}`}
                    className={`tag education-tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
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
                  <div key={activity.id} className="activity-wrapper">
                    <ActivityResult 
                      activity={activity} 
                      showFullContent={expandedActivity === activity.id}
                      onToggleExpand={() => handleActivityClick(activity.id)}
                    />
                    
                    {/* Add permanent link for each activity */}
                    <div className="activity-actions">
                      <Link 
                        to={`/activity/${activity.id}`}
                        className="activity-permalink"
                        onClick={() => analyticsService.trackEvent('Activity Permalink Click', 'Activity Panel', activity.title)}
                      >
                        📋 Zobrazit detaily
                      </Link>
                      <a 
                        href={`/activities/${activity.id}.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="activity-static-link"
                        onClick={() => analyticsService.trackEvent('Static Page Link Click', 'Activity Panel', activity.title)}
                      >
                        🔗 Statická stránka
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

    </div>
  );
};

export default ActivityPanel;