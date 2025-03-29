import React from 'react';
import './TodoFilter.css';

function TodoFilter({ filter, setFilter }) {
  return (
    <div className="todo-filter">
      <button
        className={`filter-button ${filter === 'all' ? 'active' : ''}`}
        onClick={() => setFilter('all')}
      >
        All
      </button>
      <button
        className={`filter-button ${filter === 'active' ? 'active' : ''}`}
        onClick={() => setFilter('active')}
      >
        Active
      </button>
      <button
        className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
        onClick={() => setFilter('completed')}
      >
        Completed
      </button>
    </div>
  );
}

export default TodoFilter; 