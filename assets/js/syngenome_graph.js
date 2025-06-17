let matchIndex = 0;
let matches = [];
const input = document.getElementById('searchBox');
const infoBox = document.getElementById('clickInfo');
const nextBtn = document.getElementById('nextMatchBtn');
const exampleButtons = document.getElementById('exampleButtons');

let customLoadingProgress = 0;
let loadingInterval;
let networkReady = false;
let originalNodesData = new Map(); // Store original node data
let originalEdgesData = new Map(); // Store original edge data
let isHighlighted = false;

// Function to handle example button clicks
function searchExample(query) {
    input.value = query;
    // Trigger the search
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    input.dispatchEvent(event);
}

function customLoad() {
    document.getElementById('welcomePopup').style.display = 'block';
}

// Start loading animation when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', customLoad);
} else {
    customLoad();
}

// Enhanced observer to detect when network is actually ready
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
	mutation.addedNodes.forEach(function(node) {
	    // Continue hiding any pyvis loading elements
	    if (node.id === 'loadingBar' || (node.nodeType === 1 && node.querySelector && node.querySelector('#loadingBar'))) {
		const loadingBar = node.id === 'loadingBar' ? node : node.querySelector('#loadingBar');
		if (loadingBar) {
		    loadingBar.style.display = 'none';
		    loadingBar.style.visibility = 'hidden';
		    loadingBar.style.opacity = '0';
		    loadingBar.style.position = 'absolute';
		    loadingBar.style.left = '-9999px';
		}
	    }
	    
	    // Detect when the network canvas is ready
	    if (node.tagName === 'CANVAS' || (node.nodeType === 1 && node.querySelector && node.querySelector('canvas'))) {
		setTimeout(() => {
		    networkReady = true;
		}, 1000);
	    }
	});
    });
});

observer.observe(document.body, { childList: true, subtree: true });

input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
	const query = this.value.toLowerCase();
	matches = nodes.get().filter(n =>
	    n.id.toLowerCase().includes(query) ||
		(n.label && n.label.toLowerCase().includes(query)) ||
		(n.title && n.title.toLowerCase().includes(query))
	);
	matchIndex = 0;
	if (matches.length > 0) {
	    highlightAndClick(matches[matchIndex].id);
	    infoBox.style.display = 'block';
	} else {
	    infoBox.style.display = 'block';
	    infoBox.innerHTML = "<b>No matches found.</b>";
	}
    } else {
        // Other keystrokes reset the query.
        matches = [];
        matchIndex = 0;
    }
});

nextBtn.addEventListener('click', function() {
    if (matches.length == 0) {
	const query = input.value.toLowerCase();
	matches = nodes.get().filter(n =>
	    n.id.toLowerCase().includes(query) ||
		(n.label && n.label.toLowerCase().includes(query)) ||
		(n.title && n.title.toLowerCase().includes(query))
	);
	matchIndex = 0;
    }
    if (matches.length > 0) {
	matchIndex = (matchIndex + 1) % matches.length;
	highlightAndClick(matches[matchIndex].id);
    } else {
	infoBox.style.display = 'block';
	infoBox.innerHTML = "<b>No matches found.</b>";
    }
});

let currentHighlightedNode = null;
let originalNodeData = null;

function highlightAndClick(nodeId) {
    // Reset any previous highlighting
    resetHighlight();
    
    // Store original data if not already stored
    if (originalNodesData.size === 0) {
	const allNodes = nodes.get();
	allNodes.forEach(node => {
	    originalNodesData.set(node.id, {
		color: node.color,
		borderWidth: node.borderWidth || 1,
		size: node.size || 10
	    });
	});
    }
    
    // Store original edge data if not already stored
    if (originalEdgesData.size === 0) {
	const allEdges = edges.get();
	allEdges.forEach(edge => {
	    // Store the edge's actual color (which should match source node)
	    originalEdgesData.set(edge.id, {
		color: edge.color
	    });
	});
    }
    
    // Get connected nodes and edges for the selected node
    const connectedNodeIds = network.getConnectedNodes(nodeId);
    const connectedEdgeIds = network.getConnectedEdges(nodeId);
    const allSelectedIds = [nodeId, ...connectedNodeIds];
    
    // Get all nodes and fade unselected ones
    const allNodes = nodes.get();
    const allEdges = edges.get();
    
    // Update all nodes - fade unselected ones
    const nodesToUpdate = [];
    allNodes.forEach(node => {
	if (!allSelectedIds.includes(node.id)) {
	    const originalData = originalNodesData.get(node.id);
	    const originalColor = originalData.color;
	    
	    nodesToUpdate.push({
		id: node.id,
		color: {
		    background: addAlphaToColor(originalColor, 0.2),
		    border: addAlphaToColor(originalColor, 0.2)
		}
	    });
	}
    });
    
    // Update faded nodes
    if (nodesToUpdate.length > 0) {
	nodes.update(nodesToUpdate);
    }
    
    // Update all edges - fade unconnected ones
    /*const edgesToUpdate = [];
    allEdges.forEach(edge => {
        if (!connectedEdgeIds.includes(edge.id)) {
            edgesToUpdate.push({
                id: edge.id,
                color: {
                    color: 'rgba(52, 73, 94, 0.1)',
                    highlight: 'rgba(52, 73, 94, 0.1)'
                }
            });
        }
    });
    
    // Update faded edges
    if (edgesToUpdate.length > 0) {
        edges.update(edgesToUpdate);
    }*/
    
    // Focus on the node first
    network.focus(nodeId, {
	scale: 1.8,
	animation: true
    });
    
    // Apply highlighting to selected node
    const node = nodes.get(nodeId);
    const originalColor = getColorValue(node.color);
    const darkerBorderColor = darkenColor(originalColor);
    
    nodes.update({
	id: nodeId,
	color: {
	    background: originalColor,
	    border: darkerBorderColor,
	    highlight: {
		background: originalColor,
		border: darkerBorderColor
	    }
	},
	borderWidth: 4,
	size: (node.size || 10) * 1.8
    });
    
    currentHighlightedNode = nodeId;
    isHighlighted = true;
    
    // Show the info box
    showConnectedInfo(nodeId);
}

