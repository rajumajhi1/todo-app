/**
 * OpenAI API Service
 * This file contains functions for interacting with the OpenAI API.
 */

// SECURITY WARNING: API keys should never be exposed in client-side code
// In a production app, these calls should go through your backend
// The proper way is to use environment variables or a backend service
const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generates a summary of completed tasks using OpenAI.
 * 
 * @param {Array} completedTasks - Array of tasks completed today
 * @param {Array} plannedTasks - Array of tasks planned for tomorrow
 * @returns {Promise<string>} - AI-generated summary
 */
export const generateTaskSummary = async (completedTasks, plannedTasks = []) => {
  try {
    // If using the API - make the call
    if (process.env.REACT_APP_OPENAI_API_KEY) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a task summarizer that creates summaries in this specific format:
              
              1. Format the date at the top in DD.MM.YY format (e.g., "27.03.25")
              2. List each completed task as a numbered item
              3. Add "done" after each completed task
              4. Add double newlines between each item
              
              Example:
              27.03.25
              
              1. BXHT (APDJ) Faults verification done
              
              2. BLK(KIR) Database entry done
              
              3. Bill Paper Preparation done
              
              4. Wrong Alarms Analysis done`
            },
            {
              role: 'user',
              content: `Generate a daily task summary for today (${new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
              }).replace(/\//g, '.')}).

              These tasks were completed today:
              ${JSON.stringify(completedTasks.map(task => task.text))}
              
              These tasks are planned for tomorrow:
              ${JSON.stringify(plannedTasks.map(task => task.text))}
              
              Format the summary exactly as shown in the instructions with the date at the top, and a numbered list with "done" after each completed task. Include double line breaks between items.`
            }
          ],
          max_tokens: 150,
          temperature: 0.3 // Lower temperature for more predictable, factual responses
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    }
    
    // No API key - generate locally
    return generateLocalSummary(completedTasks, plannedTasks);
  } catch (error) {
    console.error('Error generating OpenAI summary:', error);
    return generateLocalSummary(completedTasks, plannedTasks);
  }
};

/**
 * Generate a local summary without API call
 */
function generateLocalSummary(completedTasks, plannedTasks) {
  // Get current date in DD.MM.YY format
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');
  
  // Start with date header
  let summary = `${dateStr}\n\n`;
  
  // Add completed tasks as numbered list
  if (completedTasks.length > 0) {
    completedTasks.forEach((task, index) => {
      summary += `${index + 1}. ${task.text} done\n\n`;
    });
  } else {
    summary += 'No tasks were completed today.\n\n';
  }
  
  // Add planned tasks as continued numbered list if there are any
  if (plannedTasks.length > 0) {
    let startIndex = completedTasks.length + 1;
    plannedTasks.forEach((task, index) => {
      // Don't add tasks that were already included in completed list
      if (!completedTasks.some(t => t.id === task.id)) {
        summary += `${startIndex + index}. ${task.text} planned for tomorrow\n\n`;
      }
    });
  }
  
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