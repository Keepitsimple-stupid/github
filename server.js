const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.send(html);
});

// Generate visualization endpoint
app.get('/generate', (req, res) => {
    try {
        // Load the simulator and visualizer
        const { GitStateSpaceTree } = require('./decision_tree.js');
        const { GitStateVisualizer } = require('./main_second.js');
        
        // Run simulation
        const simulator = new GitStateSpaceTree();
        
        // Run some commands
        const commands = [
            'git init',
            'git add main.py',
            'git commit -m "Initial commit"',
            'git branch feature',
            'git switch feature',
            'git add utils.py',
            'git commit -m "Add utils"',
            'git switch main',
            'git merge feature'
        ];
        
        commands.forEach(cmd => simulator.executeCommand(cmd));
        
        // Generate visualization
        const visualizer = new GitStateVisualizer();
        visualizer.loadStateSpace(simulator);
        const html = visualizer.generateStandaloneHTML(simulator);
        
        res.send(html);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Open http://localhost:${PORT} in your browser`);
});