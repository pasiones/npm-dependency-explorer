import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

async function readJsonFile(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

function createNodesAndLinks(data) {
  const nodes = new Map();
  const links = [];

  nodes.set(data.name, { id: data.name });

  for (const [dep, details] of Object.entries(data.dependencies)) {
    nodes.set(dep, { id: dep });
    links.push({ source: data.name, target: dep });

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
  const simulationRef = useRef(null);
  const nodesRef = useRef(null);
  const labelsRef = useRef(null);
  const zoomRef = useRef(null);
  const rootNodeIdRef = useRef(null);

  useEffect(() => {
    async function initializeGraph() {
      try {
        const data = await readJsonFile('./dependencies.json');
        const { nodes, links } = createNodesAndLinks(data);

        // Store the root node ID
        rootNodeIdRef.current = data.name;

        const svg = d3.select('#graph');
        const width = +svg.attr('width') || window.innerWidth;
        const height = +svg.attr('height') || window.innerHeight;

        svg.selectAll('*').remove();

        const container = svg.append('g');

        const zoom = d3.zoom()
          .scaleExtent([0.1, 8])
          .on('zoom', (event) => {
            container.attr('transform', event.transform);
          });

        svg.call(zoom);
        zoomRef.current = zoom;

        // Reset zoom to initial position
        svg.call(zoom.transform, d3.zoomIdentity);

        container.append('defs').append('marker')
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

        const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(200))
          .force('charge', d3.forceManyBody())
          .force('center', d3.forceCenter(width / 2, height / 2));

        simulationRef.current = simulation;

        const link = container.append('g')
          .selectAll('line')
          .data(links)
          .enter().append('line')
          .attr('stroke', '#999')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');

        // Draw nodes with root node differentiation
        const node = container.append('g')
          .selectAll('circle')
          .data(nodes)
          .enter().append('circle')
          .attr('r', d => d.id === data.name ? 16 : 10) // Bigger for root
          .attr('fill', d => d.id === data.name ? '#FF6B6B' : '#69b3a2') // Red for root
          .attr('stroke', d => d.id === data.name ? '#CC4C4C' : '#458b74')
          .attr('stroke-width', d => d.id === data.name ? 2 : 1)
          .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

        nodesRef.current = node;

        // Draw labels with root differentiation
        const label = container.append('g')
          .selectAll('text')
          .data(nodes)
          .enter().append('text')
          .attr('x', d => d.id === data.name ? 20 : 12) // Offset for root
          .attr('y', 3)
          .text(d => d.id)
          .attr('font-size', d => d.id === data.name ? 14 : 12) // Bigger for root
          .attr('font-weight', d => d.id === data.name ? 'bold' : 'normal');

        labelsRef.current = label;

        const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;
        const fontColor = isLightMode ? '#242424' : '#ffffff';
        d3.selectAll('text').attr('fill', fontColor);

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
            .attr('x', d => d.x + + (d.id === data.name ? 20 : 12))
            .attr('y', d => d.y + 3);
        });

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

    initializeGraph();

    if (simulationRef.current) {
      simulationRef.current.stop();
    }
  }, []);

  useEffect(() => {
    if (nodesRef.current && labelsRef.current) {
      updateNodeColors(nodesRef.current, labelsRef.current, filter, rootNodeIdRef.current);
    }
  }, [filter]);

  function updateNodeColors(nodes, labels, filter, rootNodeId) {
    if (filter) {
      nodes
        .attr('fill', d => {
          // Always keep root node red regardless of filter
          if (d.id === rootNodeId) return '#FF6B6B';
          return d.id.toLowerCase().includes(filter.toLowerCase()) ? 'red' : '#69b3a2';
        })
        .attr('opacity', d => {
          return d.id.toLowerCase().includes(filter.toLowerCase()) ? 1 : 0.2;
        });

      labels
        .attr('opacity', d => {
          // Always keep root label visible regardless of filter
          if (d.id === rootNodeId) return 1;
          return d.id.toLowerCase().includes(filter.toLowerCase()) ? 1 : 0.2;
        });
    } else {
      nodes
        .attr('fill', d => d.id === rootNodeId ? '#FF6B6B' : '#69b3a2')  // Restore root color
        .attr('opacity', 1);
      labels
        .attr('opacity', 1);
    }
  }

  return <svg id="graph"></svg>;
};

export default DependencyGraph;