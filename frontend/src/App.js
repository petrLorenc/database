import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ChatInterface from './components/ChatInterface';
import ActivityPanel from './components/ActivityPanel';
import analyticsService from './services/analyticsService';
import { Analytics } from '@vercel/analytics/react';

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
      <div className="app">
        <main className="app-main">
          <Routes>
            {/* Main page with ActivityPanel */}
            <Route 
              path="/" 
              element={
                <div className="activity-section">
                  <ActivityPanel />
                </div>
              } 
            />
            
            {/* Test route */}
            <Route 
              path="/test" 
              element={<div style={{padding: '2rem'}}><h1>Test route works!</h1></div>} 
            />
          </Routes>
        </main>
        
        {/* Chat Interface - only show on main page */}
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
        </Routes>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} Buď aktivní - Chatbot | Využívá AI</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;