import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [locationFiltersExpanded, setLocationFiltersExpanded] = useState(false);
  const [activityFiltersExpanded, setActivityFiltersExpanded] = useState(false);
  const [educationFiltersExpanded, setEducationFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for dropdown positioning
  const locationButtonRef = useRef(null);
  const activityButtonRef = useRef(null);
  const educationButtonRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Responsive pagination: 30 items for desktop (3x10), 15 for mobile (1x15)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const itemsPerPage = windowWidth <= 768 ? 15 : 30;
  
  // Listen for window resize to adjust pagination
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset current page when items per page changes due to screen size change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

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

  // Portal-based dropdown component
  const PortalDropdown = ({ isOpen, buttonRef, children, onClose }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        // Account for button border width (2px on each side = 4px total)
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen, buttonRef]);

    useEffect(() => {
      if (isOpen) {
        const handleClickOutside = (event) => {
          if (buttonRef.current && !buttonRef.current.contains(event.target) && 
              !event.target.closest('.filter-dropdown-portal')) {
            onClose();
          }
        };
        const handleScroll = () => onClose();
        const handleResize = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleResize);
        };
      }
    }, [isOpen, onClose, buttonRef]);

    if (!isOpen) return null;

    return createPortal(
      <div 
        className="filter-dropdown-portal"
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          width: position.width,
          zIndex: 9999,
          background: 'white',
          border: '2px solid #667eea',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
          maxHeight: '250px',
          overflowY: 'auto',
          animation: 'slideDown 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {children}
      </div>,
      document.body
    );
  };

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
          {/* New compact filter and search bar */}
          <div className="filter-search-bar">
            <div className="filters-section">
              {/* Location Filter */}
              <div className="filter-group">
                <button 
                  ref={locationButtonRef}
                  className={`filter-dropdown-toggle ${locationFiltersExpanded ? 'expanded' : ''}`}
                  onClick={() => setLocationFiltersExpanded(!locationFiltersExpanded)}
                >
                  <span className="filter-title">Lokalita</span>
                  <span className="filter-count">({tagCategories.location.filter(tag => selectedTags.includes(tag)).length})</span>
                  <span className="dropdown-arrow">{locationFiltersExpanded ? '▲' : '▼'}</span>
                </button>
                <PortalDropdown 
                  isOpen={locationFiltersExpanded} 
                  buttonRef={locationButtonRef}
                  onClose={() => setLocationFiltersExpanded(false)}
                >
                  <div className="tags-container-portal">
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
                </PortalDropdown>
              </div>

              {/* Activity Type Filter */}
              <div className="filter-group">
                <button 
                  ref={activityButtonRef}
                  className={`filter-dropdown-toggle ${activityFiltersExpanded ? 'expanded' : ''}`}
                  onClick={() => setActivityFiltersExpanded(!activityFiltersExpanded)}
                >
                  <span className="filter-title">Druh aktivity</span>
                  <span className="filter-count">({tagCategories.tags.filter(tag => selectedTags.includes(tag)).length})</span>
                  <span className="dropdown-arrow">{activityFiltersExpanded ? '▲' : '▼'}</span>
                </button>
                <PortalDropdown 
                  isOpen={activityFiltersExpanded} 
                  buttonRef={activityButtonRef}
                  onClose={() => setActivityFiltersExpanded(false)}
                >
                  <div className="tags-container-portal">
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
                </PortalDropdown>
              </div>

              {/* Education Level Filter */}
              <div className="filter-group">
                <button 
                  ref={educationButtonRef}
                  className={`filter-dropdown-toggle ${educationFiltersExpanded ? 'expanded' : ''}`}
                  onClick={() => setEducationFiltersExpanded(!educationFiltersExpanded)}
                >
                  <span className="filter-title">Vzdělání</span>
                  <span className="filter-count">({tagCategories.education_level.filter(tag => selectedTags.includes(tag)).length})</span>
                  <span className="dropdown-arrow">{educationFiltersExpanded ? '▲' : '▼'}</span>
                </button>
                <PortalDropdown 
                  isOpen={educationFiltersExpanded} 
                  buttonRef={educationButtonRef}
                  onClose={() => setEducationFiltersExpanded(false)}
                >
                  <div className="tags-container-portal">
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
                </PortalDropdown>
              </div>
            </div>

            {/* Search section on the right */}
            <div className="search-section-right">
              {(searchTerm || selectedTags.length > 0) && (
                <button 
                  className="clear-filters-button"
                  onClick={clearFilters}
                >
                  Vymazat filtry
                </button>
              )}

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