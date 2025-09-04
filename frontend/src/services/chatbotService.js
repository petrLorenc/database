import axios from 'axios';

// Base URL for API calls - will be replaced with actual API Gateway URL in production
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.example.com/dev';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const chatbotService = {
  /**
   * Send a query to the chatbot API
   * @param {string} query - The user's current query
   * @param {Array} messageHistory - The full conversation history
   * @returns {Promise} - Promise resolving to chatbot response
   */
  async sendQuery(query, messageHistory = []) {
    try {
      // Step 1: Process the query to extract keywords
      const processResponse = await apiClient.post('/query', { 
        query,
        messageHistory 
      });
      const { extracted_tags } = processResponse.data;
      
      if (!extracted_tags || extracted_tags.length === 0) {
        throw new Error('Could not extract keywords from query');
      }
      
      // Step 2: Search for activities based on the extracted tags
      const searchResponse = await apiClient.post('/search', { 
        query, 
        tags: extracted_tags,
        max_results: 3
      });
      
      const { results } = searchResponse.data;
      
      // Step 3: Enhance the results with a conversational response
      const enhanceResponse = await apiClient.post('/enhance', {
        query,
        results
      });
      
      return enhanceResponse.data;
    } catch (error) {
      console.error('Error sending query to chatbot:', error);
      throw error;
    }
  },
  
  /**
   * Log user feedback about search results
   * @param {string} queryId - ID of the original query
   * @param {boolean} helpful - Whether the results were helpful
   * @returns {Promise} - Promise resolving to success status
   */
  async logFeedback(queryId, helpful) {
    try {
      return await apiClient.post('/feedback', { queryId, helpful });
    } catch (error) {
      console.error('Error logging feedback:', error);
      // Don't throw error for feedback logging
      return { success: false };
    }
  }
};

export default chatbotService;