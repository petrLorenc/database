import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './ActivityPanel.css';
import ActivityResult from './ActivityResult';
import analyticsService from '../services/analyticsService';
import logo from '../files/image.png';
import { unprotectData } from '../utils/dataProtection';

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // Show only 50 items at a time

  // Load activities data
  useEffect(() => {
    const loadActivities = async () => {
      try {
        // Load protected data (this should be the only source in production)
        const protectedResponse = await fetch('/data/activities_protected.json');
        if (protectedResponse.ok) {
          const protectedData = await protectedResponse.text();
          const decodedData = unprotectData(protectedData);
          const parsedData = typeof decodedData === 'string' ? JSON.parse(decodedData) : decodedData;
          // Handle the structure {metadata, activities}
          const activitiesArray = parsedData.activities || parsedData;
          setActivities(activitiesArray);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error loading protected activities data:', error);
        // In production, this should not happen - protected data should always be available
        setError('Failed to load activities data');
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Load unique tags data
  useEffect(() => {
    const loadTags = async () => {
      try {
        console.log('Loading unique tags...');
        const response = await fetch('/data/unique_tags.json');
        if (response.ok) {
          const tagsData = await response.json();
          console.log('Tags data loaded:', tagsData);
          setTagCategories({
            location: tagsData.locations || [],
            tags: tagsData.tags || [],
            education_level: tagsData.education_levels || []
          });
        } else {
          console.error('Failed to load tags data:', response.status, response.statusText);
          // Fallback: extract tags from activities if available
          extractTagsFromActivities();
        }
      } catch (error) {
        console.error('Error loading tags data:', error);
        // Fallback: extract tags from activities if available
        extractTagsFromActivities();
      }
    };

    const extractTagsFromActivities = () => {
      if (activities.length > 0) {
        const locations = new Set();
        const tags = new Set();
        const educationLevels = new Set();

        activities.forEach(activity => {
          if (activity.location && Array.isArray(activity.location)) {
            activity.location.forEach(loc => locations.add(loc));
          }
          if (activity.tags && Array.isArray(activity.tags)) {
            activity.tags.forEach(tag => tags.add(tag));
          }
          if (activity.education_level && Array.isArray(activity.education_level)) {
            activity.education_level.forEach(level => educationLevels.add(level));
          }
        });

        setTagCategories({
          location: Array.from(locations).sort(),
          tags: Array.from(tags).sort(),
          education_level: Array.from(educationLevels).sort()
        });
        console.log('Tags extracted from activities');
      }
    };

    loadTags();
  }, [activities]); // Add activities as dependency so it re-runs when activities load

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

  // Paginate the filtered activities for better performance
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTags]);

  const handleTagToggle = useCallback((tag) => {
    const wasSelected = selectedTags.includes(tag);
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    // Track tag selection/deselection
    analyticsService.trackTagSelection(tag, !wasSelected);
  }, [selectedTags]);

  const handleActivityClick = useCallback((activityId) => {
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
  }, [activities, expandedActivity]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedTags([]);
    setCurrentPage(1); // Reset pagination
    // Track filter clearing
    analyticsService.trackEvent('Clear Filters', 'Activity Panel');
  }, []);

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
            {totalPages > 1 && (
              <p style={{fontSize: '14px', opacity: 0.8}}>Strana {currentPage} z {totalPages} ({paginatedActivities.length} aktivit zobrazeno)</p>
            )}
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
              <>
                {/* Pagination controls - top */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Předchozí
                    </button>
                    <span className="pagination-info">
                      Strana {currentPage} z {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Následující →
                    </button>
                  </div>
                )}
                
                <div className="activities-grid">
                  {paginatedActivities.map(activity => (
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
                
                {/* Pagination controls - bottom */}
                {totalPages > 1 && (
                  <div className="pagination-controls">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      ← Předchozí
                    </button>
                    <span className="pagination-info">
                      Strana {currentPage} z {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      Následující →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

    </div>
  );
};

export default ActivityPanel;