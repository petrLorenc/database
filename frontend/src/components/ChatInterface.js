import React, { useState, useRef, useEffect } from 'react';
import chatbotService from '../services/chatbotService';
import './ChatInterface.css';
import ActivityResult from './ActivityResult';

const ChatInterface = ({ isExpanded, onToggleExpand }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: 'Ahoj! Mohu vám pomoci najít aktivity na základě vašich zájmů. Jaké aktivity hledáte?' 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: 'user', text: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    
    // Show loading state
    setLoading(true);
    setIsTyping(true);
    
    // Clear input immediately for better UX
    const currentQuery = query;
    setQuery('');
    
    try {
      // Add typing indicator
      setTimeout(() => {
        setMessages(prev => [...prev, { type: 'bot', text: '', loading: true, timestamp: Date.now() }]);
      }, 500);
      
      // Send query to chatbot service with full message history
      const response = await chatbotService.sendQuery(currentQuery, messages);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.loading));
      setIsTyping(false);
      
      // Add bot response with slight delay for natural feel
      setTimeout(() => {
        const botMessage = { 
          type: 'bot', 
          text: response.response,
          results: response.results,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }, 300);
      
    } catch (error) {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.loading));
      setIsTyping(false);
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          text: 'Omlouvám se, při zpracování vašeho požadavku došlo k chybě. Zkuste to prosím znovu.',
          timestamp: Date.now()
        }
      ]);
      
      console.error('Error querying chatbot:', error);
    } finally {
      setLoading(false);
      // Focus back to input for better UX
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`chat-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="chat-panel-header">
        {isExpanded && (
          <h2>AI Asistent</h2>
        )}
        <button 
          className="toggle-button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'Skrýt chat' : 'Rozbalit chat'}
          title={isExpanded ? 'Skrýt AI asistenta' : 'Zobrazit AI asistenta'}
        >
          {isExpanded ? '→' : '💬'}
        </button>
      </div>

      {isExpanded && (
        <div className="chat-container">
          <div className="chat-messages" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.timestamp || index}`} className={`message-wrapper ${message.type}`}>
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <div className="avatar user-avatar">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  ) : (
                    <div className="avatar bot-avatar">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className={`message ${message.type}`}>
                  {message.loading ? (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  ) : (
                    <>
                      <div className="message-text">{message.text}</div>
                      
                      {message.results && message.results.length > 0 && (
                        <div className="activity-results">
                          {message.results.map((activity) => (
                            <ActivityResult key={activity.id} activity={activity} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                value={query}
                onChange={handleQueryChange}
                onKeyPress={handleKeyPress}
                placeholder="Dotaz na aktivity..."
                disabled={loading}
                aria-label="Napište svůj dotaz zde"
              />
              <button 
                type="submit" 
                className={`chat-submit ${loading || !query.trim() ? 'disabled' : ''}`}
                disabled={loading || !query.trim()}
                aria-label="Odeslat zprávu"
              >
                {loading ? (
                  <div className="loading-spinner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                    </svg>
                  </div>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;