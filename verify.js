// Final verification script - run this in browser console
console.log('=== Final Verification ===');

// Check global objects
console.log('window.gitProcessor:', typeof window.gitProcessor);
console.log('executeCommand function:', typeof executeCommand);
console.log('updateTerminal function:', typeof updateTerminal);
console.log('updateTimeline function:', typeof updateTimeline);

// Check GitProcessor methods
if (window.gitProcessor) {
    console.log('GitProcessor methods:');
    console.log('- processCommand:', typeof window.gitProcessor.processCommand);
    console.log('- addTerminalOutput:', typeof window.gitProcessor.addTerminalOutput);
    console.log('- getTerminalOutput:', typeof window.gitProcessor.getTerminalOutput);
    console.log('- getLocalFiles:', typeof window.gitProcessor.getLocalFiles);
    
    // Check timeline methods
    console.log('Timeline methods:');
    console.log('- getTimelineData:', typeof window.gitProcessor.timeline.getTimelineData);
    console.log('- getCurrentBranch:', typeof window.gitProcessor.timeline.getCurrentBranch);
    console.log('- getCommits:', typeof window.gitProcessor.timeline.getCommits);
}

// Check DOM elements
const elements = [
    'terminal-input', 'terminal-output', 'timeline-log', 'terminal',
    'branch-visualizer', 'commit-nodes',
    'stage-working', 'stage-staging', 'stage-local', 'stage-remote'
];

console.log('DOM Elements:');
elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`- ${id}:`, element ? '✓' : '✗');
});

// Check GitGraphVisualizer
console.log('gitGraphVisualizer:', typeof gitGraphVisualizer);
if (gitGraphVisualizer) {
    console.log('GitGraphVisualizer methods:');
    console.log('- render:', typeof gitGraphVisualizer.render);
    console.log('- setZoom:', typeof gitGraphVisualizer.setZoom);
    console.log('- resetView:', typeof gitGraphVisualizer.resetView);
    console.log('- centerView:', typeof gitGraphVisualizer.centerView);
}

console.log('=== Verification Complete ===');
