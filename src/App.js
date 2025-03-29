import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoFilter from './components/TodoFilter';
import { generateTaskSummary as openAiGenerateSummary } from './services/openai';
import './App.css';

// Storage key for localStorage
const STORAGE_KEY = 'todo-list-data';

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      return JSON.parse(savedTodos);
    } else {
      return [];
    }
  });
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [tvMode, setTvMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showPastCompletedTasks, setShowPastCompletedTasks] = useState(false);

  // Save to localStorage whenever todos change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error saving todos to localStorage:', error);
      alert('Failed to save your todos. Your storage might be full.');
    }
  }, [todos]);

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    
    document.body.className = prefersDarkMode ? 'dark-mode' : '';
  }, []);

  const addTodo = (text, priority = 'medium') => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
      completedAt: null,
      plannedForTomorrow: false
    };
    setTodos([...todos, newTodo]);
  };

  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const isBeingCompleted = !todo.completed;
    const completedAt = isBeingCompleted ? new Date().toISOString() : null;
    
    console.log(`Toggling task "${todo.text}", completed: ${isBeingCompleted}, setting completedAt: ${completedAt}`);
    
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { 
        ...todo, 
        completed: !todo.completed,
        completedAt: completedAt
      } : todo
    );
    
    setTodos(updatedTodos);
    
    // Show visual feedback for completed tasks
    if (isBeingCompleted) {
      // Task is being marked as completed
      const todoElement = document.querySelector(`[data-id="${id}"]`);
      if (todoElement) {
        todoElement.classList.add('highlight-complete');
        setTimeout(() => {
          todoElement.classList.remove('highlight-complete');
        }, 1000);
      }
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };
  
  const editTodo = (id, newText) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  };
  
  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Export todos to text file
  const exportTodos = () => {
    try {
      // Create a readable text representation of todos
      let textContent = "TODO LIST EXPORT\n";
      textContent += `Date: ${new Date().toLocaleString()}\n`;
      textContent += `Total Tasks: ${todos.length}\n`;
      textContent += `Completed: ${todos.filter(todo => todo.completed).length}\n`;
      textContent += `Pending: ${todos.filter(todo => !todo.completed).length}\n\n`;
      textContent += "---------------------------------------------\n\n";
      
      // Group todos by status
      textContent += "PENDING TASKS:\n\n";
      const pendingTodos = todos.filter(todo => !todo.completed);
      if (pendingTodos.length === 0) {
        textContent += "No pending tasks\n";
      } else {
        pendingTodos.forEach((todo, index) => {
          textContent += `${index + 1}. [${todo.priority.toUpperCase()}] ${todo.text}\n`;
          textContent += `   Created: ${new Date(todo.createdAt).toLocaleString()}\n\n`;
        });
      }
      
      textContent += "\nCOMPLETED TASKS:\n\n";
      const completedTodos = todos.filter(todo => todo.completed);
      if (completedTodos.length === 0) {
        textContent += "No completed tasks\n";
      } else {
        completedTodos.forEach((todo, index) => {
          textContent += `${index + 1}. [${todo.priority.toUpperCase()}] ${todo.text}\n`;
          textContent += `   Created: ${new Date(todo.createdAt).toLocaleString()}\n`;
          if (todo.completedAt) {
            textContent += `   Completed: ${new Date(todo.completedAt).toLocaleString()}\n\n`;
          }
        });
      }
      
      // Create and download the text file
      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `todo-list-export-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error exporting todos:', error);
      alert('Failed to export your todos. Please try again.');
    }
  };

  // Import todos from JSON file
  const importTodos = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTodos = JSON.parse(e.target.result);
        if (Array.isArray(importedTodos)) {
          if (window.confirm('This will replace your current todos. Continue?')) {
            setTodos(importedTodos);
          }
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error importing todos:', error);
        alert('Failed to import todos. The file might be corrupted or in the wrong format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = null;
  };

  // Improve the isToday function to be more robust
  const isToday = (dateString) => {
    // If no date is provided, it's not today
    if (!dateString) return false;
    
    try {
      // Create Date objects
      const inputDate = new Date(dateString);
      const currentDate = new Date();
      
      // Make sure the date is valid
      if (isNaN(inputDate.getTime())) {
        console.warn('Invalid date:', dateString);
        return false;
      }
      
      // Compare year, month, and day
      return inputDate.getFullYear() === currentDate.getFullYear() &&
             inputDate.getMonth() === currentDate.getMonth() &&
             inputDate.getDate() === currentDate.getDate();
    } catch (error) {
      console.error('Error in isToday function:', error);
      return false;
    }
  };

  // Add this after the isToday function to verify it works correctly
  // This function will run once when the component mounts
  useEffect(() => {
    // Test the isToday function with different date cases
    const currentTime = new Date();
    const nowIso = currentTime.toISOString();
    
    const yesterdayTime = new Date();
    yesterdayTime.setDate(yesterdayTime.getDate() - 1);
    const yesterdayIso = yesterdayTime.toISOString();
    
    const tomorrowTime = new Date();
    tomorrowTime.setDate(tomorrowTime.getDate() + 1);
    const tomorrowIso = tomorrowTime.toISOString();
    
    console.log('Date comparison tests:');
    console.log('isToday(null):', isToday(null));
    console.log('isToday(undefined):', isToday(undefined));
    console.log('isToday(nowIso):', isToday(nowIso), nowIso);
    console.log('isToday(yesterdayIso):', isToday(yesterdayIso), yesterdayIso);
    console.log('isToday(tomorrowIso):', isToday(tomorrowIso), tomorrowIso);
  }, []);

  // Add this function to toggle visibility of past completed tasks
  const togglePastCompletedTasks = () => {
    setShowPastCompletedTasks(!showPastCompletedTasks);
  };

  // Update the filteredTodos to show all completed tasks when 'all' filter is selected
  const filteredTodos = todos
    .filter((todo) => {
      // First filter by status (active, completed, all, today, planned)
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      if (filter === 'today') {
        // Show tasks created today or completed today or planned for tomorrow
        return isToday(todo.createdAt) || 
               (todo.completed && isToday(todo.completedAt)) || 
               todo.plannedForTomorrow;
      }
      if (filter === 'planned') return todo.plannedForTomorrow;
      return true; // 'all' filter
    })
    .filter((todo) => {
      // When 'all' filter is selected, show all tasks regardless of completion date
      if (filter === 'all') return true;
      
      // Always show today's completed tasks
      if (todo.completed && isToday(todo.completedAt)) return true;
      
      // For other completed tasks, check the showPastCompletedTasks setting
      // unless we're explicitly using the 'completed' filter
      if (todo.completed && !isToday(todo.completedAt) && !showPastCompletedTasks && filter !== 'completed') {
        return false; // Hide completed tasks from past days
      }
      
      // Always show tasks planned for tomorrow
      if (todo.plannedForTomorrow) return true;
      
      // Always show pending tasks regardless of creation date
      if (!todo.completed) return true;
      
      return true; // Default to showing if none of the above conditions are met
    })
    .filter((todo) => {
      // Then filter by search term
      if (!searchTerm.trim()) return true;
      return todo.text.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const pendingTodos = todos.filter((todo) => !todo.completed).length;
  const completedTodosTotal = todos.filter((todo) => todo.completed).length;
  const completedTodosToday = todos.filter((todo) => todo.completed && isToday(todo.completedAt)).length;
  const plannedForTomorrowCount = todos.filter((todo) => todo.plannedForTomorrow).length;

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.className = !darkMode ? 'dark-mode' : '';
  };

  const toggleTvMode = () => {
    setTvMode(!tvMode);
    document.body.classList.toggle('tv-mode', !tvMode);
  };

  // Format the task completion message
  const getCompletionMessage = () => {
    if (todos.length === 0) return "Add your first task to get started!";
    
    const todayTasksTotal = todos.filter(todo => isToday(todo.createdAt) || (todo.completed && isToday(todo.completedAt))).length;
    const percentage = todayTasksTotal > 0 
      ? Math.round((completedTodosToday / todayTasksTotal) * 100) 
      : 0;
    
    if (completedTodosToday === 0) return "You haven't completed any tasks today yet.";
    if (completedTodosToday > 0 && percentage === 100) return "You've completed all of today's tasks!";
    
    return `Today: ${completedTodosToday} task${completedTodosToday !== 1 ? 's' : ''} completed`;
  };
  
  // Calculate priority counts
  const priorityCounts = {
    low: todos.filter(todo => todo.priority === 'low').length,
    normal: todos.filter(todo => todo.priority === 'normal').length,
    high: todos.filter(todo => todo.priority === 'high').length
  };

  // Fix the generateTaskSummary function with a more reliable check
  const generateTaskSummary = async () => {
    try {
      setIsGeneratingSummary(true);
      
      // Get today's date for comparison
      const today = new Date();
      const todayDateString = today.toDateString(); // This returns format like "Wed Mar 29 2023"
      
      // Get completed tasks from today using a more reliable check
      const todayCompleted = todos.filter(todo => {
        // Task must be completed to be included
        if (!todo.completed) return false;
        
        // If no completedAt date is set but the task is marked completed,
        // we'll include it (assuming it was completed today)
        if (!todo.completedAt) return true;
        
        // Compare date strings (ignoring time)
        const completedDate = new Date(todo.completedAt);
        return completedDate.toDateString() === todayDateString;
      });
      
      // Get tasks planned for tomorrow
      const plannedForTomorrow = todos.filter(todo => todo.plannedForTomorrow === true);
      
      // Debug information
      console.log(`Today's date: ${todayDateString}`);
      console.log('Today completed tasks count:', todayCompleted.length);
      console.log('Today completed tasks:', todayCompleted.map(t => ({ 
        text: t.text, 
        completedAt: t.completedAt,
        dateString: t.completedAt ? new Date(t.completedAt).toDateString() : 'none'
      })));
      console.log('Tasks planned for tomorrow:', plannedForTomorrow.map(t => t.text));
      
      // Call OpenAI service to generate summary
      const aiSummary = await openAiGenerateSummary(todayCompleted, plannedForTomorrow);
      setSummary(aiSummary);
      setShowSummary(true);
      setIsGeneratingSummary(false);
      
    } catch (error) {
      console.error('Error generating task summary:', error);
      setIsGeneratingSummary(false);
      alert('Failed to generate task summary. Please try again.');
    }
  };

  // Add a function to copy the summary to clipboard
  const copySummary = () => {
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  // Fix the planForTomorrow function
  const planForTomorrow = (id) => {
    setTodos(prevTodos => 
      prevTodos.map(todo => {
        if (todo.id === id) {
          const newPlannedValue = !todo.plannedForTomorrow;
          console.log(`Setting task ${todo.text} plannedForTomorrow to ${newPlannedValue}`);
          return { 
            ...todo, 
            plannedForTomorrow: newPlannedValue,
            // If marking as not planned for tomorrow and it was completed, keep it completed
            // If marking as planned for tomorrow and it was completed, we may want to uncomplete
            // since it's likely work is continuing tomorrow
            completed: newPlannedValue ? false : todo.completed
          };
        }
        return todo;
      })
    );
  };

  // Add this function to format the summary text with proper styling
  const renderFormattedSummary = (summaryText) => {
    if (!summaryText) return <p>No summary available.</p>;
    
    // Split the summary into lines
    const lines = summaryText.split('\n');
    
    // The first line should be the date
    const dateHeader = lines[0];
    
    // Find task lines (they start with a number followed by a period)
    const taskLines = [];
    let currentTask = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      // Check if this is a new task (starts with a number)
      if (/^\d+\./.test(line)) {
        // If we have a previous task, add it
        if (currentTask) {
          taskLines.push(currentTask);
        }
        currentTask = line;
      } else if (currentTask) {
        // Continuation of the current task
        currentTask += ' ' + line;
      }
    }
    
    // Add the last task if there is one
    if (currentTask) {
      taskLines.push(currentTask);
    }
    
    // Format each task into components
    const formattedTasks = taskLines.map((task, index) => {
      // Extract task number, text and "done" status
      const match = task.match(/^(\d+)\.\s+(.+?)(\s+done)?$/i);
      
      if (match) {
        const [, number, text, done] = match;
        return (
          <div key={index} className="summary-task">
            <span className="summary-task-number">{number}.</span>
            <span className="summary-task-text">{text}</span>
            {done && <span className="summary-task-done"> done</span>}
          </div>
        );
      }
      
      // Fallback if the regex doesn't match
      return <div key={index} className="summary-task">{task}</div>;
    });
    
    return (
      <>
        <div className="summary-date">{dateHeader}</div>
        {formattedTasks}
      </>
    );
  };

  return (
    <div className={`app ${darkMode ? 'dark' : ''} ${tvMode ? 'tv-mode' : ''}`}>
      <div className="app-header">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h1>Todo List</h1>
        <div className="app-header-controls">
          <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="theme-toggle tv-toggle" onClick={toggleTvMode} aria-label="Toggle TV mode">
            {tvMode ? '📱' : '📺'}
          </button>
        </div>
      </div>
      
      <div className="app-sidebar">
        <div className="sidebar-section">
          <TodoForm onSubmit={addTodo} />
        </div>
        
        <div className="sidebar-section">
          <h2>Filters</h2>
          <TodoFilter filter={filter} setFilter={setFilter} />
          <div className="past-tasks-toggle">
            <button 
              className={`past-tasks-button ${showPastCompletedTasks ? 'active' : ''}`} 
              onClick={togglePastCompletedTasks}
            >
              {showPastCompletedTasks ? 'Hide Past Completed' : 'Show Past Completed'}
            </button>
            <span className="past-tasks-info">
              {filter === 'all' 
                ? "When using 'All' filter, all tasks are visible regardless of date" 
                : !showPastCompletedTasks 
                  ? "Today's completed tasks and all pending tasks are shown" 
                  : "All completed tasks (including past days) are shown"}
            </span>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h2>Task Statistics</h2>
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-label">Total Tasks</span>
              <span className="stat-value">{todos.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pendingTodos}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed Today</span>
              <span className="stat-value">{completedTodosToday}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed Total</span>
              <span className="stat-value">{completedTodosTotal}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Planned Tomorrow</span>
              <span className="stat-value">{plannedForTomorrowCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">High Priority</span>
              <span className="stat-value">{priorityCounts.high}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Normal Priority</span>
              <span className="stat-value">{priorityCounts.normal}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Low Priority</span>
              <span className="stat-value">{priorityCounts.low}</span>
            </div>
          </div>
        </div>
        
        <div className="sidebar-section">
          <h2>Data Management</h2>
          <div className="data-actions">
            <button className="action-button" onClick={exportTodos}>
              Export as Text File
            </button>
            <label className="action-button import-button">
              Import Todos
              <input 
                type="file" 
                accept=".json" 
                onChange={importTodos} 
                style={{ display: 'none' }}
              />
            </label>
            <button 
              className="action-button summarize-button" 
              onClick={generateTaskSummary}
              disabled={isGeneratingSummary}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="ai-icon">
                <path d="M9.05.435c-.58-.58-1.52-.58-2.1 0L.436 6.95c-.58.58-.58 1.519 0 2.098l6.516 6.516c.58.58 1.519.58 2.098 0l6.516-6.516c.58-.58.58-1.519 0-2.098L9.05.435ZM5.495 6.033a.237.237 0 0 1-.24-.247C5.35 4.091 6.737 3.5 8.005 3.5c1.396 0 2.672.73 2.672 2.24a2.23 2.23 0 0 1-1.08 1.964 2.21 2.21 0 0 1-1.11.283H8.08v.45a.232.232 0 0 1-.234.245l-.08-.004-.16-.005a.231.231 0 0 1-.148-.232v-.444a.232.232 0 0 1-.118-.21.231.231 0 0 1 .118-.21v-1.73c0-.131.107-.238.238-.238h.937c.47 0 .833.29.833.65 0 .555-.546.815-1.071.815H7.11a.230.23 0 0 1-.235-.228v-.516a.236.236 0 0 1 .235-.236h1.118c.235 0 .552.1.552.471 0 .196-.089.278-.25.278h-1.64c-.414 0-.59.36-.59.59 0 .384.311.59.647.59h.645c.13 0 .236.107.236.237v.127c0 .13-.107.237-.237.237H6.99c-.655 0-1.157-.423-1.157-1.026 0-.61.503-1.032 1.155-1.032h1.092c.524 0 .828-.328.833-.72a.237.237 0 0 1 .239-.247c.131 0 .237.106.237.237-.032.65-.74 1.196-1.57 1.196h-.942ZM8 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-3A.5.5 0 0 1 8 0Zm0 13a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-1 0V13.5a.5.5 0 0 1 .5-.5Z"/>
              </svg>
              {isGeneratingSummary ? 'Generating...' : 'Summarize Day'}
            </button>
          </div>
          {lastSaved && (
            <div className="last-saved">
              Last saved: {lastSaved}
            </div>
          )}
        </div>
      </div>
      
      <div className="app-main">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <TodoList
          todos={filteredTodos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
          planForTomorrow={planForTomorrow}
        />
      </div>
      
      <div className="task-stats">
        <div className="todo-count">
          {pendingTodos} {pendingTodos === 1 ? 'task' : 'tasks'} remaining
        </div>
        {completedTodosTotal > 0 && (
          <button className="clear-completed" onClick={clearCompleted}>
            Clear completed ({completedTodosTotal})
          </button>
        )}
      </div>
      
      <div className="completion-message">
        {getCompletionMessage()}
      </div>

      <div className={`summary-container ${showSummary ? 'show' : ''}`}>
        <div className="summary-header">
          <h2>Daily Task Summary</h2>
          <div className="summary-actions">
            <button className="summary-action" onClick={copySummary} title="Copy to clipboard">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
            </button>
            <button className="summary-action" onClick={() => setShowSummary(false)} title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="summary-content">
          {isGeneratingSummary ? (
            <div className="summary-loading">
              <div className="loading-spinner"></div>
              <p>Generating your summary...</p>
            </div>
          ) : (
            renderFormattedSummary(summary)
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
