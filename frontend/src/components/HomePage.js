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
              Ahoj, vítej v databázi mimoškolních aktivit
            </h1>
            <p className="hero-description">
              Objev příležitosti pro osobní a profesní rozvoj - dobrovolnictví, soutěže, stipendia nebo výjezdy do zahraničí a další vzdělávací programy v České republice i zahraničí.
            </p>
            <div className="hero-actions">
              <Link 
                to="/aktivity" 
                className="cta-button primary"
                onClick={() => handleCTAClick('View Activities')}
              >
                Prozkoumej aktivity
              </Link>
              <Link 
                to="/about" 
                className="cta-button secondary"
                onClick={() => handleCTAClick('Learn More')}
              >
                Zjisti více o projektu
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
              <p>Filtruj aktivity podle lokality, typu a stupně studia. Najděte přesně to, co hledáte.</p>
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
              <p>Využij inteligentního chatbota pro rychlé nalezení aktivit podle vašich zájmů.</p>
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
          <h2>Začni objevovat již dnes</h2>
          <p>Neváhej a prohlédni si všechny dostupné aktivity.</p>
          <Link 
            to="/aktivity" 
            className="cta-button primary large"
            onClick={() => handleCTAClick('Get Started')}
          >
            Začít procházet aktivity
          </Link>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="cta-container">
          <h2>Jste pedagog?</h2>
          <p>Přihlaste se k našemu newsletteru a získejte nejnovější informace o aktivitách a zdrojích pro pedagogy.</p>
          <a 
            href="https://budaktivni.us16.list-manage.com/subscribe?u=3881985dfb31b1cd899eb1789&id=da54e52f98" 
            className="cta-button primary large"
            onClick={() => handleCTAClick('Newsletter Signup')}
          >
            Newsletter pro pedagogy
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
