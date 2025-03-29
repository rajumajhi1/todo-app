import React from 'react';
import './TodoList.css';

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return <p className="empty-message">No todos to display</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
            />
            <span className="checkmark"></span>
          </label>
          <span className="todo-text">{todo.text}</span>
          <button
            className="delete-button"
            onClick={() => onDelete(todo.id)}
            aria-label="Delete todo"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TodoList; 