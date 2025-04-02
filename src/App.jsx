import React, { useState } from 'react';
import DependencyGraph from './components/DependencyGraph';
import SearchBar from './components/SearchBar';
import InfoList from './components/InfoList';

const App = () => {
  const [filter, setFilter] = useState('');
  const [packageInfo, setPackageInfo] = useState(null);

  // Function to handle node click
  const handleNodeClick = (packageInfo) => {
    setPackageInfo(packageInfo); // Update the InfoList with package info
    setFilter(packageInfo.name); // Apply the filter for the clicked node
  };

  return (
    <div className="App">
      <div className="graph-container">
        <DependencyGraph filter={filter} onNodeClick={handleNodeClick}/>
      </div>
      <div className="search-bar-and-list-container">
        <SearchBar onApplyFilter={setFilter}/>
        <div className="info-list">
        <InfoList packageInfo={packageInfo}/>
        </div>
      </div>
    </div>
  );
};

export default App;