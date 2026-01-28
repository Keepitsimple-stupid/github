// Git State Space Visualizer
// Loads and visualizes the state space from decision_tree.js

class GitStateVisualizer {
    constructor() {
        this.stateSpace = null;
        this.currentView = 'force-directed';
        this.highlightedNode = null;
        this.zoomLevel = 1;
        this.dimensions = { width: 1200, height: 800 };
        
        // Color scheme for different states
        this.colors = {
            'initial': '#FF6B6B',
            'initialized': '#4ECDC4',
            'hasCommits': '#45B7D1',
            'hasBranches': '#96CEB4',
            'hasRemote': '#FECA57',
            'merged': '#FF9FF3',
            'conflict': '#FF9F43',
            'cloned': '#54A0FF',
            'default': '#C8D6E5'
        };
        
        // Command categories for styling
        this.commandCategories = {
            'init': { color: '#1abc9c', icon: '🏗️' },
            'add': { color: '#3498db', icon: '📁' },
            'commit': { color: '#9b59b6', icon: '💾' },
            'branch': { color: '#e74c3c', icon: '🌿' },
            'merge': { color: '#f39c12', icon: '🔄' },
            'push': { color: '#2ecc71', icon: '📤' },
            'pull': { color: '#34495e', icon: '📥' },
            'clone': { color: '#8e44ad', icon: '📋' },
            'reset': { color: '#d35400', icon: '⏪' },
            'status': { color: '#7f8c8d', icon: '📊' },
            'log': { color: '#16a085', icon: '📜' },
            'switch': { color: '#27ae60', icon: '↔️' },
            'remote': { color: '#2980b9', icon: '🌐' },
            'config': { color: '#8e44ad', icon: '⚙️' }
        };
    }

    // Load state space from decision_tree.js simulation
    loadStateSpace(simulator) {
        this.stateSpace = simulator.getStateSpaceTree();
        console.log(`Loaded state space with ${Object.keys(this.stateSpace.states).length} states`);
        return this;
    }

    // Generate HTML visualization
    generateHTMLVisualization() {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git State Space Tree - project_👍</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3-legend/2.25.6/d3-legend.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #00b4db, #0083b0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 2px 10px rgba(0, 180, 219, 0.3);
        }