// Helper function to get color value from color object or string
function getColorValue(color) {
    if (typeof color === 'string') {
	return color;
    } else if (typeof color === 'object' && color.background) {
	return color.background;
    } else if (typeof color === 'object' && color.color) {
	return color.color;
    }
    return '#3498db'; // fallback
}

// Helper function to darken a color
function darkenColor(color, factor = 0.7) {
    if (typeof color === 'string' && color.startsWith('#')) {
	const hex = color.replace('#', '');
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	
	const newR = Math.floor(r * factor);
	const newG = Math.floor(g * factor);
	const newB = Math.floor(b * factor);
	
	return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    return color;
}

// Helper function to add alpha to hex colors
function addAlphaToColor(color, alpha) {
    const colorValue = getColorValue(color);
    if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
	const hex = colorValue.replace('#', '');
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(52, 73, 94, ${alpha})`; // fallback
}

function resetHighlight() {
    if (!isHighlighted) return;
    
    // Restore all nodes to original state
    const nodesToRestore = [];
    for (const [nodeId, originalData] of originalNodesData) {
	nodesToRestore.push({
	    id: nodeId,
	    color: originalData.color,
	    borderWidth: originalData.borderWidth,
	    size: originalData.size
	});
    }
    
    if (nodesToRestore.length > 0) {
	nodes.update(nodesToRestore);
    }
    
    // Restore all edges to their original colors
    const edgesToRestore = [];
    for (const [edgeId, originalData] of originalEdgesData) {
	edgesToRestore.push({
	    id: edgeId,
	    color: originalData.color
	});
    }
    
    if (edgesToRestore.length > 0) {
	edges.update(edgesToRestore);
    }
    
    currentHighlightedNode = null;
    originalNodeData = null;
    isHighlighted = false;
    
    // Show example buttons again
    exampleButtons.classList.remove('hidden');
}

function showConnectedInfo(nodeId) {
    const node = nodes.get(nodeId);
    const connectedNodeIds = network.getConnectedNodes(nodeId);
    const connectedEdges = network.getConnectedEdges(nodeId);
    const edgeWeights = {};

    connectedEdges.forEach(edgeId => {
	const edge = edges.get(edgeId);
	const other = edge.from === nodeId ? edge.to : edge.from;
	edgeWeights[other] = edge.value || edge.label || "?";
    });

    // Enhanced HTML with better visual hierarchy and separate clan info
    let html = `<div class="section-header">Selected:</div>`;
    
    // Parse the node title to separate domain name and clan info
    const titleParts = node.title.split('\n');
    const domainInfo = titleParts[0]; // Main domain info
    const clanInfo = titleParts.length > 1 ? titleParts[1] : null; // Clan info if exists
    
    html += `<div class="clicked-domain">`;
    html += `<div class="domain-name">${domainInfo}</div>`;
    if (clanInfo) {
	html += `<div class="clan-info">${clanInfo}</div>`;
    }
    html += `</div>`;
    
    html += `<div class="section-header">Connected to:</div><ul>`;
    
    connectedNodeIds.forEach(id => {
	const n = nodes.get(id);
	const nTitleParts = n.title.split('\n');
	const nDomainInfo = nTitleParts[0];
	const nClanInfo = nTitleParts.length > 1 ? nTitleParts[1] : null;
	
	html += `<li onclick="highlightAndClick('${id}')">`;
	html += `<div class="domain-name">${nDomainInfo}</div>`;
	if (nClanInfo) {
	    html += `<div class="clan-info">${nClanInfo}</div>`;
	}
	html += `<div class="domain-details">Connection Frequency: ${edgeWeights[id]}</div>`;
	html += `</li>`;
    });
    html += "</ul>";
    infoBox.innerHTML = html;
    infoBox.style.display = 'block';
}



// initialize global variables.
var edges;
var nodes;
var nodeColors;
var originalNodes;
var network;
var container;
var options, data;
var filter = {
    item : '',
    property : '',
    value : []
};

// This method is responsible for drawing the graph, returns the drawn network
async function drawGraph() {
    var container = document.getElementById('mynetwork');

    const [nodes_json, edges_json] = await Promise.all([
        fetchAndParseJSON('/syngenome/data/nodes_with_positions.json'),
        fetchAndParseJSON('/syngenome/data/edges.json')
    ]);
    
    nodes = new vis.DataSet(nodes_json);
    edges = new vis.DataSet(edges_json);

    // adding nodes and edges to the graph
    data = {nodes: nodes, edges: edges};

    var options = {
	"physics": {
	    "enabled": false,
	},
	"nodes": {
	    "shape": "dot",
	    "size": 10,
	    "font": {
		"size": 10,
		"face": "RobotoMono,monospace",
		"color": "#333",
		"multi": "html"}
	},
	"edges": {
	    "smooth": false
	}
    };

    network = new vis.Network(container, data, options);

    network.on("click", function(params) {
	if (params.nodes.length > 0) {
	    const nodeId = params.nodes[0];
	    highlightAndClick(nodeId);
	} else {
	    // Click on empty space - reset highlighting
	    resetHighlight();
	    infoBox.style.display = 'none';
            input.value = '';
	}
    });

    return network;
};

