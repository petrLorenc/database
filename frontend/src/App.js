import React from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Buď aktivní - Chatbot </h1>
        <p>Najdi aktivity na základě svých zájmů</p>
      </header>
      
      <main className="app-main">
        <ChatInterface />
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Buď aktivní - Chatbot | Využívá AI</p>
      </footer>
    </div>
  );
}

export default App;