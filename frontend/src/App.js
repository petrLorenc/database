import React from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Activity Search Chatbot</h1>
        <p>Ask about activities in natural language</p>
      </header>
      
      <main className="app-main">
        <ChatInterface />
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Activity Database | Powered by AI</p>
      </footer>
    </div>
  );
}

export default App;