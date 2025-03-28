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
  const queue = [];

  // Add root node
  nodes.set(data.name, { id: data.name, isRoot: true });
  queue.push({ name: data.name, dependencies: data.dependencies });

  // Process all dependencies recursively
  while (queue.length > 0) {
    const current = queue.shift();
    const currentName = current.name;
    const currentDeps = current.dependencies;

    if (!currentDeps) continue;

    for (const [dep, details] of Object.entries(currentDeps)) {
      // Add node if it doesn't exist
      if (!nodes.has(dep)) {
        nodes.set(dep, { id: dep, isRoot: false });
      }

      // Add link
      links.push({ source: currentName, target: dep });

      // Add to queue to process its dependencies
      if (details.dependencies) {
        queue.push({ name: dep, dependencies: details.dependencies });
      }
    }
  }

  return { nodes: Array.from(nodes.values()), links };
}

const DependencyGraph = ({ filter }) => {
  const simulationRef = useRef(null);
  const linksRef = useRef(null);
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
          .attr('markerWidth', 6)
          .attr('markerHeight', 8)
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

        linksRef.current = link;

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
    if (nodesRef.current && labelsRef.current && linksRef.current) {
      updateNodeColors(linksRef.current, nodesRef.current, labelsRef.current, filter, rootNodeIdRef.current);
    }
  }, [filter]);

  function getHighlightedPaths(linksData, nodesData, filter, rootNodeId) {
    // Build a map of child to parent relationships
    const childToParents = new Map();
    // Build a map of parent to children relationships
    const parentToChildren = new Map();
    // Map to store all links
    const linkMap = new Map();

    // Populate the maps
    linksData.forEach(link => {
      // Child to parents
      if (!childToParents.has(link.target.id)) {
        childToParents.set(link.target.id, new Set());
      }
      childToParents.get(link.target.id).add(link.source.id);

      // Parent to children
      if (!parentToChildren.has(link.source.id)) {
        parentToChildren.set(link.source.id, new Set());
      }
      parentToChildren.get(link.source.id).add(link.target.id);

      // Store the link
      const linkKey = `${link.source.id}->${link.target.id}`;
      linkMap.set(linkKey, link);
    });

    // Find all nodes that match the filter
    const matchingNodes = nodesData.filter(d =>
      d.id.toLowerCase().includes(filter.toLowerCase())
    );

    // Find all paths from matching nodes to root
    const highlightedNodes = new Set();
    const highlightedLinks = new Set();

    // Function to find all paths from a node to root
    function findAllPaths(nodeId, currentPath = []) {
      const paths = [];

      // If we've reached the root, return the current path
      if (nodeId === rootNodeId) {
        return [[...currentPath, nodeId]];
      }

      // Prevent cycles
      if (currentPath.includes(nodeId)) {
        return paths;
      }

      // Get all parents of this node
      const parents = childToParents.get(nodeId) || new Set();

      // For each parent, find paths from parent to root
      parents.forEach(parentId => {
        const parentPaths = findAllPaths(parentId, [...currentPath, nodeId]);
        paths.push(...parentPaths);
      });

      return paths;
    }

    // For each matching node, find all paths to root
    matchingNodes.forEach(node => {
      const allPaths = findAllPaths(node.id);

      // Add all nodes and links in these paths
      allPaths.forEach(path => {
        // Add nodes in path
        path.forEach(nodeId => highlightedNodes.add(nodeId));

        // Add links between nodes in path
        for (let i = 0; i < path.length - 1; i++) {
          const source = path[i + 1]; // parent
          const target = path[i];   // child
          const linkKey = `${source}->${target}`;
          const link = linkMap.get(linkKey);
          if (link) highlightedLinks.add(link);
        }
      });
    });

    // Always include the root node
    highlightedNodes.add(rootNodeId);

    return { highlightedNodes, highlightedLinks };
  }

  function updateNodeColors(links, nodes, labels, filter, rootNodeId) {
    // First reset all nodes and links to default state
    links
      .attr('opacity', 1)
      .attr('stroke', '#999');

    nodes
      .attr('fill', d => d.id === rootNodeId ? '#FF6B6B' : '#69b3a2')
      .attr('stroke', d => d.id === rootNodeId ? '#CC4C4C' : '#458b74')
      .attr('opacity', 1);

    labels
      .attr('opacity', 1);

    // Only apply new filter if one exists
    if (filter) {
      const { highlightedNodes, highlightedLinks } = getHighlightedPaths(
        links.data(),
        nodes.data(),
        filter,
        rootNodeId
      );

      // Apply new filter styles
      links
        .attr('opacity', d => highlightedLinks.has(d) ? 1 : 0.2)
        .attr('stroke', d => highlightedLinks.has(d) ? '#ff0000' : '#999');

      nodes
        .attr('fill', d => {
          if (d.id === rootNodeId) return '#FF6B6B';
          if (d.id.toLowerCase().includes(filter.toLowerCase())) return '#FFFF00';
          if (highlightedNodes.has(d.id)) return 'red';
          return '#69b3a2';
        })
        .attr('stroke', d => {
          if (d.id === rootNodeId) return '#CC4C4C';
          if (d.id.toLowerCase().includes(filter.toLowerCase())) return '#FFD700';
          if (highlightedNodes.has(d.id)) return '#ff0000';
          return '#458b74';
        })
        .attr('opacity', d => highlightedNodes.has(d.id) ? 1 : 0.2);

      labels
        .attr('opacity', d => highlightedNodes.has(d.id) ? 1 : 0.2);
    }
  }

  return <svg id="graph"></svg>;
};

export default DependencyGraph;