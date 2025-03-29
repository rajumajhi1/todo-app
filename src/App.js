import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoFilter from './components/TodoFilter';
import { generateTaskSummary as generateSummaryFromService } from './services/openai';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { getTodos, addTodo as fbAddTodo, updateTodo as fbUpdateTodo, deleteTodo as fbDeleteTodo } from './services/firebase';
import './App.css';

function AppWithAuth() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showPastCompletedTasks, setShowPastCompletedTasks] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, logout, loading: authLoading } = useAuth();
  
  const isAuthenticated = !!currentUser;

  const updateLastSaved = () => {
    setLastSaved(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    const loadTodosFromFirebase = async () => {
      if (!currentUser) {
        setTodos([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedTodos = await getTodos(currentUser.uid);
        setTodos(fetchedTodos);
        updateLastSaved();
      } catch (error) {
        console.error('Error loading todos from Firebase:', error);
        alert('Failed to load your tasks. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTodosFromFirebase();
  }, [currentUser]);

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    
    document.body.className = prefersDarkMode ? 'dark-mode' : '';
  }, []);

  const addTodo = async (text, priority = 'medium') => {
    if (!text.trim()) return;
    
    const newTodo = {
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
      completedAt: null,
      plannedForTomorrow: false
    };
    
    try {
      const addedTodo = await fbAddTodo(newTodo, currentUser.uid);
      setTodos(prev => [...prev, addedTodo]);
      updateLastSaved();
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const isBeingCompleted = !todo.completed;
    const completedAt = isBeingCompleted ? new Date().toISOString() : null;
    
    try {
      const updatedTodo = {
        ...todo,
        completed: !todo.completed,
        completedAt
      };
      
      await fbUpdateTodo(id, updatedTodo);
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed, completedAt } : todo
      ));
      
      updateLastSaved();
      
      if (isBeingCompleted) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
          todoElement.classList.add('highlight-complete');
          setTimeout(() => {
            todoElement.classList.remove('highlight-complete');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const editTodo = async (id, text) => {
    if (!text.trim()) return;
    
    try {
      const todo = todos.find(t => t.id === id);
      const updatedTodo = { ...todo, text };
      
      await fbUpdateTodo(id, updatedTodo);
      
      setTodos(prevTodos => prevTodos.map(todo => 
        todo.id === id ? { ...todo, text } : todo
      ));
      
      updateLastSaved();
    } catch (error) {
      console.error('Error editing todo:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fbDeleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
      updateLastSaved();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const planForTomorrow = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newPlannedValue = !todo.plannedForTomorrow;
    
    try {
      const updatedTodo = {
        ...todo,
        plannedForTomorrow: newPlannedValue,
        completed: newPlannedValue ? false : todo.completed
      };
      
      await fbUpdateTodo(id, updatedTodo);
      
      setTodos(prevTodos => 
        prevTodos.map(todo => {
          if (todo.id === id) {
            return { 
              ...todo, 
              plannedForTomorrow: newPlannedValue,
              completed: newPlannedValue ? false : todo.completed
            };
          }
          return todo;
        })
      );
      
      updateLastSaved();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to plan task for tomorrow. Please try again.');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const exportTodos = () => {
    try {
      let textContent = "TODO LIST EXPORT\n";
      textContent += `Date: ${new Date().toLocaleString()}\n`;
      textContent += `Total Tasks: ${todos.length}\n`;
      textContent += `Completed: ${todos.filter(todo => todo.completed).length}\n`;
      textContent += `Pending: ${todos.filter(todo => !todo.completed).length}\n\n`;
      textContent += "---------------------------------------------\n\n";
      
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

  const importTodos = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedTodos = JSON.parse(e.target.result);
        if (Array.isArray(importedTodos)) {
          if (window.confirm('This will replace your current todos. Continue?')) {
            setIsLoading(true);
            
            // Delete existing todos from Firebase
            for (const todo of todos) {
              await fbDeleteTodo(todo.id);
            }
            
            // Add imported todos to Firebase
            const newTodos = [];
            for (const todo of importedTodos) {
              // Make sure each todo has the current user's ID
              const todoWithUser = {
                ...todo,
                userId: currentUser.uid
              };
              const addedTodo = await fbAddTodo(todoWithUser, currentUser.uid);
              newTodos.push(addedTodo);
            }
            
            setTodos(newTodos);
            updateLastSaved();
            setIsLoading(false);
          }
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        console.error('Error importing todos:', error);
        alert('Failed to import todos. The file might be corrupted or in the wrong format.');
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = null;
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    
    try {
      const inputDate = new Date(dateString);
      const currentDate = new Date();
      
      if (isNaN(inputDate.getTime())) {
        console.warn('Invalid date:', dateString);
        return false;
      }
      
      return inputDate.getFullYear() === currentDate.getFullYear() &&
             inputDate.getMonth() === currentDate.getMonth() &&
             inputDate.getDate() === currentDate.getDate();
    } catch (error) {
      console.error('Error in isToday function:', error);
      return false;
    }
  };

  useEffect(() => {
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

  const togglePastCompletedTasks = () => {
    setShowPastCompletedTasks(!showPastCompletedTasks);
  };

  const filteredTodos = todos
    .filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      if (filter === 'today') {
        return isToday(todo.createdAt) || 
               (todo.completed && isToday(todo.completedAt)) || 
               todo.plannedForTomorrow;
      }
      if (filter === 'planned') return todo.plannedForTomorrow;
      return true;
    })
    .filter((todo) => {
      if (filter === 'all') return true;
      
      if (todo.completed && isToday(todo.completedAt)) return true;
      
      if (todo.completed && !isToday(todo.completedAt) && !showPastCompletedTasks && filter !== 'completed') {
        return false;
      }
      
      if (todo.plannedForTomorrow) return true;
      
      if (!todo.completed) return true;
      
      return true;
    })
    .filter((todo) => {
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
  
  const priorityCounts = {
    low: todos.filter(todo => todo.priority === 'low').length,
    normal: todos.filter(todo => todo.priority === 'normal').length,
    high: todos.filter(todo => todo.priority === 'high').length
  };

  const generateTaskSummary = async () => {
    if (isGeneratingSummary) return;
    
    setIsGeneratingSummary(true);
    setSummary('');
    
    try {
      if (isAuthenticated) {
        // Ensure we have the freshest data
        const freshTodos = await getTodos(currentUser.uid);
        
        // Get today's date to filter completed tasks
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];
        
        // Filter tasks completed today
        const todayCompleted = freshTodos.filter(todo => {
          if (!todo.completed || !todo.completedAt) return false;
          const completedDate = new Date(todo.completedAt).toISOString().split('T')[0];
          return completedDate === todayDateString;
        });
        
        // Filter tasks that are not completed and not planned for tomorrow
        const pendingTasks = freshTodos.filter(todo => 
          !todo.completed && !todo.plannedForTomorrow
        );
        
        const plannedForTomorrow = freshTodos.filter(todo => todo.plannedForTomorrow === true);
        
        console.log(`Today's date: ${todayDateString}`);
        console.log('Today completed tasks count:', todayCompleted.length);
        console.log('Pending tasks count:', pendingTasks.length);
        console.log('Tasks planned for tomorrow:', plannedForTomorrow.length);
        
        // Generate summary with completed, pending and planned tasks
        const aiSummary = await generateSummaryFromService(
          todayCompleted, 
          plannedForTomorrow, 
          pendingTasks,
          {
            useLocalGenerator: true,
            formatOptions: {
              dateFormat: 'DD.MM.YY'
            }
          }
        );
        
        setSummary(aiSummary);
        setShowSummary(true);
      } else {
        setSummary("Please log in to generate a task summary.");
        setShowSummary(true);
      }
      
      setIsGeneratingSummary(false);
    } catch (error) {
      console.error('Error generating task summary:', error);
      setIsGeneratingSummary(false);
      alert('Failed to generate task summary. Please try again.');
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary).then(() => {
      alert('Summary copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const renderFormattedSummary = (summaryText) => {
    if (!summaryText) return <p>No summary available.</p>;
    
    const lines = summaryText.split('\n');
    
    // Extract the date (first line)
    const dateHeader = lines[0];
    
    // Process the task lines
    const taskLines = [];
    let currentTask = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') {
        // Empty line means end of current task
        if (currentTask) {
          taskLines.push(currentTask);
          currentTask = '';
        }
        continue;
      }
      
      // If we don't have a current task, start a new one
      if (!currentTask) {
        currentTask = line;
      } else {
        // Otherwise append to current task
        currentTask += ' ' + line;
      }
    }
    
    // Add the last task if there is one
    if (currentTask) {
      taskLines.push(currentTask);
    }
    
    // Format each task
    const formattedTasks = taskLines.map((task, index) => {
      // Check for the different formats without quotes
      const isDone = task.includes('done');
      const isPending = task.includes('pending');
      const isOngoing = task.includes('ongoing, not completed');
      
      // Extract the task text by removing the status
      let taskText = task;
      if (isDone) {
        taskText = task.replace('done', '');
      } else if (isPending) {
        taskText = task.replace('pending', '');
      } else if (isOngoing) {
        taskText = task.replace('ongoing, not completed', '');
      }
      
      if (isDone) {
        return (
          <div key={index} className="summary-task">
            <span className="summary-task-text">{taskText}</span>
            <span className="summary-task-done">done</span>
          </div>
        );
      } else if (isPending) {
        return (
          <div key={index} className="summary-task">
            <span className="summary-task-text">{taskText}</span>
            <span className="summary-task-pending">pending</span>
          </div>
        );
      } else if (isOngoing) {
        return (
          <div key={index} className="summary-task">
            <span className="summary-task-text">{taskText}</span>
            <span className="summary-task-ongoing">ongoing, not completed</span>
          </div>
        );
      }
      
      // Default case (if we can't identify the format)
      return (
        <div key={index} className="summary-task">
          <span className="summary-task-text">{task}</span>
        </div>
      );
    });
    
    return (
      <>
        <div className="summary-date">{dateHeader}</div>
        {formattedTasks}
      </>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const clearCompleted = async () => {
    try {
      const completedTodos = todos.filter(todo => todo.completed);
      
      setIsLoading(true);
      
      for (const todo of completedTodos) {
        await fbDeleteTodo(todo.id);
      }
      
      setTodos(todos.filter(todo => !todo.completed));
      
      updateLastSaved();
      setIsLoading(false);
    } catch (error) {
      console.error('Error clearing completed todos:', error);
      setIsLoading(false);
      alert('Failed to clear completed tasks. Please try again.');
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      {authLoading || isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      ) : isAuthenticated ? (
        <>
          <div className="app-header">
            <div className="header-left">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <h1>Todo List</h1>
            </div>
            <div className="app-header-controls">
              <div className="user-greeting">
                <span className="greeting-text">
                  {getTimeBasedGreeting()}, <span className="user-name">{currentUser.displayName?.split(' ')[0] || 'User'}</span>
                </span>
                {currentUser.photoURL && (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="user-avatar" 
                  />
                )}
              </div>
              <div className="header-actions">
                <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode">
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button className="logout-button" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Logout
                </button>
              </div>
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
                  <div className="saved-timestamp">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v10l4.24 4.24"></path>
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    Last saved: {lastSaved}
                  </div>
                  <div className="cloud-save-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                    </svg>
                    Your data is securely synced to Firebase
                  </div>
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
                <>
                  {renderFormattedSummary(summary)}
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

export default App;
