import React, { useState } from 'react';
import chatbotService from '../services/chatbotService';
import './ChatInterface.css';
import ActivityResult from './ActivityResult';

const ChatInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: 'Ahoj! Mohu vám pomoci najít aktivity na základě vašich zájmů. Jaké aktivity hledáte?' 
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: 'user', text: query };
    setMessages([...messages, userMessage]);
    
    // Show loading state
    setLoading(true);
    
    try {
      // Add loading message
      setMessages(prev => [...prev, { type: 'bot', text: '...', loading: true }]);
      
      // Send query to chatbot service with full message history
      const response = await chatbotService.sendQuery(query, messages);
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.loading));
      
      // Add bot response
      const botMessage = { 
        type: 'bot', 
        text: response.response,
        results: response.results
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.loading));
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          text: 'Omlouvám se, při zpracování vašeho požadavku došlo k chybě. Zkuste to prosím znovu.' 
        }
      ]);
      
      console.error('Error querying chatbot:', error);
    } finally {
      setLoading(false);
      setQuery(''); // Clear input field
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-text">{message.text}</div>
            
            {message.results && message.results.length > 0 && (
              <div className="activity-results">
                {message.results.map((activity) => (
                  <ActivityResult key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="loading-indicator">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        )}
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          value={query}
          onChange={handleQueryChange}
          placeholder="Dotaz na aktivity..."
          disabled={loading}
        />
        <button 
          type="submit" 
          className="chat-submit" 
          disabled={loading || !query.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;