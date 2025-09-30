import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import logo from '../files/image.png';
import analyticsService from '../services/analyticsService';

const HomePage = () => {
  const handleCTAClick = (action) => {
    analyticsService.trackEvent('Homepage CTA', 'Click', action);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-logo">
              <img src={logo} alt="Buď aktivní Logo" className="hero-logo-image" />
            </div>
            <h1 className="hero-title">
              Vítejte v databázi aktivit pro mladé
            </h1>
            <p className="hero-description">
              Objevte příležitosti pro osobní a profesní rozvoj. Najděte aktivity, 
              soutěže, stáže a vzdělávací programy určené speciálně pro mladé lidi v České republice.
            </p>
            <div className="hero-actions">
              <Link 
                to="/activities" 
                className="cta-button primary"
                onClick={() => handleCTAClick('View Activities')}
              >
                Prozkoumat aktivity
              </Link>
              <Link 
                to="/about" 
                className="cta-button secondary"
                onClick={() => handleCTAClick('Learn More')}
              >
                Více o projektu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">Co nabízíme</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Cílené vyhledávání</h3>
              <p>Filtrujte aktivity podle lokality, typu a stupně studia. Najděte přesně to, co hledáte.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Rozmanité příležitosti</h3>
              <p>Soutěže, stáže, vzdělávací programy, dobrovolnictví a mnoho dalšího - vše na jednom místě.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Lokální i mezinárodní</h3>
              <p>Objevte možnosti jak v České republice, tak příležitosti pro výjezdy do zahraničí.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>AI asistent</h3>
              <p>Využijte inteligentního chatbota pro rychlé nalezení aktivit podle vašich zájmů.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">340+</div>
              <div className="stat-label">Aktivit v databázi</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">15+</div>
              <div className="stat-label">Různých kategorií</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Zdarma přístupné</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Začněte objevovat již dnes</h2>
          <p>Neváhejte a prohlédněte si všechny dostupné aktivity. Váš další krok k rozvoju je jen klik daleko.</p>
          <Link 
            to="/activities" 
            className="cta-button primary large"
            onClick={() => handleCTAClick('Get Started')}
          >
            Začít procházet aktivity
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
