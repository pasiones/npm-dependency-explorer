import React, { useState } from 'react';
import DependenciesGraph from './components/DependenciesGraph';
// import DependenciesList from './components/DependenciesList';
import SearchBar from './components/SearchBar';

const App = () => {
  const [filter, setFilter] = useState('');

  return (
    <div className="App">
      <div className="graph-container">
        <DependenciesGraph filter={filter}/>
      </div>
      <div className="search-bar-and-list-container">
        <SearchBar onApplyFilter={setFilter}/>
        <div className="dependency-list">
          {/* <DependenciesList /> */}
        </div>
      </div>
    </div>
  );
};

export default App;