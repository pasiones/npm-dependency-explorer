// src/components/DependenciesGraph.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Graph } from 'react-d3-graph';

const DependenciesGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [highlightedLinks, setHighlightedLinks] = useState([]);

  useEffect(() => {
    axios.get('/dependencies.json')
      .then(response => {
        const dependencies = response.data.dependencies;
        const nodes = [];
        const links = [];
        const dependencyCount = {};

        const processDependencies = (deps, parent = null) => {
          Object.keys(deps).forEach(dep => {
            if (!dependencyCount[dep]) {
              dependencyCount[dep] = 0;
            }
            if (parent) {
              dependencyCount[dep]++;
              links.push({ source: parent, target: dep });
            }
            if (!nodes.find(node => node.id === dep)) {
              nodes.push({ id: dep, size: 120, color: 'lightblue' });
            }
            if (deps[dep].dependencies) {
              processDependencies(deps[dep].dependencies, dep);
            }
          });
        };

        processDependencies(dependencies);

        // Adjust size for root nodes
        nodes.forEach(node => {
          if (dependencyCount[node.id] === 0) {
            node.size = 500; 
            node.color = 'lightgreen';
          }
        });

        setGraphData({ nodes, links });
      })
      .catch(error => console.error('Error fetching dependencies:', error));
  }, []);

  const onMouseOverNode = (nodeId) => {
    const newHighlightedLinks = graphData.links.filter(link => link.source === nodeId || link.target === nodeId);
    const newHighlightedNodes = [nodeId, ...newHighlightedLinks.map(link => link.source === nodeId ? link.target : link.source)];
    setHighlightedLinks(newHighlightedLinks);
    setHighlightedNodes(newHighlightedNodes);
  };

  const onMouseOutNode = () => {
    setHighlightedLinks([]);
    setHighlightedNodes([]);
  };

  const onClickNode = (nodeId) => {
    window.alert(`Clicked node ${nodeId}`);
  };

  const myConfig = {
    node: {
      highlightStrokeColor: 'blue',
      fontColor: 'white', 
    },
    link: {
      color: 'gray',
      renderLabel: true,
      strokeWidth: 2,
    },
    directed: true,
    height: window.innerHeight,
    width: window.innerWidth,
  };

  return (
    <div className="graph-container">
      <Graph
        id="dependencies-graph"
        data={{
          nodes: graphData.nodes.map(node => ({
            ...node,
            color: highlightedNodes.includes(node.id) ? 'red' : node.color,
            highlightStrokeColor: highlightedNodes.includes(node.id) ? 'red' : node.highlightStrokeColor,
            fontSize: highlightedNodes.includes(node.id) ? 13 : node.fontSize,
            fontWeight: highlightedNodes.includes(node.id) ? 'bold' : node.fontWeight, 
            opacity: highlightedNodes.length > 0 && !highlightedNodes.includes(node.id) ? 0.2 : node.opacity, 
          })),
          links: graphData.links.map(link => ({
            ...link,
            color: highlightedLinks.includes(link) ? 'red' : link.color,
            strokeWidth: highlightedLinks.includes(link) ? 4 : link.strokeWidth,
            opacity: highlightedLinks.length > 0 && !highlightedLinks.includes(link) ? 0.2 : link.opacity, 
          })),
        }}
        config={myConfig}
        onMouseOverNode={onMouseOverNode}
        onMouseOutNode={onMouseOutNode}
        onClickNode={onClickNode}
      />
    </div>
  );
};

export default DependenciesGraph;