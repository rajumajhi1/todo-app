/**
 * OpenAI API Service
 * This file contains functions for interacting with the OpenAI API.
 */

// SECURITY WARNING: API keys should never be exposed in client-side code
// In a production app, these calls should go through your backend
// The proper way is to use environment variables or a backend service
const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generates a summary of tasks.
 * 
 * @param {Array} completedTasks - Array of tasks completed today
 * @param {Array} plannedTasks - Array of tasks planned for tomorrow
 * @param {Array} pendingTasks - Array of pending tasks
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - Generated summary
 */
export const generateTaskSummary = async (
  completedTasks, 
  plannedTasks = [], 
  pendingTasks = [], 
  options = {}
) => {
  // Default options
  const config = {
    formatOptions: {
      dateFormat: 'DD.MM.YY',
      includeTime: false,
      priorityMarkers: false,
      includeStats: false
    },
    ...options
  };

  try {
    // Generate summary locally
    return generateLocalSummary(completedTasks, pendingTasks, plannedTasks, config.formatOptions);
  } catch (error) {
    console.error('Error generating summary:', error);
    return "Error generating summary. Please try again.";
  }
};

/**
 * Generate a local summary without API call
 * 
 * @param {Array} completedTasks - Array of tasks completed today
 * @param {Array} pendingTasks - Array of pending tasks
 * @param {Array} plannedTasks - Array of tasks planned for tomorrow
 * @param {Object} options - Optional configuration settings
 * @returns {string} - Formatted summary text
 */
function generateLocalSummary(completedTasks, pendingTasks = [], plannedTasks = [], options = {}) {
  console.log('Generating summary with', {
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    plannedTasks: plannedTasks.length,
    options
  });
  
  // Default options
  const config = {
    dateFormat: 'DD.MM.YY',
    includeTime: false,
    completedLabel: 'done',
    pendingLabel: 'pending',
    plannedLabel: 'ongoing, not completed',
    useQuotes: true,
    doubleLineBreaks: true,
    priorityMarkers: false,
    ...options
  };
  
  // Get current date in the requested format
  const today = new Date();
  let dateStr = '';
  
  if (config.dateFormat === 'DD.MM.YY') {
    dateStr = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '.');
  } else if (config.dateFormat === 'MM/DD/YYYY') {
    dateStr = today.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } else if (config.dateFormat === 'YYYY-MM-DD') {
    dateStr = today.toLocaleDateString('en-CA');
  }
  
  // Add time if requested
  if (config.includeTime) {
    const timeStr = today.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    dateStr += ` ${timeStr}`;
  }
  
  // Helper function to format a task
  const formatTask = (task, label) => {
    let priorityPrefix = '';
    
    // Add priority markers if enabled
    if (config.priorityMarkers && task.priority) {
      const markers = {
        high: '🔴 ',
        normal: '🟡 ',
        low: '🟢 '
      };
      priorityPrefix = markers[task.priority] || '';
    }
    
    // Format the task text without quotes and ensure proper spacing
    const taskText = `${priorityPrefix}${task.text}${label}`;
    
    // Add appropriate line breaks
    return taskText + (config.doubleLineBreaks ? '\n\n' : '\n');
  };
  
  // Start with date header
  let summary = `${dateStr}\n\n`;
  
  // Add completed tasks
  if (completedTasks.length > 0) {
    completedTasks.forEach(task => {
      summary += formatTask(task, config.completedLabel);
    });
  }
  
  // Add pending tasks
  if (pendingTasks.length > 0) {
    pendingTasks.forEach(task => {
      summary += formatTask(task, config.pendingLabel);
    });
  }
  
  // Add tasks planned for tomorrow
  if (plannedTasks.length > 0) {
    plannedTasks.forEach(task => {
      summary += formatTask(task, config.plannedLabel);
    });
  }
  
  // Add statistics at the bottom if requested
  if (options.includeStats) {
    const totalTasks = completedTasks.length + pendingTasks.length;
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks.length / totalTasks) * 100) 
      : 0;
    
    summary += `\nSummary: ${completedTasks.length} completed, ${pendingTasks.length} pending`;
    summary += `\nCompletion rate: ${completionRate}%`;
    
    if (plannedTasks.length > 0) {
      summary += `\n${plannedTasks.length} tasks planned for tomorrow`;
    }
  }
  
  console.log('Generated summary:', summary);
  return summary.trim();
}

/**
 * Implementation guide for production:
 * 
 * 1. Create a backend API endpoint that handles OpenAI API calls
 * 2. Send your tasks data to that endpoint
 * 3. Have the backend make the API call to OpenAI using your secure API key
 * 4. Return the response to the client
 * 
 * This prevents exposing your API key in client-side code.
 */ 