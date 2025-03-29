import React, { useState } from 'react';
import './TodoList.css';

function TodoList({ todos, onToggle, onDelete, onEdit, planForTomorrow }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  if (todos.length === 0) {
    return <p className="empty-message">No todos to display. Add a new task to get started!</p>;
  }

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleEditSave = (id) => {
    if (editText.trim()) {
      onEdit(id, editText);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleEditSave(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Add a helper function to check if a date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Update the formatDate function to include more readable relative dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If it's today, show "Today at HH:MM"
    if (isToday(dateString)) {
      return `Today at ${date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    }
    
    // If it's yesterday, show "Yesterday at HH:MM"
    if (date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()) {
      return `Yesterday at ${date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit'
      })}`;
    }
    
    // Otherwise show the date and time
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTodo = (todo) => {
    return (
      <li 
        key={todo.id}
        data-id={todo.id}
        className={`todo-item ${todo.completed ? 'completed' : 'pending'} ${
          todo.priority ? `priority-${todo.priority}` : 'priority-normal'
        } ${todo.plannedForTomorrow ? 'planned' : ''}`}
      >
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
          />
          <span className="checkmark"></span>
        </label>

        {editingId === todo.id ? (
          <input
            type="text"
            className="todo-input edit-input"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={() => handleEditSave(todo.id)}
            onKeyDown={(e) => handleKeyDown(e, todo.id)}
            autoFocus
          />
        ) : (
          <div className="todo-item-content">
            <span className="todo-text">{todo.text}</span>
            <div className="todo-meta">
              <span className="todo-date">
                Created: {todo.createdAt && formatDate(todo.createdAt)}
              </span>
              {todo.completed && todo.completedAt && (
                <span className="todo-date">
                  Completed: {formatDate(todo.completedAt)}
                </span>
              )}
              <span className={`todo-status ${todo.completed ? 'status-completed' : 'status-pending'}`}>
                {todo.completed ? 'Completed' : 'Pending'}
              </span>
              {todo.plannedForTomorrow && (
                <span className="todo-status status-planned">
                  Planned for Tomorrow
                </span>
              )}
            </div>
          </div>
        )}

        <div className="todo-actions">
          {!todo.completed && editingId !== todo.id && onEdit && (
            <button
              className="edit-button"
              onClick={() => startEditing(todo)}
              aria-label="Edit todo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
              </svg>
            </button>
          )}
          <button
            className="delete-button"
            onClick={() => onDelete(todo.id)}
            aria-label="Delete todo"
          >
            ×
          </button>
          <button 
            className={`plan-tomorrow-btn ${todo.plannedForTomorrow ? 'planned' : ''}`}
            onClick={() => planForTomorrow(todo.id)}
            title={todo.plannedForTomorrow ? "Remove from tomorrow's plan" : "Plan for tomorrow"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
            </svg>
          </button>
        </div>
      </li>
    );
  };

  return (
    <ul className="todo-list">
      {todos.map(renderTodo)}
    </ul>
  );
}

export default TodoList; 