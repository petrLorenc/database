import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import ActivityPanel from './components/ActivityPanel';
import AboutPage from './components/AboutPage';
import ChatInterface from './components/ChatInterface';
import analyticsService from './services/analyticsService';

// Component to track route changes
function RouteTracker() {
  const location = useLocation();
  
  useEffect(() => {
    analyticsService.trackPageView(location.pathname);
  }, [location]);
  
  return null;
}

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
    <Router>
      <RouteTracker />
      <div className="app">
        <Navigation />
        <main className="app-main">
          <Routes>
            {/* Home page */}
            <Route path="/" element={<HomePage />} />
            
            {/* Activities page */}
            <Route 
              path="/aktivity" 
              element={
                <div className="activity-section">
                  <ActivityPanel />
                </div>
              } 
            />

            {/* About page */}
            <Route path="/about" element={<AboutPage />} />
            
            {/* Test route */}
            <Route 
              path="/test" 
              element={<div style={{padding: '2rem'}}><h1>Test route works!</h1></div>} 
            />
          </Routes>
        </main>
        
        {/* Chat Interface - show on specific pages */}
        <Routes>
          <Route 
            path="/" 
            element={
              <ChatInterface 
                isExpanded={isChatExpanded}
                onToggleExpand={toggleChat}
              />
            } 
          />
          <Route 
            path="/aktivity" 
            element={
              <ChatInterface 
                isExpanded={isChatExpanded}
                onToggleExpand={toggleChat}
              />
            } 
          />
        </Routes>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Buď aktivní - Chatbot | Využívá AI</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;