        .subtitle {
            font-size: 1.1rem;
            color: #a0a0a0;
            margin-bottom: 20px;
        }

        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            margin-bottom: 25px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.25);
            border-radius: 12px;
        }

        .control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 200px;
        }

        .control-label {
            font-size: 0.9rem;
            color: #8bb9fe;
            font-weight: 600;
        }

        select, button {
            padding: 12px 18px;
            border: none;
            border-radius: 8px;
            background: rgba(30, 60, 90, 0.7);
            color: white;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(100, 150, 200, 0.3);
        }

        select:hover, button:hover {
            background: rgba(40, 80, 120, 0.9);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 100, 200, 0.2);
        }

        select:focus, button:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(0, 150, 255, 0.5);
        }

        button {
            background: linear-gradient(135deg, #007cf0, #00dfd8);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .visualization-container {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 20px;
            height: 700px;
        }

        @media (max-width: 1024px) {
            .visualization-container {
                grid-template-columns: 1fr;
                grid-template-rows: auto 1fr;
            }
        }

        .sidebar {
            background: rgba(0, 0, 0, 0.25);
            border-radius: 12px;
            padding: 20px;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sidebar-section {
            margin-bottom: 25px;
        }

        .sidebar-title {
            font-size: 1.2rem;
            color: #4fc3f7;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid rgba(79, 195, 247, 0.3);
        }

        .state-info, .transition-info {
            background: rgba(30, 40, 60, 0.5);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #4fc3f7;
        }

        .state-property {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .property-name {
            color: #90caf9;
            font-weight: 600;
        }

        .property-value {
            color: #ffcc80;
            text-align: right;
            max-width: 150px;
            word-break: break-all;
        }

        .graph-container {
            background: rgba(0, 0, 0, 0.25);
            border-radius: 12px;
            padding: 15px;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        #state-graph {
            width: 100%;
            height: 100%;
        }

        .node {
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .node:hover {
            filter: brightness(1.2);
            transform: scale(1.05);
        }

        .node-text {
            font-size: 12px;
            font-weight: bold;
            fill: white;
            text-anchor: middle;
            pointer-events: none;
            user-select: none;
        }

        .link {
            stroke: rgba(200, 200, 200, 0.6);
            stroke-width: 2;
            fill: none;
            marker-end: url(#arrowhead);
        }

        .link-text {
            font-size: 10px;
            fill: #ffcc80;
            pointer-events: none;
            user-select: none;
            font-weight: 600;
        }

        .legend {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 12px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            margin-right: 10px;
        }

        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }

        .stat-card {
            background: rgba(0, 0, 0, 0.25);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border-top: 4px solid #00b4db;
        }

        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #00b4db;
            margin: 10px 0;
        }

        .stat-label {
            color: #a0a0a0;
            font-size: 0.9rem;
        }

        .tooltip {
            position: absolute;
            padding: 15px;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
            border: 1px solid rgba(0, 150, 255, 0.5);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            max-width: 300px;
            backdrop-filter: blur(10px);
        }

        .command-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin: 2px;
            background: rgba(100, 100, 200, 0.3);
            color: white;
        }

        .search-box {
            margin-top: 15px;
        }

        #search-input {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 0, 0, 0.4);
            color: white;
        }

        .command-legend {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
            margin-top: 15px;
        }

        .command-legend-item {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            gap: 5px;
        }

        .command-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .file-list {
            max-height: 150px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 6px;
            margin-top: 10px;
        }

        .file-item {
            padding: 3px 0;
            font-size: 0.85rem;
            color: #90caf9;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .highlighted {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 180, 219, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(0, 180, 219, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 180, 219, 0); }
        }

        .transition-path {
            stroke-dasharray: 5,5;
            animation: dash 20s linear infinite;
        }

        @keyframes dash {
            to {
                stroke-dashoffset: 1000;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1><i class="fas fa-code-branch"></i> Git State Space Tree</h1>
            <div class="subtitle">Visualizing Git workflow states for <strong>project_👍</strong> with Python files</div>
        </header>

        <div class="controls">
            <div class="control-group">
                <div class="control-label">View Type</div>
                <select id="view-type">
                    <option value="force-directed">Force-Directed Graph</option>
                    <option value="hierarchical">Hierarchical Tree</option>
                    <option value="radial">Radial Layout</option>
                    <option value="timeline">Timeline View</option>
                </select>
            </div>

            <div class="control-group">
                <div class="control-label">Node Size By</div>
                <select id="node-size">
                    <option value="commits">Commit Count</option>
                    <option value="branches">Branch Count</option>
                    <option value="files">File Count</option>
                    <option value="equal">Equal Size</option>
                </select>
            </div>

            <div class="control-group">
                <div class="control-label">Color By</div>
                <select id="color-scheme">
                    <option value="state-type">State Type</option>
                    <option value="branch">Current Branch</option>
                    <option value="commits">Commit Density</option>
                    <option value="has-remote">Remote Status</option>
                </select>
            </div>

            <div class="control-group">
                <div class="control-label">Actions</div>
                <div style="display: flex; gap: 10px;">
                    <button id="reset-view"><i class="fas fa-sync-alt"></i> Reset View</button>
                    <button id="export-png"><i class="fas fa-download"></i> Export PNG</button>
                    <button id="highlight-initial"><i class="fas fa-star"></i> Highlight Path</button>
                </div>
            </div>
        </div>

        <div class="visualization-container">
            <div class="sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-title"><i class="fas fa-info-circle"></i> Selected State</div>
                    <div id="state-details">
                        <div class="state-info">
                            <div class="state-property">
                                <span class="property-name">State ID:</span>
                                <span class="property-value" id="state-id">None</span>
                            </div>
                            <div class="state-property">
                                <span class="property-name">Current Branch:</span>
                                <span class="property-value" id="state-branch">None</span>
                            </div>
                            <div class="state-property">
                                <span class="property-name">Commits:</span>
                                <span class="property-value" id="state-commits">0</span>
                            </div>
                            <div class="state-property">
                                <span class="property-name">Staged Files:</span>
                                <span class="property-value" id="state-staged">0</span>
                            </div>
                            <div class="state-property">
                                <span class="property-name">Remotes:</span>
                                <span class="property-value" id="state-remotes">0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title"><i class="fas fa-exchange-alt"></i> Transitions From This State</div>
                    <div id="transition-list">
                        <div class="transition-info">
                            <div style="color: #90caf9; margin-bottom: 8px;">Select a state to view transitions</div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title"><i class="fas fa-file-code"></i> Python Files</div>
                    <div class="file-list" id="file-list">
                        <div class="file-item">No files selected</div>
                    </div>
                </div>

                <div class="search-box">
                    <div class="control-label">Search States</div>
                    <input type="text" id="search-input" placeholder="Search by branch, commit, or state...">
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-title"><i class="fas fa-palette"></i> Command Legend</div>
                    <div class="command-legend" id="command-legend"></div>
                </div>
            </div>

            <div class="graph-container">
                <svg id="state-graph" width="100%" height="100%">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                                refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#4fc3f7" />
                        </marker>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        <linearGradient id="node-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#4ecdc4;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#45b7d1;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <g id="graph-content"></g>
                </svg>
                <div class="legend" id="graph-legend"></div>
                <div id="graph-tooltip" class="tooltip" style="display: none;"></div>
            </div>
        </div>

        <div class="statistics" id="statistics">
            <!-- Statistics will be populated by JavaScript -->
        </div>
    </div>

    <script>
        // Main visualization code
        class GitStateVisualizerUI {
            constructor() {
                this.stateSpace = null;
                this.svg = null;
                this.simulation = null;
                this.width = 0;
                this.height = 0;
                this.selectedNode = null;
                this.zoom = d3.zoom();
                this.init();
            }

            async init() {
                // Load state space from main_second.js
                await this.loadStateSpace();
                this.setupSVG();
                this.setupControls();
                this.renderGraph();
                this.updateStatistics();
                this.renderCommandLegend();
            }

            async loadStateSpace() {
                try {
                    // This would be loaded from your decision_tree.js simulation
                    // For now, we'll create a sample state space
                    this.stateSpace = await this.createSampleStateSpace();
                    console.log('State space loaded:', this.stateSpace);
                } catch (error) {
                    console.error('Failed to load state space:', error);
                }
            }

            async createSampleStateSpace() {
                // Create a sample state space for visualization
                // In practice, this would come from your decision_tree.js
                return {
                    initialState: 'state_0',
                    states: {
                        'state_0': {
                            id: 'state_0',
                            name: 'Initial State (No Repository)',
                            isInitialized: false,
                            hasCommits: false,
                            currentBranch: null,
                            branches: {},
                            head: null,
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [],
                            remotes: {},
                            transitions: [
                                { to: 'state_1', command: 'git init', output: 'Initialized empty Git repository' }
                            ]
                        },
                        'state_1': {
                            id: 'state_1',
                            name: 'Initialized Repository',
                            isInitialized: true,
                            hasCommits: false,
                            currentBranch: 'main',
                            branches: { main: null },
                            head: 'main',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [],
                            remotes: {},
                            transitions: [
                                { to: 'state_2', command: 'git add main.py', output: 'Staged main.py' },
                                { to: 'state_3', command: 'git branch feature', output: 'Created feature branch' }
                            ]
                        },
                        'state_2': {
                            id: 'state_2',
                            name: 'File Staged',
                            isInitialized: true,
                            hasCommits: false,
                            currentBranch: 'main',
                            branches: { main: null },
                            head: 'main',
                            stagingArea: ['main.py'],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [],
                            remotes: {},
                            transitions: [
                                { to: 'state_4', command: 'git commit -m "Add main.py"', output: 'Committed main.py' },
                                { to: 'state_1', command: 'git reset main.py', output: 'Unstaged main.py' }
                            ]
                        },
                        'state_3': {
                            id: 'state_3',
                            name: 'Feature Branch Created',
                            isInitialized: true,
                            hasCommits: false,
                            currentBranch: 'main',
                            branches: { main: null, feature: null },
                            head: 'main',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [],
                            remotes: {},
                            transitions: [
                                { to: 'state_5', command: 'git switch feature', output: 'Switched to feature branch' },
                                { to: 'state_1', command: 'git branch -d feature', output: 'Deleted feature branch' }
                            ]
                        },
                        'state_4': {
                            id: 'state_4',
                            name: 'First Commit',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'abc123' },
                            head: 'abc123',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [{ hash: 'abc123', message: 'Add main.py' }],
                            remotes: {},
                            transitions: [
                                { to: 'state_6', command: 'git add utils.py', output: 'Staged utils.py' },
                                { to: 'state_7', command: 'git remote add origin <url>', output: 'Added remote' }
                            ]
                        },
                        'state_5': {
                            id: 'state_5',
                            name: 'On Feature Branch',
                            isInitialized: true,
                            hasCommits: false,
                            currentBranch: 'feature',
                            branches: { main: null, feature: null },
                            head: 'feature',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [],
                            remotes: {},
                            transitions: [
                                { to: 'state_8', command: 'git add .', output: 'Staged all files' },
                                { to: 'state_3', command: 'git switch main', output: 'Switched to main' }
                            ]
                        },
                        'state_6': {
                            id: 'state_6',
                            name: 'Ready for Second Commit',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'abc123' },
                            head: 'abc123',
                            stagingArea: ['utils.py'],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [{ hash: 'abc123', message: 'Add main.py' }],
                            remotes: {},
                            transitions: [
                                { to: 'state_9', command: 'git commit -m "Add utils.py"', output: 'Committed utils.py' }
                            ]
                        },
                        'state_7': {
                            id: 'state_7',
                            name: 'Remote Configured',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'abc123' },
                            head: 'abc123',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [{ hash: 'abc123', message: 'Add main.py' }],
                            remotes: { origin: 'https://github.com/user/project_👍.git' },
                            transitions: [
                                { to: 'state_10', command: 'git push -u origin main', output: 'Pushed to remote' }
                            ]
                        },
                        'state_8': {
                            id: 'state_8',
                            name: 'Feature Branch Staged',
                            isInitialized: true,
                            hasCommits: false,
                            currentBranch: 'feature',
                            branches: { main: null, feature: null },
                            head: 'feature',
                            stagingArea: ['main.py', 'utils.py', 'requirements.txt'],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [],
                            remotes: {},
                            transitions: [
                                { to: 'state_11', command: 'git commit -m "Feature implementation"', output: 'Committed feature' }
                            ]
                        },
                        'state_9': {
                            id: 'state_9',
                            name: 'Two Commits on Main',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'def456' },
                            head: 'def456',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [
                                { hash: 'abc123', message: 'Add main.py' },
                                { hash: 'def456', message: 'Add utils.py' }
                            ],
                            remotes: {},
                            transitions: [
                                { to: 'state_12', command: 'git merge feature', output: 'Merged feature branch' }
                            ]
                        },
                        'state_10': {
                            id: 'state_10',
                            name: 'Pushed to Remote',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'abc123' },
                            head: 'abc123',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [{ hash: 'abc123', message: 'Add main.py' }],
                            remotes: { origin: 'https://github.com/user/project_👍.git' },
                            transitions: [
                                { to: 'state_13', command: 'git pull', output: 'Pulled from remote' }
                            ]
                        },
                        'state_11': {
                            id: 'state_11',
                            name: 'Feature Committed',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'feature',
                            branches: { main: null, feature: 'ghi789' },
                            head: 'ghi789',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [{ hash: 'ghi789', message: 'Feature implementation' }],
                            remotes: {},
                            transitions: [
                                { to: 'state_3', command: 'git switch main', output: 'Switched to main' }
                            ]
                        },
                        'state_12': {
                            id: 'state_12',
                            name: 'Merge Completed',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'jkl012', feature: 'ghi789' },
                            head: 'jkl012',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt', 'feature.py'],
                            commitHistory: [
                                { hash: 'abc123', message: 'Add main.py' },
                                { hash: 'def456', message: 'Add utils.py' },
                                { hash: 'ghi789', message: 'Feature implementation' },
                                { hash: 'jkl012', message: 'Merge branch feature', isMerge: true }
                            ],
                            remotes: {},
                            transitions: []
                        },
                        'state_13': {
                            id: 'state_13',
                            name: 'Synced with Remote',
                            isInitialized: true,
                            hasCommits: true,
                            currentBranch: 'main',
                            branches: { main: 'abc123' },
                            head: 'abc123',
                            stagingArea: [],
                            workingDirectory: ['main.py', 'utils.py', 'requirements.txt'],
                            commitHistory: [{ hash: 'abc123', message: 'Add main.py' }],
                            remotes: { origin: 'https://github.com/user/project_👍.git' },
                            transitions: []
                        }
                    }
                };
            }

            setupSVG() {
                this.svg = d3.select('#state-graph');
                const container = document.querySelector('.graph-container');
                this.width = container.clientWidth;
                this.height = container.clientHeight;

                // Setup zoom behavior
                this.zoom = d3.zoom()
                    .scaleExtent([0.1, 4])
                    .on('zoom', (event) => {
                        d3.select('#graph-content').attr('transform', event.transform);
                    });

                this.svg.call(this.zoom);

                // Initial zoom
                const initialTransform = d3.zoomIdentity
                    .translate(this.width / 2, this.height / 2)
                    .scale(0.8);
                this.svg.call(this.zoom.transform, initialTransform);
            }

            setupControls() {
                // View type selector
                d3.select('#view-type').on('change', () => {
                    this.renderGraph();
                });

                // Node size selector
                d3.select('#node-size').on('change', () => {
                    this.renderGraph();
                });

                // Color scheme selector
                d3.select('#color-scheme').on('change', () => {
                    this.renderGraph();
                });

                // Reset view button
                d3.select('#reset-view').on('click', () => {
                    const resetTransform = d3.zoomIdentity
                        .translate(this.width / 2, this.height / 2)
                        .scale(0.8);
                    this.svg.transition().duration(750).call(this.zoom.transform, resetTransform);
                });

                // Export PNG button
                d3.select('#export-png').on('click', () => {
                    this.exportAsPNG();
                });

                // Highlight path button
                d3.select('#highlight-initial').on('click', () => {
                    this.highlightPathFromInitial();
                });

                // Search input
                d3.select('#search-input').on('input', (event) => {
                    this.searchStates(event.target.value);
                });
            }

            renderGraph() {
                const graphContent = d3.select('#graph-content');
                graphContent.selectAll('*').remove();

                // Create nodes and links
                const nodes = Object.values(this.stateSpace.states).map(state => ({
                    id: state.id,
                    ...state
                }));

                const links = [];
                nodes.forEach(source => {
                    if (source.transitions) {
                        source.transitions.forEach(transition => {
                            const target = nodes.find(n => n.id === transition.to);
                            if (target) {
                                links.push({
                                    source: source.id,
                                    target: target.id,
                                    command: transition.command,
                                    output: transition.output
                                });
                            }
                        });
                    }
                });

                // Create force simulation
                this.simulation = d3.forceSimulation(nodes)
                    .force('link', d3.forceLink(links).id(d => d.id).distance(150))
                    .force('charge', d3.forceManyBody().strength(-300))
                    .force('center', d3.forceCenter(this.width / 2, this.height / 2))
                    .force('collision', d3.forceCollide().radius(60));

                // Create links
                const link = graphContent.append('g')
                    .selectAll('line')
                    .data(links)
                    .enter()
                    .append('line')
                    .attr('class', 'link')
                    .attr('stroke-width', 2)
                    .style('stroke', d => this.getLinkColor(d.command))
                    .attr('marker-end', 'url(#arrowhead)');

                // Add link labels
                const linkLabels = graphContent.append('g')
                    .selectAll('text')
                    .data(links)
                    .enter()
                    .append('text')
                    .attr('class', 'link-text')
                    .attr('text-anchor', 'middle')
                    .style('font-size', '10px')
                    .style('pointer-events', 'none')
                    .text(d => {
                        const cmd = d.command.split(' ')[1] || 'cmd';
                        return cmd.length > 15 ? cmd.substring(0, 12) + '...' : cmd;
                    });

                // Create nodes
                const node = graphContent.append('g')
                    .selectAll('circle')
                    .data(nodes)
                    .enter()
                    .append('circle')
                    .attr('class', 'node')
                    .attr('r', d => this.getNodeSize(d))
                    .attr('fill', d => this.getNodeColor(d))
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 2)
                    .style('cursor', 'pointer')
                    .style('filter', 'url(#glow)')
                    .on('click', (event, d) => this.selectNode(d))
                    .on('mouseover', (event, d) => this.showTooltip(event, d))
                    .on('mouseout', () => this.hideTooltip())
                    .call(d3.drag()
                        .on('start', (event, d) => this.dragStarted(event, d))
                        .on('drag', (event, d) => this.dragged(event, d))
                        .on('end', (event, d) => this.dragEnded(event, d))
                    );

                // Add node labels
                const nodeLabels = graphContent.append('g')
                    .selectAll('text')
                    .data(nodes)
                    .enter()
                    .append('text')
                    .attr('class', 'node-text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '.3em')
                    .style('font-size', d => this.getNodeFontSize(d))
                    .style('pointer-events', 'none')
                    .style('text-shadow', '2px 2px 4px rgba(0,0,0,0.8)')
                    .text(d => {
                        if (d.currentBranch) {
                            return \`\${d.id}\\n\${d.currentBranch}\`;
                        }
                        return d.id;
                    });

                // Update positions on simulation tick
                this.simulation.on('tick', () => {
                    link
                        .attr('x1', d => d.source.x)
                        .attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x)
                        .attr('y2', d => d.target.y);

                    linkLabels
                        .attr('x', d => (d.source.x + d.target.x) / 2)
                        .attr('y', d => (d.source.y + d.target.y) / 2);

                    node
                        .attr('cx', d => d.x)
                        .attr('cy', d => d.y);

                    nodeLabels
                        .attr('x', d => d.x)
                        .attr('y', d => d.y);
                });

                // Highlight initial state
                this.highlightInitialState();
            }

            getNodeSize(state) {
                const sizeBy = d3.select('#node-size').property('value');
                switch(sizeBy) {
                    case 'commits':
                        return 20 + (state.commitHistory?.length || 0) * 5;
                    case 'branches':
                        return 20 + (Object.keys(state.branches || {}).length) * 8;
                    case 'files':
                        return 20 + (state.workingDirectory?.length || 0) * 3;
                    default:
                        return 30;
                }
            }

            getNodeColor(state) {
                const colorBy = d3.select('#color-scheme').property('value');
                
                const colorSchemes = {
                    'initial': '#FF6B6B',
                    'initialized': '#4ECDC4',
                    'hasCommits': '#45B7D1',
                    'hasBranches': '#96CEB4',
                    'hasRemote': '#FECA57',
                    'merged': '#FF9FF3',
                    'conflict': '#FF9F43',
                    'cloned': '#54A0FF',
                    'default': '#C8D6E5'
                };

                if (colorBy === 'state-type') {
                    if (!state.isInitialized) return colorSchemes.initial;
                    if (state.remotes && Object.keys(state.remotes).length > 0) return colorSchemes.hasRemote;
                    if (state.commitHistory && state.commitHistory.length > 0) {
                        const hasMerge = state.commitHistory.some(c => c.isMerge);
                        return hasMerge ? colorSchemes.merged : colorSchemes.hasCommits;
                    }
                    if (state.branches && Object.keys(state.branches).length > 1) return colorSchemes.hasBranches;
                    return colorSchemes.initialized;
                } else if (colorBy === 'branch') {
                    // Color by branch name
                    const branchColors = {
                        'main': '#3498db',
                        'feature': '#e74c3c',
                        'develop': '#2ecc71',
                        'master': '#9b59b6',
                        'default': '#95a5a6'
                    };
                    return branchColors[state.currentBranch] || branchColors.default;
                } else if (colorBy === 'commits') {
                    // Gradient based on commit count
                    const commitCount = state.commitHistory?.length || 0;
                    if (commitCount === 0) return '#ecf0f1';
                    if (commitCount < 3) return '#a3e4d7';
                    if (commitCount < 6) return '#76d7c4';
                    return '#48c9b0';
                } else if (colorBy === 'has-remote') {
                    return state.remotes && Object.keys(state.remotes).length > 0 ? '#f1c40f' : '#bdc3c7';
                }
                
                return colorSchemes.default;
            }

            getLinkColor(command) {
                const commandColors = {
                    'init': '#1abc9c',
                    'add': '#3498db',
                    'commit': '#9b59b6',
                    'branch': '#e74c3c',
                    'merge': '#f39c12',
                    'push': '#2ecc71',
                    'pull': '#34495e',
                    'clone': '#8e44ad',
                    'reset': '#d35400',
                    'status': '#7f8c8d',
                    'log': '#16a085',
                    'switch': '#27ae60',
                    'remote': '#2980b9',
                    'config': '#8e44ad',
                    'default': '#95a5a6'
                };

                for (const [key, color] of Object.entries(commandColors)) {
                    if (command.includes(key)) return color;
                }
                return commandColors.default;
            }

            getNodeFontSize(state) {
                const size = this.getNodeSize(state);
                if (size < 25) return '9px';
                if (size < 35) return '10px';
                if (size < 45) return '11px';
                return '12px';
            }

            selectNode(state) {
                this.selectedNode = state;
                this.updateSidebar(state);
                
                // Highlight selected node
                d3.selectAll('.node')
                    .attr('stroke-width', 2)
                    .attr('stroke', '#ffffff');
                
                d3.selectAll('.node')
                    .filter(d => d.id === state.id)
                    .attr('stroke-width', 4)
                    .attr('stroke', '#00ff00');
            }

            updateSidebar(state) {
                // Update state details
                document.getElementById('state-id').textContent = state.id;
                document.getElementById('state-branch').textContent = state.currentBranch || 'None';
                document.getElementById('state-commits').textContent = state.commitHistory?.length || 0;
                document.getElementById('state-staged').textContent = state.stagingArea?.length || 0;
                document.getElementById('state-remotes').textContent = 
                    state.remotes ? Object.keys(state.remotes).length : 0;

                // Update transitions list
                const transitionList = document.getElementById('transition-list');
                if (state.transitions && state.transitions.length > 0) {
                    transitionList.innerHTML = state.transitions.map(transition => \`
                        <div class="transition-info">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="color: #4fc3f7; font-weight: 600;">\${transition.command}</span>
                                <button onclick="visualizerUI.navigateTo('\${transition.to}')" 
                                        style="padding: 4px 8px; background: #3498db; border: none; border-radius: 4px; color: white; cursor: pointer;">
                                    Go →
                                </button>
                            </div>
                            <div style="color: #b0b0b0; font-size: 0.9rem;">\${transition.output}</div>
                        </div>
                    \`).join('');
                } else {
                    transitionList.innerHTML = \`
                        <div class="transition-info">
                            <div style="color: #90caf9;">No transitions from this state</div>
                        </div>
                    \`;
                }

                // Update file list
                const fileList = document.getElementById('file-list');
                if (state.workingDirectory && state.workingDirectory.length > 0) {
                    fileList.innerHTML = state.workingDirectory.map(file => \`
                        <div class="file-item">
                            <i class="fas fa-file-code" style="color: #4fc3f7; margin-right: 8px;"></i>
                            \${file}
                            \${state.stagingArea?.includes(file) ? 
                                '<span style="color: #2ecc71; margin-left: 8px;">(staged)</span>' : 
                                ''}
                        </div>
                    \`).join('');
                } else {
                    fileList.innerHTML = '<div class="file-item">No files</div>';
                }
            }

            navigateTo(stateId) {
                const state = this.stateSpace.states[stateId];
                if (state) {
                    this.selectNode(state);
                    
                    // Center on node
                    const node = d3.selectAll('.node').filter(d => d.id === stateId);
                    if (!node.empty()) {
                        const x = node.attr('cx');
                        const y = node.attr('cy');
                        const transform = d3.zoomIdentity
                            .translate(this.width / 2 - x, this.height / 2 - y)
                            .scale(1.5);
                        
                        this.svg.transition().duration(750).call(this.zoom.transform, transform);
                    }
                }
            }

            showTooltip(event, state) {
                const tooltip = document.getElementById('graph-tooltip');
                const [x, y] = d3.pointer(event);
                
                let content = \`
                    <strong>\${state.name}</strong><br>
                    <hr style="margin: 8px 0; border-color: #444;">
                    <strong>Branch:</strong> \${state.currentBranch || 'None'}<br>
                    <strong>Commits:</strong> \${state.commitHistory?.length || 0}<br>
                    <strong>Files:</strong> \${state.workingDirectory?.length || 0}<br>
                    <strong>Staged:</strong> \${state.stagingArea?.length || 0}<br>
                \`;
                
                if (state.commitHistory && state.commitHistory.length > 0) {
                    content += \`<strong>Last commit:</strong> \${state.commitHistory[state.commitHistory.length - 1].message}<br>\`;
                }
                
                if (state.remotes && Object.keys(state.remotes).length > 0) {
                    content += \`<strong>Remotes:</strong> \${Object.keys(state.remotes).join(', ')}\`;
                }
                
                tooltip.innerHTML = content;
                tooltip.style.left = (event.pageX + 15) + 'px';
                tooltip.style.top = (event.pageY - 15) + 'px';
                tooltip.style.display = 'block';
            }

            hideTooltip() {
                const tooltip = document.getElementById('graph-tooltip');
                tooltip.style.display = 'none';
            }

            dragStarted(event, d) {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            dragEnded(event, d) {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            updateStatistics() {
                const stats = {
                    'Total States': Object.keys(this.stateSpace.states).length,
                    'Total Transitions': Object.values(this.stateSpace.states)
                        .reduce((sum, state) => sum + (state.transitions?.length || 0), 0),
                    'States with Commits': Object.values(this.stateSpace.states)
                        .filter(s => s.commitHistory?.length > 0).length,
                    'States with Remotes': Object.values(this.stateSpace.states)
                        .filter(s => s.remotes && Object.keys(s.remotes).length > 0).length,
                    'Max Commits': Math.max(...Object.values(this.stateSpace.states)
                        .map(s => s.commitHistory?.length || 0)),
                    'Unique Branches': new Set(Object.values(this.stateSpace.states)
                        .map(s => s.currentBranch).filter(Boolean)).size
                };

                const statsContainer = document.getElementById('statistics');
                statsContainer.innerHTML = Object.entries(stats).map(([label, value]) => \`
                    <div class="stat-card">
                        <div class="stat-label">\${label}</div>
                        <div class="stat-value">\${value}</div>
                    </div>
                \`).join('');
            }

            renderCommandLegend() {
                const commandColors = {
                    'init': { color: '#1abc9c', label: 'Initialize' },
                    'add': { color: '#3498db', label: 'Add Files' },
                    'commit': { color: '#9b59b6', label: 'Commit' },
                    'branch': { color: '#e74c3c', label: 'Branch' },
                    'merge': { color: '#f39c12', label: 'Merge' },
                    'push': { color: '#2ecc71', label: 'Push' },
                    'pull': { color: '#34495e', label: 'Pull' },
                    'switch': { color: '#27ae60', label: 'Switch' },
                    'remote': { color: '#2980b9', label: 'Remote' },
                    'reset': { color: '#d35400', label: 'Reset' }
                };

                const legendContainer = document.getElementById('command-legend');
                legendContainer.innerHTML = Object.entries(commandColors).map(([cmd, info]) => \`
                    <div class="command-legend-item">
                        <div class="command-dot" style="background-color: \${info.color};"></div>
                        <span>\${info.label}</span>
                    </div>
                \`).join('');
            }

            highlightInitialState() {
                const initialState = this.stateSpace.states[this.stateSpace.initialState];
                if (initialState) {
                    d3.selectAll('.node')
                        .filter(d => d.id === initialState.id)
                        .attr('stroke-width', 4)
                        .attr('stroke', '#ffeb3b')
                        .classed('highlighted', true);
                    
                    this.selectNode(initialState);
                }
            }

            highlightPathFromInitial() {
                // Reset all highlights
                d3.selectAll('.link')
                    .attr('stroke', d => this.getLinkColor(d.command))
                    .attr('stroke-width', 2);
                
                d3.selectAll('.node')
                    .attr('stroke-width', 2)
                    .attr('stroke', '#ffffff');

                // Perform BFS from initial state
                const visited = new Set();
                const queue = [this.stateSpace.initialState];
                visited.add(this.stateSpace.initialState);

                while (queue.length > 0) {
                    const current = queue.shift();
                    const state = this.stateSpace.states[current];
                    
                    // Highlight node
                    d3.selectAll('.node')
                        .filter(d => d.id === current)
                        .attr('stroke-width', 4)
                        .attr('stroke', '#00ff00');

                    if (state.transitions) {
                        state.transitions.forEach(transition => {
                            // Highlight link
                            d3.selectAll('.link')
                                .filter(d => d.source.id === current && d.target.id === transition.to)
                                .attr('stroke', '#ff5722')
                                .attr('stroke-width', 4);

                            if (!visited.has(transition.to)) {
                                visited.add(transition.to);
                                queue.push(transition.to);
                            }
                        });
                    }
                }
            }

            searchStates(query) {
                if (!query.trim()) {
                    // Reset all nodes
                    d3.selectAll('.node')
                        .attr('opacity', 1);
                    return;
                }

                const searchTerm = query.toLowerCase();
                d3.selectAll('.node').each(function(d) {
                    const node = d3.select(this);
                    const state = d;
                    
                    const matches = 
                        state.id.toLowerCase().includes(searchTerm) ||
                        (state.currentBranch && state.currentBranch.toLowerCase().includes(searchTerm)) ||
                        (state.name && state.name.toLowerCase().includes(searchTerm)) ||
                        (state.commitHistory && state.commitHistory.some(c => 
                            c.message.toLowerCase().includes(searchTerm)));
                    
                    node.attr('opacity', matches ? 1 : 0.2);
                });
            }

            async exportAsPNG() {
                try {
                    const svgElement = document.getElementById('state-graph');
                    const svgData = new XMLSerializer().serializeToString(svgElement);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const svgSize = svgElement.getBoundingClientRect();
                    canvas.width = svgSize.width;
                    canvas.height = svgSize.height;
                    
                    const img = new Image();
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                        
                        // Create download link
                        const link = document.createElement('a');
                        link.download = 'git-state-space.png';
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    };
                    
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                } catch (error) {
                    console.error('Export failed:', error);
                    alert('Failed to export image. Please try again.');
                }
            }
        }

        // Initialize visualizer when page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.visualizerUI = new GitStateVisualizerUI();
        });
    </script>
</body>
</html>
`;
        return html;
    }

    // Generate a standalone HTML file with embedded visualization
    generateStandaloneHTML(simulator) {
    const stateSpace = simulator.getStateSpaceTree();
    const html = this.generateHTMLVisualization();
    
    // Instead of injecting JSON, we'll create a separate data file
    // or use a safer approach
    const safeJson = JSON.stringify(stateSpace)
        .replace(/</g, '\\u003c')  // Escape < characters
        .replace(/>/g, '\\u003e')  // Escape > characters
        .replace(/&/g, '\\u0026')  // Escape & characters
        .replace(/'/g, '\\u0027')  // Escape ' characters
        .replace(/"/g, '\\u0022'); // Escape " characters
    
    const scriptData = `
        <script>
            try {
                // Parse the safe JSON
                window.actualStateSpace = JSON.parse('${safeJson}');
                
                // Override the createSampleStateSpace method to use real data
                GitStateVisualizerUI.prototype.createSampleStateSpace = async function() {
                    return window.actualStateSpace || await this.createSampleStateSpace();
                };
            } catch(e) {
                console.error('Failed to load state space:', e);
            }
        </script>
    `;
    
    return html.replace('</body>', scriptData + '</body>');
}
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GitStateVisualizer };
}

// Auto-run if executed directly in Node.js
if (typeof require !== 'undefined' && require.main === module) {
    // This would typically load decision_tree.js and run simulation
    console.log('Git State Visualizer loaded. Use in HTML or import in your project.');
    console.log('To generate visualization:');
    console.log('1. Create an HTML file with the generated HTML');
    console.log('2. Or use the generateStandaloneHTML() method');
}