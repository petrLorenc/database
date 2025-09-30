import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';
import logo from '../files/image.png';
import analyticsService from '../services/analyticsService';

const AboutPage = () => {
  const handleLinkClick = (linkType, url) => {
    analyticsService.trackLinkClick(url, linkType);
  };

  return (
    <div className="about-page">
      {/* Header Section */}
      <section className="about-header">
        <div className="about-header-container">
          <div className="about-header-content">
            <img src={logo} alt="Buď aktivní Logo" className="about-logo" />
            <h1>O projektu Buď aktivní</h1>
            <p className="about-subtitle">
              Komplexní databáze aktivit pro mladé lidi v České republice
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="about-content">
        <div className="about-container">
          
          {/* Mission Section */}
          <section className="about-section">
            <h2>Naše mise</h2>
            <div className="section-content">
              <p>
                Projekt "Buď aktivní" vznikl s cílem pomoci mladým lidem v České republice 
                najít příležitosti pro osobní a profesní rozvoj. Věříme, že každý mladý člověk 
                si zaslouží přístup k informacím o aktivitách, které mohou ovlivnit jeho budoucnost.
              </p>
              <p>
                Naším cílem je centralizovat informace o soutěžích, stážích, vzdělávacích programech, 
                dobrovolnických aktivitách a dalších příležitostech na jednom místě - snadno dostupném 
                a přehledně organizovaném.
              </p>
            </div>
          </section>

          {/* What We Offer Section */}
          <section className="about-section">
            <h2>Co nabízíme</h2>
            <div className="section-content">
              <div className="features-list">
                <div className="feature-item">
                  <h3>🎯 Cílené vyhledávání</h3>
                  <p>Pokročilé filtry podle lokality, typu aktivity a úrovně vzdělání</p>
                </div>
                <div className="feature-item">
                  <h3>💬 AI asistent</h3>
                  <p>Inteligentní chatbot pro rychlé nalezení aktivit podle vašich zájmů</p>
                </div>
                <div className="feature-item">
                  <h3>📱 Responzivní design</h3>
                  <p>Plně funkční na všech zařízeních - počítači, tabletu i telefonu</p>
                </div>
                <div className="feature-item">
                  <h3>🔄 Aktuální informace</h3>
                  <p>Pravidelně aktualizovaná databáze s nejnovějšími příležitostmi</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="about-section">
            <h2>Jak to funguje</h2>
            <div className="section-content">
              <div className="steps-container">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Procházejte aktivity</h3>
                    <p>Použijte vyhledávání nebo filtry k nalezení aktivit, které vás zajímají</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Získejte detaily</h3>
                    <p>Klikněte na aktivitu pro zobrazení všech důležitých informací</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Zapojte se</h3>
                    <p>Následujte odkazy na oficiální stránky organizátorů a přihlaste se</p>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* Contact Section */}
          <section className="about-section">
            <h2>Kontakt a spolupráce</h2>
            <div className="section-content">
              <p>
                Máte návrh na zlepšení? Znáte aktivitu, která v naší databázi chybí? 
                Nebo byste rádi spolupracovali na rozšíření projektu?
              </p>
              <p>
                Navštivte webové stránky koordinátorky projektu:
              </p>
              <div className="contact-actions">
                <a 
                  href="https://helena.budaktivni.cz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="contact-button primary"
                  onClick={() => handleLinkClick('Visit Main Site', 'https://budaktivni.cz')}
                >
                  Navštívit helena.budaktivni.cz
                </a>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <section className="about-footer">
            <div className="about-footer-content">
              <p>
                <strong>Poznámka:</strong> Tento projekt je nezávislý a nekomerční. 
                Cílem je pomoci mladým lidem najít své místo a realizovat svůj potenciál.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AboutPage;