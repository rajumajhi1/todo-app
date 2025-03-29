import React from 'react';
import './TodoFilter.css';

function TodoFilter({ filter, setFilter }) {
  return (
    <div className="filter-container">
      <button
        className={filter === 'all' ? 'active' : ''}
        onClick={() => setFilter('all')}
      >
        All
      </button>
      <button
        className={filter === 'today' ? 'active' : ''}
        onClick={() => setFilter('today')}
      >
        Today
      </button>
      <button
        className={filter === 'active' ? 'active' : ''}
        onClick={() => setFilter('active')}
      >
        Active
      </button>
      <button
        className={filter === 'completed' ? 'active' : ''}
        onClick={() => setFilter('completed')}
      >
        Completed
      </button>
      <button
        className={filter === 'planned' ? 'active' : ''}
        onClick={() => setFilter('planned')}
      >
        Planned
      </button>
    </div>
  );
}

export default TodoFilter; 