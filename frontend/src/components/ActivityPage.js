import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ActivityResult from './ActivityResult';
import analyticsService from '../services/analyticsService';
import logo from '../files/image.png';
import './ActivityPage.css';
import { unprotectData } from '../utils/dataProtection';

const ActivityPage = () => {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load protected data first, fallback to original
        let activitiesData;
        
        try {
          const protectedResponse = await fetch('/data/activities_protected.json');
          if (protectedResponse.ok) {
            const protectedText = await protectedResponse.text();
            if (protectedText && protectedText.trim() !== '') {
              const protectedData = JSON.parse(protectedText);
              activitiesData = unprotectData(protectedData);
            } else {
              throw new Error('Protected data file is empty');
            }
          } else {
            throw new Error('Protected data not available');
          }
        } catch (protectedError) {
          // Fallback to original data
          const activitiesResponse = await fetch('/data/activities_real.json');
          if (!activitiesResponse.ok) {
            throw new Error(`HTTP error! status: ${activitiesResponse.status}`);
          }
          activitiesData = await activitiesResponse.json();
        }
        
        if (!activitiesData.activities || !Array.isArray(activitiesData.activities)) {
          throw new Error('Invalid activities data format');
        }
        
        // Convert URL id to number for comparison
        const targetId = parseInt(id, 10);
        
        const foundActivity = activitiesData.activities.find(a => {
          return parseInt(a.id, 10) === targetId;
        });
        
        if (!foundActivity) {
          setError(`Activity with ID ${targetId} not found`);
          return;
        }
        
        setActivity(foundActivity);
        
        // Track page visit
        analyticsService.trackActivityPageView(foundActivity.id, foundActivity.title);
        
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
          <Link 
            to="/" 
            className="header-link"
            onClick={() => analyticsService.trackEvent('Navigation', 'Activity Page', 'Back to Activities')}
          >
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
          <Link 
            to="/" 
            className="header-link"
            onClick={() => analyticsService.trackEvent('Navigation', 'Activity Page', 'Back to Activities')}
          >
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
        <Link 
          to="/" 
          className="header-link"
          onClick={() => analyticsService.trackEvent('Navigation', 'Activity Page', 'Back to Activities')}
        >
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