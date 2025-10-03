import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';
import logo from '../files/image.png';
import analyticsService from '../services/analyticsService';

const Navigation = () => {
  const location = useLocation();

  const handleLinkClick = (page) => {
    analyticsService.trackEvent('Navigation', 'Click', page);
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        {/* Logo and brand */}
        <div className="nav-brand">
          <img src={logo} alt="Buď aktivní Logo" className="nav-logo" />
          <Link 
            to="/" 
            className="nav-brand-text"
            onClick={() => handleLinkClick('Home')}
          >
            Buď aktivní
          </Link>
        </div>

        {/* Navigation menu */}
        <div className="nav-menu">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleLinkClick('Home')}
          >
            Domů
          </Link>
          <Link 
            to="/activities" 
            className={`nav-link ${location.pathname === '/activities' ? 'active' : ''}`}
            onClick={() => handleLinkClick('Activities')}
          >
            Aktivity
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            onClick={() => handleLinkClick('About')}
          >
            O projektu
          </Link>
          <a 
            href="https://helena.budaktivni.cz" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-link external-link"
            onClick={() => analyticsService.trackLinkClick('https://helena.budaktivni.cz', 'Kontakt')}
          >
            Kontakt
          </a>
        </div>

        {/* Mobile menu button (for future mobile implementation) */}
        <div className="nav-mobile-toggle">
          ☰
        </div>
      </div>
    </nav>
  );
};

export default Navigation;