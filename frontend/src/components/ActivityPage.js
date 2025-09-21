import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ActivityResult from './ActivityResult';
import analyticsService from '../services/analyticsService';
import logo from '../files/image.png';
import './ActivityPage.css';

const ActivityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('ActivityPage: Loading activities data for ID:', id);
        
        // Load data exactly like ActivityPanel does
        const activitiesResponse = await fetch('/data/activities_real.json');
        
        if (!activitiesResponse.ok) {
          throw new Error(`HTTP error! status: ${activitiesResponse.status}`);
        }
        
        const activitiesData = await activitiesResponse.json();
        console.log('ActivityPage: Activities loaded:', activitiesData.activities?.length || 0);
        
        if (!activitiesData.activities || !Array.isArray(activitiesData.activities)) {
          throw new Error('Invalid activities data format');
        }
        
        // Convert URL id to number for comparison
        const targetId = parseInt(id, 10);
        console.log('ActivityPage: Looking for activity with ID:', targetId);
        
        const foundActivity = activitiesData.activities.find(a => {
          return parseInt(a.id, 10) === targetId;
        });
        
        if (!foundActivity) {
          console.error('ActivityPage: Activity not found for ID:', targetId);
          console.log('ActivityPage: Available IDs (first 10):', 
            activitiesData.activities.slice(0, 10).map(a => a.id));
          setError(`Activity with ID ${targetId} not found`);
          return;
        }
        
        console.log('ActivityPage: Found activity:', foundActivity.title);
        setActivity(foundActivity);
        
        // Track page visit
        analyticsService.trackActivityPageView(foundActivity.title, id);
        
      } catch (err) {
        console.error('ActivityPage: Error loading activity:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadActivity();
    } else {
      setError('No activity ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="activity-page">
        <div className="activity-page-header">
          <Link to="/" className="header-link">
            <img src={logo} alt="Buď aktivní Logo" className="activity-page-logo" />
            <span className="back-text">← Zpět na aktivity</span>
          </Link>
        </div>
        <div className="activity-page-content">
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Načítám aktivitu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="activity-page">
        <div className="activity-page-header">
          <Link to="/" className="header-link">
            <img src={logo} alt="Buď aktivní Logo" className="activity-page-logo" />
            <span className="back-text">← Zpět na aktivity</span>
          </Link>
        </div>
        <div className="activity-page-content">
          <div className="error-container">
            <h2>Aktivita nenalezena</h2>
            <p>Požadovaná aktivita neexistuje nebo byla odstraněna.</p>
            <p style={{color: '#6c757d', fontSize: '14px'}}>ID: {id}</p>
            {error && <p style={{color: '#dc3545', fontSize: '14px'}}>Chyba: {error}</p>}
            <Link to="/" className="back-button">
              ← Zpět na všechny aktivity
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-page-header">
        <Link to="/" className="header-link">
          <img src={logo} alt="Buď aktivní Logo" className="activity-page-logo" />
          <span className="back-text">← Zpět na aktivity</span>
        </Link>
      </div>
      
      <div className="activity-page-content">
        <div className="activity-page-container">
          <ActivityResult 
            activity={activity} 
            showFullContent={true}
            isStandalonePage={true}
          />
          
          <div className="activity-page-actions">
            <a 
              href={`/activities/${activity.id}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="static-page-link"
              onClick={() => analyticsService.trackEvent('Static Page Link Click', 'Activity Page', activity.title)}
            >
              📄 Statická verze pro sdílení
            </a>
            <Link 
              to="/" 
              className="chat-link"
              onClick={() => analyticsService.trackEvent('Chat Link Click', 'Activity Page', activity.title)}
            >
              💬 Najít podobné aktivity
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;