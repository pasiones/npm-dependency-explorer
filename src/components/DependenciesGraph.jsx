import React, { useEffect } from 'react';
import * as d3 from 'd3';

// Function to read the JSON file
async function readJsonFile(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

// Function to create nodes and links from dependencies
function createNodesAndLinks(data) {
  const nodes = new Map();
  const links = [];

  // Add the main project as a node
  nodes.set(data.name, { id: data.name });

  // Add dependencies as nodes and links
  for (const [dep, details] of Object.entries(data.dependencies)) {
    nodes.set(dep, { id: dep });
    links.push({ source: data.name, target: dep });

    // Add sub-dependencies as nodes and links
    if (details.dependencies) {
      for (const subDep of Object.keys(details.dependencies)) {
        nodes.set(subDep, { id: subDep });
        links.push({ source: dep, target: subDep });
      }
    }
  }

  return { nodes: Array.from(nodes.values()), links };
}


const DependencyGraph = ({ filter }) => {
  useEffect(() => {
    async function createGraph() {
      try {
        const data = await readJsonFile('./dependencies.json');
        const { nodes, links } = createNodesAndLinks(data);

        // Create the SVG container
        const svg = d3.select('#graph');
        const width = +svg.attr('width');
        const height = +svg.attr('height');
        
        svg.selectAll('*').remove();

        // Define arrow markers for graph links
        svg.append('defs').append('marker')
          .attr('id', 'arrowhead')
          .attr('viewBox', '-0 -5 10 10')
          .attr('refX', 13)
          .attr('refY', 0)
          .attr('orient', 'auto')
          .attr('markerWidth', 8)
          .attr('markerHeight', 9)
          .attr('xoverflow', 'visible')
          .append('svg:path')
          .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
          .attr('fill', '#999')
          .style('stroke', 'none');

        // Create the simulation
        const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(200))
          .force('charge', d3.forceManyBody())
          .force('center', d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2));

        // Draw the links
        const link = svg.append('g')
          .selectAll('line')
          .data(links)
          .enter().append('line')
          .attr('stroke', '#999')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');

        // Draw the nodes
        const node = svg.append('g')
          .selectAll('circle')
          .data(nodes)
          .enter().append('circle')
          .attr('r', 10)
          .attr('fill', d => d.id.toLowerCase().includes(filter.toLowerCase()) ? 'red' : '#69b3a2')
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

        // Add labels to the nodes
        const label = svg.append('g')
          .selectAll('text')
          .data(nodes)
          .enter().append('text')
          .attr('x', 12)
          .attr('y', 3)
          .text(d => d.id);

        // Detect the current color scheme
        const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
        const fontColor = isLightMode ? '#242424' : '#ffffff';

        // Apply the font color to the text elements
        d3.selectAll('text').attr('fill', fontColor);

        // Update the simulation on each tick
        simulation.on('tick', () => {
          link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

          node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

          label
            .attr('x', d => d.x + 12)
            .attr('y', d => d.y + 3);
        });

        // Drag functions
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }

        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
      } catch (error) {
        console.error('Error reading JSON file:', error);
      }
    }

    createGraph();
  }, [filter]);

  return (
      <svg id="graph"></svg>
  );
};

export default DependencyGraph