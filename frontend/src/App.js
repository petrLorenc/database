import React from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import logo from './files/image.png';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <img src={logo} alt="Buď aktivní Logo" className="app-logo" />
        </div>
        <h1>Chatbot</h1>
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