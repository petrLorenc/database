import React, { useState, useEffect } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import ActivityPanel from './components/ActivityPanel';
import logo from './files/image.png';
import analyticsService from './services/analyticsService';

function App() {
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Initialize Google Analytics on app mount
  useEffect(() => {
    analyticsService.initialize();
    analyticsService.trackPageView();
  }, []);

  const toggleChat = () => {
    const newExpanded = !isChatExpanded;
    setIsChatExpanded(newExpanded);
    analyticsService.trackChatToggle(newExpanded);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <img src={logo} alt="Buď aktivní Logo" className="app-logo" />
        </div>
      </header>
      
      <main className="app-main">
        <div className="activity-section">
          <ActivityPanel />
        </div>
      </main>
      
      <ChatInterface 
        isExpanded={isChatExpanded}
        onToggleExpand={toggleChat}
      />
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Buď aktivní - Chatbot | Využívá AI</p>
      </footer>
    </div>
  );
}

export default App;