import axios from 'axios';

// Runtime config loader: fetch /config.json at app startup (served from the same host)
// Falls back to REACT_APP_API_BASE_URL (build-time) or a safe default if config.json isn't available.
let runtimeConfig = null;

async function loadRuntimeConfig() {
  if (runtimeConfig) return runtimeConfig;
  try {
    const res = await fetch('/config.json', { cache: 'no-cache' });
    if (res.ok) {
      runtimeConfig = await res.json();
    } else {
      // fallback to environment variable embedded at build time or a default
      runtimeConfig = { API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.example.com/dev' };
    }
  } catch (err) {
    runtimeConfig = { API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.example.com/dev' };
  }
  return runtimeConfig;
}

// Create an axios instance after loading runtime config. We recreate the client lazily so
// the app can change config.json in production without rebuilding.
async function getApiClient() {
  const cfg = await loadRuntimeConfig();
  return axios.create({
    baseURL: cfg.API_BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export const chatbotService = {
  /**
   * Send a query to the chatbot API
   * @param {string} query - The user's current query
   * @param {Array} messageHistory - The full conversation history
   * @returns {Promise} - Promise resolving to chatbot response
   */
  async sendQuery(query, messageHistory = []) {
    try {
      const client = await getApiClient();
      // Step 1: Process the query to extract keywords
      const processResponse = await client.post('/process-query', { 
        query,
        messageHistory 
      });
      const { extracted_tags } = processResponse.data;
      
      if (!extracted_tags || extracted_tags.length === 0) {
        throw new Error('Could not extract keywords from query');
      }
      
      // Step 2: Search for activities based on the extracted tags
      const searchResponse = await client.post('/search', { 
        query, 
        tags: extracted_tags,
        max_results: 3
      });
      
      const { results } = searchResponse.data;
      
      // Step 3: Enhance the results with a conversational response
      const enhanceResponse = await client.post('/enhance', {
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
      const client = await getApiClient();
      return await client.post('/feedback', { queryId, helpful });
    } catch (error) {
      console.error('Error logging feedback:', error);
      // Don't throw error for feedback logging
      return { success: false };
    }
  }
};

export default chatbotService;