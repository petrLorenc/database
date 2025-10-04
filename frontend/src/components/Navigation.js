import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';
import logo from '../files/image.png';
import analyticsService from '../services/analyticsService';

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Manage body class for preventing scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('nav-menu-open');
    } else {
      document.body.classList.remove('nav-menu-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('nav-menu-open');
    };
  }, [isMobileMenuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.main-navigation')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const handleLinkClick = (page) => {
    analyticsService.trackEvent('Navigation', 'Click', page);
    setIsMobileMenuOpen(false); // Close mobile menu when link is clicked
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
        <div className={`nav-menu ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => handleLinkClick('Home')}
          >
            Domů
          </Link>
          <Link 
            to="/aktivity" 
            className={`nav-link ${location.pathname === '/aktivity' ? 'active' : ''}`}
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
            onClick={() => {
              analyticsService.trackLinkClick('https://helena.budaktivni.cz', 'Kontakt');
              setIsMobileMenuOpen(false);
            }}
          >
            Kontakt
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="nav-mobile-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;