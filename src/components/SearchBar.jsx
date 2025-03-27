import React, { useState } from 'react';

const SearchBar = ({ onApplyFilter }) => {
  const [inputValue, setInputValue] = useState('');

  const handleApplyFilter = () => {
    onApplyFilter(inputValue);
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        placeholder="Search for dependencies..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="search-bar"
      />
      <button 
      onClick={handleApplyFilter} className='search-button'>Search</button>
    </div>
  );
};

export default SearchBar;