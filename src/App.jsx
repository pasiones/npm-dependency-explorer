import React, { useState } from 'react';
import DependencyGraph from './components/DependencyGraph';
import SearchBar from './components/SearchBar';

const App = () => {
  const [filter, setFilter] = useState('');

  return (
    <div className="App">
      <div className="graph-container">
        <DependencyGraph filter={filter}/>
      </div>
      <div className="search-bar-and-list-container">
        <SearchBar onApplyFilter={setFilter}/>
        <div className="dependency-list">

        </div>
      </div>
    </div>
  );
};

export default App;