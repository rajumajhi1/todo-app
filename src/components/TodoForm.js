import React, { useState } from 'react';
import './TodoForm.css';

function TodoForm({ onSubmit }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(text);
    setText('');
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="todo-input"
      />
      <button type="submit" className="add-button" disabled={!text.trim()}>
        Add
      </button>
    </form>
  );
}

export default TodoForm; 