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
              <strong>Buď aktivní</strong> je databáze studentských příležitostí a mimoškolních příležitostí pro studenty od základní po vysokou školu. Ať už jsi z Aše nebo Opavy, na základce nebo na vysoké, <strong>v databázi si určitě najdeš aktivitu, která pro tebe bude ta pravá.</strong> Databáze vznikla v roce 2018 a najdeš v ní více jak 340 aktivit od dobrovolnictví, přes výjezdy do zahraničí až po studentské soutěže. 
</p>
<p>
Nezapomeň sledovat instagram Buď aktivní, kde najdeš aktuální příležitosti. 
</p>
<p>
Řešíš svůj osobní rozvoj? Hledáš brigádu nebo potřebuješ pomoci s přípravou na pohovor? Neváhej se ozvat pro kariérní konzultaci. 
</p>
<p>
Pro pedagogy a pracovníky s mládeží zasíláme Občasník Buď aktivní s přehledem nových aktivit a aktuálních příležitostí. Přihlaste se k jeho odběru  .
</p>
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
                    <h3>Procházej aktivity</h3>
                    <p>Použij vyhledávání nebo filtry k nalezení aktivit, které tě zajímají</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Získej detaily</h3>
                    <p>Klikni na aktivitu pro zobrazení všech důležitých informací</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Zapoj se</h3>
                    <p>Následuj odkazy na oficiální stránky organizátorů a přihlas se</p>
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
                Máš návrh na zlepšení? Znáš aktivitu, která v naší databázi chybí? 
                Nebo bys rád spolupracoval na rozšíření projektu?
              </p>
              <p>
                Navštiv webové stránky koordinátorky projektu:
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