// timeline-visualizer.js - FIXED VERSION

// Terminal Emulator Class
class TerminalEmulator {
    constructor(visualizer) {
        this.visualizer = visualizer;
    }

    executeCommand(command) {
        // For non-git commands, just return success
        if (!command.startsWith('git ')) {
            return {
                success: true,
                output: `${command}\nCommand executed successfully`
            };
        }
        
        // For git commands, delegate to git core
        return this.visualizer.gitCore.executeCommand(command);
    }
}

class TimelineVisualizer {
    constructor(gitCore) {
        this.gitCore = gitCore;
        this.timelinePosition = 100;
        this.commitSpacing = 120;
        this.branchYPositions = {};
        this.commitNodes = new Map();
        this.branchPaths = new Map();
        this.currentBranchHeight = 200; // Center position
        this.selectedMainCommand = 'init';
        this.terminalVisible = false;
        this.currentDirectory = '/home/developer/project_👍';
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Initialize terminal emulator
        this.terminalEmulator = new TerminalEmulator(this);
        
        // Define auxiliary commands for each main command
        this.auxiliaryCommands = {
            init: [
                { cmd: 'git init', desc: 'Initialize new repository' },
                { cmd: 'git init --bare', desc: 'Initialize bare repository' },
                { cmd: 'git init project_name', desc: 'Initialize with custom name' }
            ],
            add: [
                { cmd: 'git add .', desc: 'Add all files' },
                { cmd: 'git add filename', desc: 'Add specific file' },
                { cmd: 'git add -A', desc: 'Add all including deletions' },
                { cmd: 'git add -p', desc: 'Add patches interactively' }
            ],
            commit: [
                { cmd: 'git commit -m "message"', desc: 'Commit with message' },
                { cmd: 'git commit -am "message"', desc: 'Add all and commit' },
                { cmd: 'git commit --amend', desc: 'Amend last commit' },
                { cmd: 'git commit --no-edit', desc: 'Commit without editing message' }
            ],
            branch: [
                { cmd: 'git branch', desc: 'List branches' },
                { cmd: 'git branch branch_name', desc: 'Create new branch' },
                { cmd: 'git branch -d branch_name', desc: 'Delete branch' },
                { cmd: 'git branch -a', desc: 'List all branches' }
            ],
            switch: [
                { cmd: 'git switch branch_name', desc: 'Switch to branch' },
                { cmd: 'git switch -c branch_name', desc: 'Create and switch' },
                { cmd: 'git switch -', desc: 'Switch to previous branch' }
            ],
            merge: [
                { cmd: 'git merge branch_name', desc: 'Merge branch' },
                { cmd: 'git merge --no-ff branch_name', desc: 'Merge without fast-forward' },
                { cmd: 'git merge --abort', desc: 'Abort merge' },
                { cmd: 'git merge --squash branch_name', desc: 'Squash merge' }
            ],
            status: [
                { cmd: 'git status', desc: 'Show working tree status' },
                { cmd: 'git status -s', desc: 'Short status format' },
                { cmd: 'git status -b', desc: 'Show branch info' }
            ],
            log: [
                { cmd: 'git log', desc: 'Show commit history' },
                { cmd: 'git log --oneline', desc: 'Compact log' },
                { cmd: 'git log --graph', desc: 'Graph view' },
                { cmd: 'git log -p', desc: 'Show patches' }
            ],
            push: [
                { cmd: 'git push', desc: 'Push to remote' },
                { cmd: 'git push origin main', desc: 'Push specific branch' },
                { cmd: 'git push -u origin branch', desc: 'Push and set upstream' },
                { cmd: 'git push --force', desc: 'Force push' }
            ],
            pull: [
                { cmd: 'git pull', desc: 'Pull from remote' },
                { cmd: 'git pull origin main', desc: 'Pull specific branch' },
                { cmd: 'git pull --rebase', desc: 'Pull with rebase' },
                { cmd: 'git pull --ff-only', desc: 'Fast-forward only' }
            ],
            restore: [
                { cmd: 'git restore file.txt', desc: 'Restore file' },
                { cmd: 'git restore --staged file.txt', desc: 'Unstage file' },
                { cmd: 'git restore --source=HEAD~1 file.txt', desc: 'Restore from commit' }
            ],
            reset: [
                { cmd: 'git reset HEAD', desc: 'Reset staging area' },
                { cmd: 'git reset --hard HEAD', desc: 'Reset working directory' },
                { cmd: 'git reset --soft HEAD~1', desc: 'Soft reset' },
                { cmd: 'git reset --mixed HEAD~1', desc: 'Mixed reset' }
            ],
            remote: [
                { cmd: 'git remote -v', desc: 'List remotes' },
                { cmd: 'git remote add origin url', desc: 'Add remote' },
                { cmd: 'git remote remove origin', desc: 'Remove remote' },
                { cmd: 'git remote rename old new', desc: 'Rename remote' }
            ],
            clone: [
                { cmd: 'git clone url', desc: 'Clone repository' },
                { cmd: 'git clone url directory', desc: 'Clone to directory' },
                { cmd: 'git clone --depth 1 url', desc: 'Shallow clone' }
            ],
            fetch: [
                { cmd: 'git fetch', desc: 'Fetch from remote' },
                { cmd: 'git fetch origin', desc: 'Fetch from specific remote' },
                { cmd: 'git fetch --all', desc: 'Fetch from all remotes' },
                { cmd: 'git fetch --prune', desc: 'Prune remote branches' }
            ],
            stash: [
                { cmd: 'git stash', desc: 'Stash changes' },
                { cmd: 'git stash pop', desc: 'Apply and remove stash' },
                { cmd: 'git stash apply', desc: 'Apply stash' },
                { cmd: 'git stash list', desc: 'List stashes' }
            ],
            tag: [
                { cmd: 'git tag', desc: 'List tags' },
                { cmd: 'git tag v1.0', desc: 'Create tag' },
                { cmd: 'git tag -a v1.0 -m "message"', desc: 'Create annotated tag' },
                { cmd: 'git push --tags', desc: 'Push tags' }
            ]
        };
    }

    initializeEventListeners() {
        // Terminal input event listener
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) {
            terminalInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.executeTerminalCommand();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateHistory(1);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.autocomplete();
                }
            });
        }

        // Copy-paste functionality for terminal
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.addEventListener('keydown', (e) => {
                // Ctrl+Shift+C for copy
                if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                    e.preventDefault();
                    this.copyTerminalSelection();
                }
                // Ctrl+Shift+V for paste
                else if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                    e.preventDefault();
                    this.pasteToTerminal();
                }
                // Ctrl+C for interrupt (but not copy)
                else if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
                    e.preventDefault();
                    this.interruptCommand();
                }
            });
        }

        // Main command buttons
        document.querySelectorAll('.main-cmd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectMainCommand(btn.dataset.cmd);
            });
        });

        // Initialize auxiliary commands display
        this.updateAuxiliaryCommands('init');
        const clearBtn = document.querySelector('[onclick*="clearTerminal"]');
        if (clearBtn) {
            clearBtn.onclick = () => this.clearTerminal();
        }
        
        // Initialize with first command
        this.selectMainCommand('init');
    }

    init() {
        this.updateGitStatus();
        this.renderWorkingDirectory();
        this.setupEventListeners();
        this.initializeSVG();
        
        // Add initial welcome
        this.addTerminalLine('Welcome to Git Timeline Visualizer!', 'info');
        this.addTerminalLine('Project: project_👍 with Python files', 'info');
        this.addTerminalLine('Type "git init" to start or use quick buttons.', 'info');
    }

    initializeSVG() {
        const visualizer = document.getElementById('branch-visualizer');
        if (!visualizer) {
            console.error('SVG container not found!');
            return;
        }
        
        // Clear any existing SVG content
        visualizer.innerHTML = '';
        
        // Set proper viewBox for responsive SVG
        visualizer.setAttribute('viewBox', '0 0 1200 400');
        visualizer.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Add main timeline line in SVG
        const svgNS = 'http://www.w3.org/2000/svg';
        const mainLine = document.createElementNS(svgNS, 'line');
        mainLine.id = 'svg-main-timeline';
        mainLine.setAttribute('x1', '50');
        mainLine.setAttribute('y1', '200');
        mainLine.setAttribute('x2', '1150');
        mainLine.setAttribute('y2', '200');
        mainLine.setAttribute('stroke', '#00b4db');
        mainLine.setAttribute('stroke-width', '4');
        mainLine.setAttribute('stroke-linecap', 'round');
        mainLine.style.filter = 'drop-shadow(0 0 10px rgba(0, 180, 219, 0.5))';
        visualizer.appendChild(mainLine);
        
        // Add grid lines for better visualization
        for (let i = 100; i <= 1100; i += 120) {
            const gridLine = document.createElementNS(svgNS, 'line');
            gridLine.setAttribute('x1', i);
            gridLine.setAttribute('y1', '50');
            gridLine.setAttribute('x2', i);
            gridLine.setAttribute('y2', '350');
            gridLine.setAttribute('stroke', 'rgba(100, 150, 255, 0.1)');
            gridLine.setAttribute('stroke-width', '1');
            gridLine.setAttribute('stroke-dasharray', '2,4');
            visualizer.appendChild(gridLine);
        }
    }

    setupEventListeners() {
        // Terminal input event listener
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) {
            terminalInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.executeTerminalCommand();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateHistory(1);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.autocomplete();
                }
            });
        }

        // Copy-paste functionality for terminal
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.addEventListener('keydown', (e) => {
                // Ctrl+Shift+C for copy
                if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                    e.preventDefault();
                    this.copyTerminalSelection();
                }
                // Ctrl+Shift+V for paste
                else if (e.ctrlKey && e.shiftKey && e.key === 'V') {
                    e.preventDefault();
                    this.pasteToTerminal();
                }
                // Ctrl+C for interrupt (but not copy)
                else if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
                    e.preventDefault();
                    this.interruptCommand();
                }
            });
        }

        // Main command buttons
        document.querySelectorAll('.main-cmd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectMainCommand(btn.dataset.command);
            });
        });

        // Initialize auxiliary commands display
        this.updateAuxiliaryCommands('init');
        const clearBtn = document.querySelector('[onclick*="clearTerminal"]');
        if (clearBtn) {
            clearBtn.onclick = () => this.clearTerminal();
        }
        
        // Initialize with first command
        this.selectMainCommand('init');
    }

    executeCommand() {
        const input = document.getElementById('git-command');
        const command = input.value.trim();
        
        if (!command) {
            this.addTerminalLine('Please enter a Git command.', 'warning');
            return;
        }
        
        // Clear input
        input.value = '';
        
        // Show command in terminal
        this.addTerminalLine(`$ ${command}`, 'prompt');
        
        // Execute command
        const result = this.gitCore.executeCommand(command);
        
        // Show result
        if (result.success) {
            this.addTerminalLine(result.output, 'success');
            
            if (result.stateChange) {
                this.updateVisualization(result);
            }
            
            if (result.commit) {
                this.addCommitToTimeline(result.commit);
            }
            
            if (result.branchSwitch) {
                this.highlightBranchSwitch(result.branchSwitch);
            }
        } else {
            this.addTerminalLine(result.output, 'error');
        }
        
        // Update UI
        this.updateGitStatus();
        this.updateStages();
        
        // Keep focus on input
        input.focus();
    }

    quickCommand(command) {
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) {
            terminalInput.value = command;
            this.executeTerminalCommand();
        }
    }

    selectMainCommand(cmd) {
        this.selectedMainCommand = cmd;
        
        // Update active button
        document.querySelectorAll('.main-cmd-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-cmd="${cmd}"]`).classList.add('active');
        
        // Update auxiliary commands
        this.updateAuxiliaryCommands(cmd);
    }

    updateAuxiliaryCommands(mainCmd) {
        const auxContainer = document.getElementById('auxiliary-commands');
        const commands = this.auxiliaryCommands[mainCmd] || [];
        
        auxContainer.innerHTML = `
            <h4>Auxiliary Commands for git ${mainCmd}</h4>
        `;
        
        commands.forEach(({cmd, desc}) => {
            const btn = document.createElement('button');
            btn.className = 'aux-cmd-btn';
            btn.textContent = cmd;
            btn.title = desc;
            btn.addEventListener('click', () => {
                this.quickCommand(cmd);
            });
            auxContainer.appendChild(btn);
        });
    }

    executeTerminalCommand() {
        const terminalInput = document.getElementById('terminal-input');
        const command = terminalInput.value.trim();
        
        if (!command) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        
        // Show command in terminal with current prompt
        this.addTerminalLine(`${this.getPrompt()}${command}`, 'prompt');
        
        // Execute command through terminal emulator
        const result = this.terminalEmulator.executeCommand(command);
        
        // Show result
        if (result.success) {
            this.addTerminalLine(result.output, 'success');
            
            // Handle Git commands that affect visualization
            if (command.startsWith('git ')) {
                const gitResult = this.gitCore.executeCommand(command);
                if (gitResult.success) {
                    if (gitResult.stateChange) {
                        this.updateVisualization(gitResult);
                    }
                    
                    if (gitResult.commit) {
                        this.addCommitToTimeline(gitResult.commit);
                    }
                    
                    if (gitResult.branchSwitch) {
                        this.highlightBranchSwitch(gitResult.branchSwitch);
                    }
                }
            }
        } else {
            this.addTerminalLine(result.output, 'error');
        }
        
        // Update UI
        this.updateGitStatus();
        this.updateStages();
        
        // Update terminal prompt after command execution
        this.updateTerminalPrompt();
        
        // Clear input and keep focus
        terminalInput.value = '';
        terminalInput.focus();
    }

    getPrompt() {
        const homeDir = '/home/developer';
        let displayPath = this.currentDirectory;
        
        // Convert home directory to ~ for display
        if (this.currentDirectory.startsWith(homeDir)) {
            displayPath = this.currentDirectory.replace(homeDir, '~');
        }
        
        return `developer@git-workstation:${displayPath}$ `;
    }

    updateTerminalPrompt() {
        const promptElement = document.getElementById('terminal-prompt');
        if (promptElement) {
            promptElement.textContent = this.getPrompt();
        }
    }

    copyTerminalSelection() {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        if (selectedText) {
            navigator.clipboard.writeText(selectedText).then(() => {
                this.addTerminalLine('✓ Text copied to clipboard', 'info');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = selectedText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.addTerminalLine('✓ Text copied to clipboard', 'info');
            });
        } else {
            this.addTerminalLine('No text selected to copy', 'warning');
        }
    }

    pasteToTerminal() {
        navigator.clipboard.readText().then((text) => {
            const terminalInput = document.getElementById('terminal-input');
            if (terminalInput) {
                const start = terminalInput.selectionStart;
                const end = terminalInput.selectionEnd;
                const currentValue = terminalInput.value;
                
                terminalInput.value = currentValue.substring(0, start) + text + currentValue.substring(end);
                terminalInput.selectionStart = terminalInput.selectionEnd = start + text.length;
                terminalInput.focus();
                
                this.addTerminalLine('✓ Text pasted from clipboard', 'info');
            }
        }).catch(() => {
            this.addTerminalLine('Failed to paste from clipboard', 'error');
        });
    }

    interruptCommand() {
        this.addTerminalLine('^C', 'warning');
        this.addTerminalLine('Command interrupted', 'warning');
        
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) {
            terminalInput.value = '';
            terminalInput.focus();
        }
    }

    toggleTerminal() {
        const terminal = document.getElementById('terminal');
        this.terminalVisible = !this.terminalVisible;
        
        if (this.terminalVisible) {
            terminal.classList.remove('minimized');
            terminal.classList.add('expanded');
            // Focus terminal input
            setTimeout(() => {
                document.getElementById('terminal-input').focus();
            }, 300);
        } else {
            terminal.classList.add('minimized');
            terminal.classList.remove('expanded');
        }
    }

    updateVisualization(result) {
        this.renderWorkingDirectory();
        this.updateStages();
        this.updateBranchVisualization();
        
        // Handle timeline nodes and edges
        if (result.timelineNode) {
            this.addTimelineNode(result.timelineNode);
        }
        
        // Update timeline edges
        this.updateTimelineEdges();
    }

    addTimelineNode(timelineNode) {
        const timelineContainer = document.getElementById('commit-nodes');
        if (!timelineContainer) {
            console.error('Timeline container not found!');
            return;
        }
        
        const state = this.gitCore.getState();
        const nodeData = state.timelineNodes[timelineNode.id];
        if (!nodeData) return;
        
        // Calculate position
        const nodeIndex = Object.keys(state.timelineNodes).length - 1;
        const xPosition = 100 + (nodeIndex * this.commitSpacing);
        const yPosition = this.getBranchYPosition(nodeData.branch);
        
        // Create node element
        const node = document.createElement('div');
        node.className = `commit-node ${timelineNode.type}`;
        node.style.left = `${xPosition}px`;
        node.style.top = `${yPosition}px`;
        node.setAttribute('data-node-id', timelineNode.id);
        node.setAttribute('data-branch', nodeData.branch);
        
        // Add styling based on type
        switch (timelineNode.type) {
            case 'init':
                node.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                break;
            case 'add':
                node.style.background = 'linear-gradient(135deg, #f093fb, #f5576c)';
                break;
            case 'commit':
                node.style.background = 'linear-gradient(135deg, #4ecdc4, #44a08d)';
                break;
            case 'branch':
                node.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e53)';
                break;
            case 'switch':
                node.style.background = 'linear-gradient(135deg, #06b6d4, #0891b2)';
                break;
            case 'merge':
                node.style.background = 'linear-gradient(135deg, #ff9ff3, #f368e0)';
                break;
            case 'push':
                node.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
                break;
            case 'pull':
                node.style.background = 'linear-gradient(135deg, #34d399, #10b981)';
                break;
            case 'clone':
                node.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
                break;
            default:
                node.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
        }
        
        // Add tooltip
        node.title = `${nodeData.command}\n${nodeData.description}\nBranch: ${nodeData.branch}\nTime: ${new Date(nodeData.timestamp).toLocaleTimeString()}`;
        
        // Create label
        const label = document.createElement('div');
        label.className = 'commit-label';
        label.innerHTML = `
            <div style="font-weight:bold;color:#4ecdc4;">${nodeData.command}</div>
            <div style="font-size:0.8em;margin:2px 0;">${nodeData.description}</div>
            <div style="font-size:0.7em;color:#aaa;">
                <span style="background:${this.getBranchColor(nodeData.branch)};padding:2px 6px;border-radius:3px;">${nodeData.branch}</span>
                <span style="margin-left:5px;">${new Date(nodeData.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
        node.appendChild(label);
        
        // Add click handler
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNodeDetails(nodeData);
        });
        
        // Add hover effects
        node.addEventListener('mouseenter', () => {
            node.style.transform = 'translate(-50%, -50%) scale(1.2)';
            node.style.zIndex = '20';
        });
        
        node.addEventListener('mouseleave', () => {
            node.style.transform = 'translate(-50%, -50%) scale(1)';
            node.style.zIndex = '11';
        });
        
        // Add to timeline
        timelineContainer.appendChild(node);
        
        // Store reference
        this.commitNodes.set(timelineNode.id, {
            element: node,
            nodeData,
            position: { x: xPosition, y: yPosition },
            branch: nodeData.branch
        });
        
        // Extend timeline
        this.extendTimeline(xPosition + this.commitSpacing);
        
        // Animate the node
        this.animateNode(node);
        
        // Update branch labels
        this.updateBranchLabels();
    }

    updateTimelineEdges() {
        const visualizer = document.getElementById('branch-visualizer');
        if (!visualizer) return;
        
        const svgNS = 'http://www.w3.org/2000/svg';
        
        // Remove existing edges
        const existingEdges = visualizer.querySelectorAll('.timeline-edge');
        existingEdges.forEach(edge => edge.remove());
        
        const state = this.gitCore.getState();
        
        // Draw edges
        state.timelineEdges.forEach(edge => {
            const fromNode = this.commitNodes.get(edge.from);
            const toNode = this.commitNodes.get(edge.to);
            
            if (fromNode && toNode) {
                const path = document.createElementNS(svgNS, 'path');
                path.classList.add('timeline-edge');
                
                // Create curved path
                const fromX = fromNode.position.x;
                const fromY = fromNode.position.y;
                const toX = toNode.position.x;
                const toY = toNode.position.y;
                
                const midX = (fromX + toX) / 2;
                const controlY = Math.min(fromY, toY) - 30;
                
                const d = `M ${fromX} ${fromY} Q ${midX} ${controlY} ${toX} ${toY}`;
                path.setAttribute('d', d);
                
                // Style based on edge type
                switch (edge.type) {
                    case 'push':
                        path.setAttribute('stroke', '#fbbf24');
                        path.setAttribute('stroke-width', '3');
                        path.setAttribute('stroke-dasharray', '5,3');
                        break;
                    case 'pull':
                        path.setAttribute('stroke', '#34d399');
                        path.setAttribute('stroke-width', '3');
                        path.setAttribute('stroke-dasharray', '5,3');
                        break;
                    case 'merge':
                        path.setAttribute('stroke', '#ff9ff3');
                        path.setAttribute('stroke-width', '4');
                        break;
                    default:
                        path.setAttribute('stroke', '#4ecdc4');
                        path.setAttribute('stroke-width', '2');
                }
                
                path.setAttribute('fill', 'none');
                path.setAttribute('opacity', '0.8');
                path.style.filter = 'drop-shadow(0 0 3px rgba(78, 205, 196, 0.3))';
                
                // Add animation
                const animate = document.createElementNS(svgNS, 'animate');
                animate.setAttribute('attributeName', 'stroke-dashoffset');
                animate.setAttribute('from', '100');
                animate.setAttribute('to', '0');
                animate.setAttribute('dur', '1s');
                animate.setAttribute('fill', 'freeze');
                path.appendChild(animate);
                
                visualizer.appendChild(path);
            }
        });
    }

    getBranchYPosition(branchName) {
        if (!this.branchYPositions[branchName]) {
            this.branchYPositions[branchName] = this.currentBranchHeight;
            
            // For new branches, offset from main
            if (branchName !== 'main' && this.branchYPositions['main']) {
                const branchCount = Object.keys(this.branchYPositions).length - 1;
                this.branchYPositions[branchName] = this.branchYPositions['main'] + (branchCount * 60);
            }
        }
        return this.branchYPositions[branchName];
    }

    animateNode(node) {
        node.style.transform = 'translate(-50%, -50%) scale(0)';
        node.style.opacity = '0';
        
        setTimeout(() => {
            node.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            node.style.transform = 'translate(-50%, -50%) scale(1)';
            node.style.opacity = '1';
        }, 100);
    }

    showNodeDetails(nodeData) {
        this.addTerminalLine(`Node Details:`, 'info');
        this.addTerminalLine(`  Command: ${nodeData.command}`, 'info');
        this.addTerminalLine(`  Description: ${nodeData.description}`, 'info');
        this.addTerminalLine(`  Branch: ${nodeData.branch}`, 'info');
        this.addTerminalLine(`  Time: ${new Date(nodeData.timestamp).toLocaleString()}`, 'info');
        if (nodeData.commitHash) {
            this.addTerminalLine(`  Commit: ${nodeData.commitHash}`, 'info');
        }
    }

    renderWorkingDirectory() {
        const state = this.gitCore.currentState;
        const branchState = this.gitCore.getCurrentBranchState();
        const workingFilesList = document.getElementById('working-files');
        const stagedFilesList = document.getElementById('staged-files');
        
        if (workingFilesList) {
            workingFilesList.innerHTML = '';
            
            if (!branchState.workingDirectory || branchState.workingDirectory.length === 0) {
                workingFilesList.innerHTML = '<div style="color:#666;padding:10px;text-align:center;">No files</div>';
            } else {
                branchState.workingDirectory.forEach(file => {
                    const li = document.createElement('li');
                    li.className = `file-item ${this.getFileTypeClass(file.name)}`;
                    li.innerHTML = `
                        <span class="file-icon">${this.getFileIcon(file.name)}</span>
                        <span style="flex:1">${file.name}</span>
                        ${file.staged ? '<span style="color:#4ecdc4;font-size:0.8em;">✓ staged</span>' : ''}
                        ${file.committed ? '<span style="color:#96ceb4;font-size:0.8em;">✓ committed</span>' : ''}
                    `;
                    workingFilesList.appendChild(li);
                });
            }
        }
        
        if (stagedFilesList) {
            stagedFilesList.innerHTML = '';
            
            if (!branchState.stagingArea || branchState.stagingArea.length === 0) {
                stagedFilesList.innerHTML = '<div style="color:#666;padding:10px;text-align:center;">No staged files</div>';
            } else {
                branchState.stagingArea.forEach(fileName => {
                    const file = branchState.workingDirectory.find(f => f.name === fileName);
                    const li = document.createElement('li');
                    li.className = `file-item ${this.getFileTypeClass(fileName)}`;
                    li.innerHTML = `
                        <span class="file-icon">${this.getFileIcon(fileName)}</span>
                        <span style="flex:1">${fileName}</span>
                        <span style="color:#4ecdc4;font-size:0.8em;">✓ staged</span>
                    `;
                    stagedFilesList.appendChild(li);
                });
            }
        }
    }

    updateStages() {
        const state = this.gitCore.currentState;
        
        // Update all stages with counts
        const stages = [
            { id: 'stage-working', element: document.getElementById('stage-working'), count: state.localDirectory.length, files: state.localDirectory },
            { id: 'stage-staging', element: document.getElementById('stage-staging'), count: state.stageDirectory.length, files: state.stageDirectory },
            { id: 'stage-local', element: document.getElementById('stage-local'), count: state.commitDirectory.length, files: state.commitDirectory },
            { id: 'stage-remote', element: document.getElementById('stage-remote'), count: state.remoteDirectory.length, files: state.remoteDirectory }
        ];
        
        stages.forEach(stage => {
            if (stage.element) {
                const countElement = stage.element.querySelector('.file-count');
                if (countElement) {
                    countElement.textContent = stage.count;
                }
                
                // Highlight if has content
                if (stage.count > 0) {
                    stage.element.classList.add('active');
                } else {
                    stage.element.classList.remove('active');
                }
                
                // Update file list
                const fileList = stage.element.querySelector('.file-list');
                if (fileList) {
                    fileList.innerHTML = '';
                    
                    if (stage.files.length === 0) {
                        fileList.innerHTML = '<div style="color:#666;padding:10px;text-align:center;">No files</div>';
                    } else {
                        stage.files.forEach(file => {
                            const li = document.createElement('li');
                            li.className = `file-item ${this.getFileTypeClass(file.name)}`;
                            li.innerHTML = `
                                <span class="file-icon">${this.getFileIcon(file.name)}</span>
                                <span style="flex:1">${file.name}</span>
                                ${file.staged ? '<span style="color:#4ecdc4;font-size:0.8em;">✓ staged</span>' : ''}
                                ${file.committed ? '<span style="color:#96ceb4;font-size:0.8em;">✓ committed</span>' : ''}
                            `;
                            fileList.appendChild(li);
                        });
                    }
                }
            }
        });
        
        // Update committed files with commit history
        const committedList = document.getElementById('committed-files');
        if (committedList) {
            committedList.innerHTML = '';
            
            if (state.commits.size === 0) {
                committedList.innerHTML = '<div style="color:#666;padding:10px;text-align:center;">No commits yet</div>';
            } else {
                // Show last 5 commits
                const recentCommits = Array.from(state.commits.values()).slice(-5).reverse();
                recentCommits.forEach(commit => {
                    const li = document.createElement('li');
                    li.className = 'file-item';
                    li.innerHTML = `
                        <span class="file-icon">${commit.isMerge ? '🔄' : '📝'}</span>
                        <div style="flex:1">
                            <div style="font-weight:bold;">${commit.hash.substring(0, 7)}</div>
                            <div style="font-size:0.85em;color:#aaa;">${commit.message}</div>
                        </div>
                    `;
                    committedList.appendChild(li);
                });
            }
        }
        
        // Update remote files with remotes info
        const remoteList = document.getElementById('remote-files');
        if (remoteList) {
            remoteList.innerHTML = '';
            
            if (Object.keys(state.remotes).length === 0) {
                remoteList.innerHTML = '<div style="color:#666;padding:10px;text-align:center;">No remote configured</div>';
            } else {
                Object.entries(state.remotes).forEach(([name, url]) => {
                    const li = document.createElement('li');
                    li.className = 'file-item';
                    li.innerHTML = `
                        <span class="file-icon">🌐</span>
                        <div style="flex:1">
                            <div style="font-weight:bold;">${name}</div>
                            <div style="font-size:0.85em;color:#aaa;">${url}</div>
                        </div>
                    `;
                    remoteList.appendChild(li);
                });
            }
        }
    }

    updateGitStatus() {
        const state = this.gitCore.getState();
        const branchElement = document.getElementById('current-branch');
        const commitCountElement = document.getElementById('commit-count');
        
        if (branchElement) {
            if (state.isInitialized) {
                branchElement.textContent = `On branch: ${state.currentBranch}`;
                branchElement.style.color = '#4ecdc4';
                branchElement.style.fontWeight = 'bold';
            } else {
                branchElement.textContent = 'No repository (use git init)';
                branchElement.style.color = '#ff6b6b';
            }
        }
        
        if (commitCountElement) {
            if (state.commits.length > 0) {
                commitCountElement.textContent = ` • ${state.commits.length} commit${state.commits.length !== 1 ? 's' : ''}`;
                commitCountElement.style.color = '#96ceb4';
            } else {
                commitCountElement.textContent = '';
            }
        }
    }

    addCommitToTimeline(commit) {
        const timelineContainer = document.getElementById('commit-nodes');
        const visualizer = document.getElementById('branch-visualizer');
        
        if (!timelineContainer || !visualizer) {
            console.error('Timeline containers not found!');
            return;
        }
        
        const state = this.gitCore.getState();
        const isMerge = commit.isMerge || false;
        const branchName = state.currentBranch;
        
        // Get or create branch Y position
        if (!this.branchYPositions[branchName]) {
            this.branchYPositions[branchName] = this.currentBranchHeight;
            
            // For new branches, offset from main
            if (branchName !== 'main' && this.branchYPositions['main']) {
                const branchCount = Object.keys(this.branchYPositions).length - 1;
                this.branchYPositions[branchName] = this.branchYPositions['main'] + (branchCount * 60);
            }
        }
        
        // Calculate position with better spacing
        const commitIndex = state.commits.length - 1; // This commit is last
        const xPosition = 100 + (commitIndex * this.commitSpacing);
        const yPosition = this.branchYPositions[branchName];
        
        // Create commit node with enhanced styling
        const node = document.createElement('div');
        node.className = `commit-node ${isMerge ? 'merge' : ''} ${branchName !== 'main' ? 'branch-commit' : ''}`;
        node.style.left = `${xPosition}px`;
        node.style.top = `${yPosition}px`;
        node.setAttribute('data-hash', commit.hash);
        node.setAttribute('data-branch', branchName);
        
        // Add enhanced tooltip
        node.title = `${commit.hash.substring(0, 7)}\n${commit.message}\nBranch: ${branchName}\nTime: ${new Date(commit.timestamp).toLocaleTimeString()}`;
        
        // Create and add enhanced label
        const label = document.createElement('div');
        label.className = 'commit-label';
        label.innerHTML = `
            <div style="font-weight:bold;color:#4ecdc4;">${commit.hash.substring(0, 7)}</div>
            <div style="font-size:0.8em;margin:2px 0;">${commit.message}</div>
            <div style="font-size:0.7em;color:#aaa;">
                <span style="background:${this.getBranchColor(branchName)};padding:2px 6px;border-radius:3px;">${branchName}</span>
                <span style="margin-left:5px;">${new Date(commit.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
        node.appendChild(label);
        
        // Add click handler with enhanced details
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCommitDetails(commit);
        });
        
        // Add hover effects
        node.addEventListener('mouseenter', () => {
            node.style.transform = 'translate(-50%, -50%) scale(1.2)';
            node.style.zIndex = '20';
        });
        
        node.addEventListener('mouseleave', () => {
            node.style.transform = 'translate(-50%, -50%) scale(1)';
            node.style.zIndex = '11';
        });
        
        // Add to timeline
        timelineContainer.appendChild(node);
        
        // Store reference
        this.commitNodes.set(commit.hash, {
            element: node,
            commit,
            position: { x: xPosition, y: yPosition },
            branch: branchName
        });
        
        // Draw enhanced branch path
        this.drawBranchPath(branchName, xPosition, yPosition);
        
        // Draw connection line for merges
        if (isMerge && commit.mergedFrom) {
            this.drawMergeConnection(commit.mergedFrom, branchName, xPosition, yPosition);
        }
        
        // Extend timeline
        this.extendTimeline(xPosition + this.commitSpacing);
        
        // Animate the commit with enhanced effects
        this.animateCommit(node);
        
        // Update branch labels
        this.updateBranchLabels();
        
        // Add notification
        this.addTerminalLine(`✨ New commit: ${commit.hash.substring(0, 7)} on ${branchName}`, 'info');
    }

    // Helper methods for file handling
    getFileTypeClass(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'py': 'python',
            'js': 'javascript',
            'css': 'css',
            'html': 'html',
            'md': 'markdown',
            'json': 'json',
            'txt': 'text',
            'yml': 'yaml',
            'yaml': 'yaml'
        };
        return typeMap[ext] || 'file';
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'py': '🐍',
            'js': '📜',
            'css': '🎨',
            'html': '🌐',
            'md': '📝',
            'json': '📋',
            'txt': '📄',
            'yml': '⚙️',
            'yaml': '⚙️',
            'tests': '🧪'
        };
        return iconMap[ext] || '📁';
    }

    getBranchColor(branchName) {
        const colors = {
            'main': '#4ecdc4',
            'master': '#4ecdc4',
            'feature': '#ff6b6b',
            'develop': '#feca57',
            'hotfix': '#ff9ff3',
            'release': '#54a0ff'
        };
        return colors[branchName.toLowerCase()] || this.generateColor(branchName);
    }

    generateColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }

    extendTimeline(length) {
        const timelineLine = document.getElementById('main-timeline');
        if (timelineLine) {
            timelineLine.style.right = `${1200 - length}px`;
        }
    }

    updateBranchLabels() {
        const visualizer = document.getElementById('branch-visualizer');
        if (!visualizer) return;
        
        // Remove existing labels
        const existingLabels = visualizer.querySelectorAll('.branch-label');
        existingLabels.forEach(label => label.remove());
        
        // Add branch labels
        Object.entries(this.branchYPositions).forEach(([branchName, yPosition]) => {
            const label = document.createElement('div');
            label.className = 'branch-label';
            label.textContent = branchName;
            label.style.position = 'absolute';
            label.style.left = '50px';
            label.style.top = `${yPosition - 30}px`;
            label.style.background = this.getBranchColor(branchName);
            label.style.color = 'white';
            label.style.padding = '4px 12px';
            label.style.borderRadius = '12px';
            label.style.fontSize = '0.8rem';
            label.style.fontWeight = 'bold';
            label.style.whiteSpace = 'nowrap';
            label.style.zIndex = '6';
            label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            
            visualizer.appendChild(label);
        });
    }

    addTerminalLine(message, type = 'info') {
        const terminalOutput = document.getElementById('terminal-output');
        if (!terminalOutput) return;
        
        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;
        line.style.marginBottom = '5px';
        line.style.fontFamily = 'Monaco, Consolas, monospace';
        line.style.fontSize = '0.9rem';
        line.style.lineHeight = '1.4';
        
        // Set color based on type
        switch (type) {
            case 'error':
                line.style.color = '#ff6b6b';
                break;
            case 'success':
                line.style.color = '#4ecdc4';
                break;
            case 'warning':
                line.style.color = '#feca57';
                break;
            case 'prompt':
                line.style.color = '#96ceb4';
                break;
            default:
                line.style.color = '#e0e0e0';
        }
        
        line.textContent = message;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    clearTerminal() {
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) {
            terminalOutput.innerHTML = '';
        }
    }

    drawBranchPath(branchName, xPosition, yPosition) {
        const visualizer = document.getElementById('branch-visualizer');
        const svgNS = 'http://www.w3.org/2000/svg';
        
        // Get or create path for this branch
        let path = this.branchPaths.get(branchName);
        
        if (!path) {
            path = document.createElementNS(svgNS, 'path');
            path.id = `branch-${branchName.replace(/\s+/g, '-')}`;
            path.classList.add('branch-path');
            
            // Set branch color
            const colors = {
                'main': '#4ecdc4',
                'feature': '#ff6b6b',
                'develop': '#feca57',
                'hotfix': '#ff9ff3',
                'release': '#54a0ff'
            };
            
            const color = colors[branchName.toLowerCase()] || 
                         colors[branchName] || 
                         this.generateColor(branchName);
            
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', '3');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            
            visualizer.appendChild(path);
            this.branchPaths.set(branchName, path);
        }
        
        // Get existing path or start new one
        let pathData = path.getAttribute('d');
        
        if (!pathData) {
            // Start path at first commit position
            const startX = 100;
            const startY = this.branchYPositions[branchName];
            pathData = `M ${startX} ${startY}`;
        }
        
        // Add line to new commit position
        pathData += ` L ${xPosition} ${yPosition}`;
        path.setAttribute('d', pathData);
        
        // Add animation
        path.style.strokeDasharray = '5,5';
        path.style.animation = 'dash 20s linear infinite';
    }

    drawMergeConnection(fromBranch, toBranch, xPosition, yPosition) {
        const visualizer = document.getElementById('branch-visualizer');
        const svgNS = 'http://www.w3.org/2000/svg';
        
        // Find the last commit on the from branch
        const fromCommits = Array.from(this.commitNodes.values())
            .filter(node => node.branch === fromBranch)
            .sort((a, b) => b.position.x - a.position.x);
        
        if (fromCommits.length > 0) {
            const lastFromCommit = fromCommits[0];
            
            // Create merge connection line
            const connection = document.createElementNS(svgNS, 'path');
            connection.id = `merge-${fromBranch}-to-${toBranch}-${Date.now()}`;
            connection.classList.add('merge-connection');
            
            // Bezier curve for merge
            const startX = lastFromCommit.position.x;
            const startY = lastFromCommit.position.y;
            const endX = xPosition;
            const endY = yPosition;
            const controlX1 = (startX + endX) / 2;
            const controlY1 = startY;
            const controlX2 = (startX + endX) / 2;
            const controlY2 = endY;
            
            connection.setAttribute('d', 
                `M ${startX} ${startY} 
                 C ${controlX1} ${controlY1}, 
                   ${controlX2} ${controlY2}, 
                   ${endX} ${endY}`
            );
            
            connection.setAttribute('stroke', '#ff9ff3');
            connection.setAttribute('stroke-width', '2');
            connection.setAttribute('fill', 'none');
            connection.setAttribute('stroke-dasharray', '5,5');
            
            visualizer.appendChild(connection);
            
            // Animate the merge connection
            setTimeout(() => {
                connection.style.transition = 'all 1s ease';
                connection.style.strokeDashoffset = '0';
            }, 100);
        }
    }

    extendTimeline(newMaxX) {
        const timeline = document.getElementById('main-timeline');
        const svgLine = document.getElementById('svg-main-timeline');
        
        if (timeline) {
            const containerWidth = document.querySelector('.timeline-container').offsetWidth;
            const currentRight = parseInt(timeline.style.right || '50px');
            const newRight = Math.max(50, containerWidth - newMaxX - 50);
            
            timeline.style.transition = 'right 0.5s ease';
            timeline.style.right = `${newRight}px`;
        }
        
        if (svgLine) {
            svgLine.setAttribute('x2', newMaxX.toString());
        }
    }

    highlightBranchSwitch(switchInfo) {
        const { from, to } = switchInfo;
        
        // Highlight the switched-to branch
        const toPath = this.branchPaths.get(to);
        if (toPath) {
            toPath.style.strokeWidth = '4';
            toPath.style.filter = 'drop-shadow(0 0 8px rgba(78, 205, 196, 0.8))';
            
            // Reset after animation
            setTimeout(() => {
                toPath.style.strokeWidth = '3';
                toPath.style.filter = 'none';
            }, 1500);
        }
        
        // Update branch labels
        this.updateBranchLabels();
    }

    updateBranchLabels() {
        // Remove existing labels
        document.querySelectorAll('.branch-label').forEach(label => label.remove());
        
        // Add labels for each branch
        this.branchPaths.forEach((path, branchName) => {
            const bbox = path.getBBox();
            if (bbox.width > 0 && bbox.height > 0) {
                const label = document.createElement('div');
                label.className = 'branch-label';
                label.textContent = branchName;
                label.style.position = 'absolute';
                label.style.left = `${bbox.x + bbox.width/2}px`;
                label.style.top = `${bbox.y - 25}px`;
                label.style.transform = 'translateX(-50%)';
                label.style.background = path.getAttribute('stroke');
                label.style.color = 'white';
                label.style.padding = '4px 12px';
                label.style.borderRadius = '12px';
                label.style.fontSize = '0.8em';
                label.style.fontWeight = 'bold';
                label.style.zIndex = '10';
                
                document.querySelector('.timeline-container').appendChild(label);
            }
        });
    }

    animateCommit(node) {
        // Initial state (hidden and scaled)
        node.style.transform = 'translate(-50%, -50%) scale(0) rotate(0deg)';
        node.style.opacity = '0';
        
        // Animate in with bounce effect
        requestAnimationFrame(() => {
            node.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            node.style.transform = 'translate(-50%, -50%) scale(1) rotate(360deg)';
            node.style.opacity = '1';
            
            // Add ripple effect
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.left = '50%';
                ripple.style.top = '50%';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.width = '60px';
                ripple.style.height = '60px';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'radial-gradient(circle, rgba(78, 205, 196, 0.4) 0%, transparent 70%)';
                ripple.style.zIndex = '2';
                ripple.style.animation = 'ripple 1.5s ease-out';
                ripple.style.pointerEvents = 'none';
                
                node.appendChild(ripple);
                
                // Remove ripple element after animation
                setTimeout(() => {
                    if (ripple.parentNode === node) {
                        node.removeChild(ripple);
                    }
                }, 1500);
            }, 200);
            
            // Add glow effect
            setTimeout(() => {
                node.style.boxShadow = '0 0 25px rgba(78, 205, 196, 0.8), 0 0 40px rgba(78, 205, 196, 0.4)';
                setTimeout(() => {
                    node.style.boxShadow = '0 0 15px rgba(78, 205, 196, 0.5)';
                }, 500);
            }, 600);
        });
    }

    showCommitDetails(commit) {
        const details = `
╔══════════════════════════════════╗
║         COMMIT DETAILS           ║
╠══════════════════════════════════╣
║ Hash:      ${commit.hash.substring(0, 7)}...
║ Message:   ${commit.message}
║ Branch:    ${commit.branch}
║ Time:      ${new Date(commit.timestamp).toLocaleString()}
║ Type:      ${commit.isMerge ? 'Merge Commit' : 'Regular Commit'}
║ Files:     ${commit.files ? commit.files.length : 0} changed
╚══════════════════════════════════╝
        `.trim();
        
        this.addTerminalLine(details, 'info');
    }

    addTerminalLine(text, type = 'output') {
        const terminal = document.getElementById('terminal-output');
        if (!terminal) return;
        
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        // Create timestamp
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        switch(type) {
            case 'prompt':
                line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ` +
                               `<span class="terminal-prompt">developer@git-workstation:~/project_👍$</span> ` +
                               `<span class="terminal-command">${text.replace('$ ', '')}</span>`;
                break;
                
            case 'success':
                line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ` +
                               `<span class="terminal-success">✓ ${text}</span>`;
                break;
                
            case 'error':
                line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ` +
                               `<span class="terminal-error">✗ ${text}</span>`;
                break;
                
            case 'warning':
                line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ` +
                               `<span class="terminal-warning">⚠ ${text}</span>`;
                break;
                
            case 'info':
                line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ` +
                               `<span class="terminal-info">ℹ ${text}</span>`;
                break;
                
            default:
                line.innerHTML = `<span class="terminal-timestamp">[${timestamp}]</span> ` +
                               `<span class="terminal-output">${text}</span>`;
        }
        
        terminal.appendChild(line);
        
        // Auto-scroll to bottom
        terminal.scrollTop = terminal.scrollHeight;
        
        // Limit terminal history
        const lines = terminal.querySelectorAll('.terminal-line');
        if (lines.length > 100) {
            lines[0].remove();
        }
    }

    getFileTypeClass(fileName) {
        if (fileName.endsWith('.py')) return 'python';
        if (fileName.includes('requirements')) return 'requirements';
        if (fileName.includes('config')) return 'config';
        if (fileName.includes('test')) return 'test';
        if (fileName.includes('README')) return 'markdown';
        return 'default';
    }

    clearTerminal() {
        const terminal = document.getElementById('terminal-output');
        if (terminal) {
            terminal.innerHTML = '';
            this.addTerminalLine('Terminal cleared.', 'info');
        }
    }

    resetTimeline() {
        // Reset Git core
        this.gitCore.reset();
        
        // Clear visualization
        const timeline = document.getElementById('commit-nodes');
        if (timeline) timeline.innerHTML = '';
        
        const visualizer = document.getElementById('branch-visualizer');
        if (visualizer) visualizer.innerHTML = '';
        
        // Reset positions
        this.timelinePosition = 100;
        this.branchYPositions = {};
        this.commitNodes.clear();
        this.branchPaths.clear();
        
        // Re-initialize SVG
        this.initializeSVG();
        
        // Update UI
        this.updateGitStatus();
        this.updateStages();
        this.renderWorkingDirectory();
        
        // Clear terminal and add welcome message
        this.clearTerminal();
        this.addTerminalLine('Git timeline has been reset.', 'success');
        this.addTerminalLine('Type "git init" to start a new repository.', 'info');
        
        // Focus command input
        const input = document.getElementById('git-command');
        if (input) input.focus();
    }

    generateColor(str) {
        // Generate a consistent color from a string
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }

    updateBranchVisualization() {
        // Update branch paths based on current state
        const state = this.gitCore.getState();
        
        Object.keys(state.branches).forEach(branchName => {
            if (!this.branchPaths.has(branchName)) {
                // Create path for new branch
                const yPos = this.getBranchYPosition(branchName);
                this.branchYPositions[branchName] = yPos;
                
                // Draw initial path point
                this.drawBranchPath(branchName, 100, yPos);
            }
        });
    }

    getBranchYPosition(branchName) {
        if (this.branchYPositions[branchName]) {
            return this.branchYPositions[branchName];
        }
        
        // Calculate new position
        const branchNames = Object.keys(this.branchYPositions);
        if (branchName === 'main') {
            return 200; // Center for main branch
        } else {
            // Offset for feature branches
            const offset = (branchNames.length * 60);
            return 200 + offset;
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes dash {
        to {
            stroke-dashoffset: 1000;
        }
    }
    
    @keyframes pulse {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
        }
        100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
        }
    }
    
    @keyframes ripple {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
        }
    }
    
    @keyframes fadeInUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .terminal-timestamp {
        color: #666;
        font-size: 0.85em;
        margin-right: 10px;
    }
    
    .terminal-command {
        color: #f8f8f8;
    }
    
    .terminal-success {
        color: #4ecdc4;
    }
    
    .terminal-error {
        color: #ff6b6b;
    }
    
    .terminal-warning {
        color: #feca57;
    }
    
    .terminal-info {
        color: #54a0ff;
    }
    
    .terminal-prompt {
        color: #4ecdc4;
        font-weight: bold;
    }
    
    .file-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 5px;
        background: rgba(40, 50, 70, 0.3);
        border-radius: 6px;
        border-left: 3px solid #4ecdc4;
        transition: all 0.2s ease;
    }
    
    .file-item:hover {
        background: rgba(78, 205, 196, 0.1);
        transform: translateX(3px);
    }
    
    .file-icon {
        margin-right: 8px;
        font-size: 1.1em;
    }
    
    .stage-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(100, 150, 255, 0.2);
    }
    
    .stage-title {
        font-weight: bold;
        color: #e0e0e0;
    }
    
    .file-count {
        background: rgba(78, 205, 196, 0.2);
        color: #4ecdc4;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
    }
    
    .file-list {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: 120px;
        overflow-y: auto;
    }
    
    .file-list li {
        animation: fadeInUp 0.3s ease;
    }
`;
document.head.appendChild(style);

// Export for use in browser
if (typeof window !== 'undefined') {
    window.TimelineVisualizer = TimelineVisualizer;
    window.TerminalEmulator = TerminalEmulator;
}
                return this.handleTar(parts);
            case 'wget':
            case 'curl':
                return this.handleWget(parts);
            case 'clear':
                return this.handleClear();
            case 'whoami':
                return { success: true, output: 'developer' };
            case 'hostname':
                return { success: true, output: 'git-workstation' };
            case 'date':
                return { success: true, output: new Date().toString() };
            case 'echo':
                return this.handleEcho(parts);
            case 'man':
                return this.handleMan(parts);
            case 'help':
                return this.handleHelp();
            default:
                return { success: false, output: `Command not found: ${cmd}. Type 'help' for available commands.` };
        }
    }

    handleGitCommand(parts) {
        const gitCommand = parts[1];
        const intendedProjectPath = '/home/developer/project_👍';
        const currentPath = this.visualizer.currentDirectory;

        // Handle git init with path validation
        if (gitCommand === 'init') {
            // Check if trying to init in wrong directory
            if (parts.length > 2) {
                const targetPath = this.makeAbsolute(parts[2]);
                if (targetPath !== intendedProjectPath) {
                    return { 
                        success: false, 
                        output: `fatal: cannot initialize git repository outside intended project folder\nExpected: ${intendedProjectPath}\nAttempted: ${targetPath}` 
                    };
                }
            } else if (currentPath !== intendedProjectPath) {
                return { 
                    success: false, 
                    output: `fatal: cannot initialize git repository outside intended project folder\nPlease navigate to: ${intendedProjectPath}\nCurrent directory: ${currentPath}` 
                };
            }

            // Check if already initialized
            const gitDir = this.getFileAtPath(`${currentPath}/.git`);
            if (gitDir) {
                return { success: false, output: 'fatal: already a git repository' };
            }

            // Initialize git repository
            const gitRepo = {
                type: 'dir',
                name: '.git',
                content: {
                    'HEAD': { type: 'file', content: 'ref: refs/heads/master\n' },
                    'config': { type: 'file', content: '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n' },
                    'description': { type: 'file', content: 'Unnamed repository; edit this file to name the repository.\n' },
                    'refs': {
                        type: 'dir',
                        name: 'refs',
                        content: {
                            'heads': { 
                                type: 'dir', 
                                name: 'heads', 
                                content: {
                                    'master': { type: 'file', content: '' }
                                }
                            },
                            'tags': { type: 'dir', name: 'tags', content: {} }
                        }
                    },
                    'objects': {
                        type: 'dir',
                        name: 'objects',
                        content: {
                            'info': { type: 'dir', name: 'info', content: {} },
                            'pack': { type: 'dir', name: 'pack', content: {} }
                        }
                    }
                }
            };

            // Add .git directory to filesystem
            const currentDir = this.getDirObject(currentPath);
            if (currentDir) {
                currentDir.content['.git'] = gitRepo;
                
                // Execute git init through visualizer for animation
                const gitResult = this.visualizer.gitCore.executeCommand('git init');
                
                return { 
                    success: true, 
                    output: `Initialized empty Git repository in ${currentPath}/.git/` 
                };
            }
        }

        // Handle rm -rf .git
        if (gitCommand === 'rm' && parts.includes('-rf') && parts.includes('.git')) {
            const gitDir = this.getFileAtPath(`${currentPath}/.git`);
            if (!gitDir) {
                return { success: false, output: "fatal: not a git repository (or any of the parent directories): .git" };
            }

            const currentDir = this.getDirObject(currentPath);
            if (currentDir && currentDir.content['.git']) {
                delete currentDir.content['.git'];
                
                // Reset git core state
                this.visualizer.gitCore.reset();
                
                return { success: true, output: 'Removed .git directory - repository deinitialized' };
            }
        }

        // For other git commands, pass through to git core
        const fullCommand = parts.join(' ');
        const gitResult = this.visualizer.gitCore.executeCommand(fullCommand);
        return gitResult;
    }

    handleLs(parts) {
        const showAll = parts.includes('-a');
        const longFormat = parts.includes('-l');
        const humanReadable = parts.includes('-h');
        
        const currentDir = this.getDirObject(this.visualizer.currentDirectory);
        if (!currentDir) {
            return { success: false, output: `ls: cannot access '${this.visualizer.currentDirectory}': No such file or directory` };
        }

        let files = Object.keys(currentDir.content);
        
        // Always show . and .. when using -a
        if (showAll) {
            files = ['.git', '.', '..'].concat(files);
        } else {
            // Hide files starting with . (except when -a is used)
            files = files.filter(file => !file.startsWith('.'));
        }

        if (files.length === 0) {
            return { success: true, output: '' };
        }

        if (longFormat) {
            const output = files.map(file => {
                let item;
                if (file === '.') {
                    item = { type: 'dir', content: {} };
                } else if (file === '..') {
                    item = { type: 'dir', content: {} };
                } else {
                    item = currentDir.content[file];
                }
                
                const permissions = item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
                const size = item.type === 'file' ? (item.content ? item.content.length : 0) : 4096;
                const sizeStr = humanReadable ? this.formatBytes(size) : size;
                return `${permissions} 1 developer developer ${sizeStr.toString().padStart(8)} ${new Date().toISOString().slice(0, 10)} ${file}`;
            }).join('\n');
            return { success: true, output };
        } else {
            return { success: true, output: files.join('  ') };
        }
    }

    // ────────────────────────────────────────────────
    // Add these new helper methods inside TerminalEmulator class
    // ────────────────────────────────────────────────

    // Helper: turn any path into absolute path
    makeAbsolute(relOrAbsPath) {
        if (relOrAbsPath.startsWith('/')) return relOrAbsPath;
        if (relOrAbsPath === '~' || relOrAbsPath === '~/') return '/home/developer';

        const base = this.visualizer.currentDirectory;
        let path = relOrAbsPath.startsWith('./') ? relOrAbsPath.slice(2) : relOrAbsPath;

        return (base === '/' ? '/' : base + '/') + path;
    }

    // Helper: clean path (../, //, ./, trailing slash, etc)
    normalizePath(path) {
        if (!path || path === '/') return '/';

        const isAbs = path.startsWith('/');
        let parts = path.split('/').filter(p => p !== '' && p !== '.');

        const stack = [];
        for (let part of parts) {
            if (part === '..') {
                if (stack.length > 0) stack.pop();
            } else {
                stack.push(part);
            }
        }

        let result = stack.join('/');
        if (isAbs || path.startsWith('/')) result = '/' + result;
        if (!result) result = '/';

        return result;
    }

    // Helper: get directory object from absolute path
    getDirObject(absPath) {
        let current = this.fileSystem['/'];
        if (absPath === '/' || absPath === '') return current;

        const segments = absPath.slice(1).split('/').filter(Boolean);

        for (const seg of segments) {
            if (!current?.content?.[seg]) return null;
            current = current.content[seg];
            if (current.type !== 'dir') return null;
        }
        return current;
    }

    // ────────────────────────────────────────────────
    // Improved cd handler
    // ────────────────────────────────────────────────

    handleCd(parts) {
        if (parts.length > 2) {
            return { success: false, output: 'cd: too many arguments' };
        }

        let target = parts[1] || '~';

        // Shortcuts
        if (target === '~' || target === '~/') {
            this.visualizer.currentDirectory = '/home/developer';
            this.visualizer.updateTerminalPrompt();
            return { success: true, output: '' };
        }

        if (target === '-') {
            return { success: false, output: 'cd: OLDPWD not implemented yet' };
        }

        const absPath = this.makeAbsolute(target);
        const cleanPath = this.normalizePath(absPath);

        const dir = this.getDirObject(cleanPath);

        if (!dir) {
            return { success: false, output: `cd: ${target}: No such file or directory` };
        }

        if (dir.type !== 'dir') {
            return { success: false, output: `cd: ${target}: Not a directory` };
        }

        // Success
        this.visualizer.currentDirectory = cleanPath;
        this.visualizer.updateTerminalPrompt();
        return { success: true, output: '' };
    }

    handlePwd() {
        let path = this.visualizer.currentDirectory;
        if (path.startsWith('/home/developer')) {
            path = '~' + path.substring('/home/developer'.length);
        }
        return { success: true, output: path || '~' };
    }

    handleCat(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'cat: missing file operand' };
        }

        const showLineNumbers = parts.includes('-n');
        const showEnds = parts.includes('-E');
        const files = parts.slice(1).filter(arg => !arg.startsWith('-'));

        if (files.length === 0) {
            return { success: false, output: 'cat: missing file operand' };
        }

        let output = '';
        for (const filename of files) {
            const filePath = this.makeAbsolute(filename);
            const file = this.getFileAtPath(filePath);

            if (!file) {
                return { success: false, output: `cat: ${filename}: No such file or directory` };
            }

            if (file.type === 'dir') {
                return { success: false, output: `cat: ${filename}: Is a directory` };
            }

            const content = file.content || '';
            if (content) {
                const lines = content.split('\n');
                if (showLineNumbers) {
                    const numberedLines = lines.map((line, index) => {
                        const lineNum = (index + 1).toString().padStart(6);
                        const suffix = showEnds && line ? '$' : '';
                        return `${lineNum}  ${line}${suffix}`;
                    });
                    output += numberedLines.join('\n');
                } else {
                    output += content;
                }
            }
            
            if (files.length > 1) {
                output += '\n';
            }
        }

        return { success: true, output };
    }

    handleGrep(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'Usage: grep [options] pattern [file...]' };
        }

        const pattern = parts[parts.length - 1];
        const files = parts.slice(1, -1);
        
        if (files.length === 0) {
            return { success: false, output: 'grep: No files specified' };
        }

        let results = [];
        files.forEach(filename => {
            const filePath = this.resolvePath(filename);
            const file = this.getFileAtPath(filePath);
            
            if (file && file.type === 'file' && file.content) {
                const lines = file.content.split('\n');
                lines.forEach((line, index) => {
                    if (line.includes(pattern)) {
                        results.push(`${filename}:${index + 1}:${line}`);
                    }
                });
            }
        });

        return { success: true, output: results.join('\n') || 'No matches found' };
    }

    handleFind(parts) {
        let searchPath = this.visualizer.currentDirectory;
        let namePattern = '*';
        let type = null;

        // Parse find arguments
        for (let i = 1; i < parts.length; i++) {
            if (parts[i] === '-name' && i + 1 < parts.length) {
                namePattern = parts[i + 1];
                i++;
            } else if (parts[i] === '-type' && i + 1 < parts.length) {
                type = parts[i + 1];
                i++;
            } else if (!parts[i].startsWith('-')) {
                searchPath = this.makeAbsolute(parts[i]);
            }
        }

        const results = this.findFiles(searchPath, namePattern, type);
        return { success: true, output: results.join('\n') || 'No files found' };
    }

    findFiles(searchPath, pattern, type) {
        const searchDir = this.getDirObject(searchPath);
        if (!searchDir) return [];

        const results = [];
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));

        this.searchRecursive(searchDir, searchPath, regex, type, results);
        return results;
    }

    searchRecursive(dir, currentPath, regex, type, results) {
        for (const [name, item] of Object.entries(dir.content)) {
            const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
            
            // Check if matches pattern and type
            if (regex.test(name)) {
                if (!type || (type === 'f' && item.type === 'file') || (type === 'd' && item.type === 'dir')) {
                    results.push(fullPath);
                }
            }
            
            // Recursively search directories
            if (item.type === 'dir') {
                this.searchRecursive(item, fullPath, regex, type, results);
            }
        }
    }

    handleRm(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'rm: missing operand' };
        }

        const recursive = parts.includes('-r') || parts.includes('-rf');
        const force = parts.includes('-f') || parts.includes('-rf');
        const filename = parts[parts.length - 1];
        const filePath = this.makeAbsolute(filename);
        const file = this.getFileAtPath(filePath);

        if (!file) {
            if (!force) {
                return { success: false, output: `rm: cannot remove '${filename}': No such file or directory` };
            }
            return { success: true, output: '' };
        }

        if (file.type === 'dir' && !recursive) {
            return { success: false, output: `rm: cannot remove '${filename}': Is a directory` };
        }

        // Remove the file/directory from filesystem
        const pathParts = filePath.split('/').filter(Boolean);
        const parentPath = '/' + pathParts.slice(0, -1).join('/');
        const itemName = pathParts[pathParts.length - 1];
        
        const parentDir = this.getDirObject(parentPath);
        if (parentDir && parentDir.content[itemName]) {
            delete parentDir.content[itemName];
            return { success: true, output: '' };
        }

        return { success: false, output: `rm: cannot remove '${filename}': Operation not permitted` };
    }

    handleMkdir(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'mkdir: missing operand' };
        }

        const createParents = parts.includes('-p');
        const directories = parts.slice(1).filter(arg => arg !== '-p');

        for (const dir of directories) {
            const dirPath = this.makeAbsolute(dir);
            const normalizedPath = this.normalizePath(dirPath);
            
            // Check if already exists
            const existing = this.getFileAtPath(normalizedPath);
            if (existing) {
                return { success: false, output: `mkdir: cannot create directory '${dir}': File exists` };
            }

            if (createParents) {
                // Create parent directories if needed
                this.createDirectoryWithParents(normalizedPath);
            } else {
                // Check if parent exists
                const pathParts = normalizedPath.split('/').filter(Boolean);
                const parentPath = '/' + pathParts.slice(0, -1).join('/');
                const dirName = pathParts[pathParts.length - 1];
                
                const parentDir = this.getDirObject(parentPath);
                if (!parentDir) {
                    return { success: false, output: `mkdir: cannot create directory '${dir}': No such file or directory` };
                }
                
                parentDir.content[dirName] = {
                    type: 'dir',
                    name: dirName,
                    content: {}
                };
            }
        }

        return { success: true, output: '' };
    }

    createDirectoryWithParents(dirPath) {
        const pathParts = dirPath.split('/').filter(Boolean);
        let currentPath = '/';
        
        for (const part of pathParts) {
            const currentDir = this.getDirObject(currentPath);
            if (!currentDir) return false;
            
            if (!currentDir.content[part]) {
                currentDir.content[part] = {
                    type: 'dir',
                    name: part,
                    content: {}
                };
            }
            
            currentPath = currentPath === '/' ? `/${part}` : `${currentPath}/${part}`;
        }
        
        return true;
    }

    handleTouch(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'touch: missing file operand' };
        }

        for (const filename of parts.slice(1)) {
            const filePath = this.makeAbsolute(filename);
            const normalizedPath = this.normalizePath(filePath);
            
            const existing = this.getFileAtPath(normalizedPath);
            if (!existing) {
                // Create new file
                const pathParts = normalizedPath.split('/').filter(Boolean);
                const parentPath = '/' + pathParts.slice(0, -1).join('/');
                const fileName = pathParts[pathParts.length - 1];
                
                const parentDir = this.getDirObject(parentPath);
                if (parentDir) {
                    parentDir.content[fileName] = {
                        type: 'file',
                        name: fileName,
                        content: ''
                    };
                }
            }
            // If file exists, touch just updates timestamp (simulated by doing nothing)
        }

        return { success: true, output: '' };
    }

    handleCp(parts) {
        if (parts.length < 3) {
            return { success: false, output: 'cp: missing file operand' };
        }

        const recursive = parts.includes('-r') || parts.includes('-R');
        const sources = [];
        let destination = '';
        
        // Parse arguments
        for (let i = 1; i < parts.length; i++) {
            if (parts[i] === '-r' || parts[i] === '-R') continue;
            if (i === parts.length - 1) {
                destination = parts[i];
            } else {
                sources.push(parts[i]);
            }
        }

        const destPath = this.makeAbsolute(destination);
        const destDir = this.getDirObject(destPath);
        const destExists = !!destDir;

        for (const source of sources) {
            const srcPath = this.makeAbsolute(source);
            const srcItem = this.getFileAtPath(srcPath);
            
            if (!srcItem) {
                return { success: false, output: `cp: cannot stat '${source}': No such file or directory` };
            }

            if (srcItem.type === 'dir' && !recursive) {
                return { success: false, output: `cp: -r not specified; omitting directory '${source}'` };
            }

            if (destExists && destDir.type === 'dir') {
                // Copy into directory
                const itemName = srcPath.split('/').filter(Boolean).pop();
                this.copyItem(srcItem, destPath, itemName);
            } else {
                // Copy to destination (rename)
                const itemName = destPath.split('/').filter(Boolean).pop();
                const parentPath = '/' + destPath.split('/').filter(Boolean).slice(0, -1).join('/');
                this.copyItem(srcItem, parentPath, itemName);
            }
        }

        return { success: true, output: '' };
    }

    copyItem(item, destPath, newName) {
        const destDir = this.getDirObject(destPath);
        if (!destDir) return false;

        const newItem = JSON.parse(JSON.stringify(item)); // Deep copy
        newItem.name = newName;
        destDir.content[newName] = newItem;
        return true;
    }

    handleMv(parts) {
        if (parts.length < 3) {
            return { success: false, output: 'mv: missing file operand' };
        }

        const sources = parts.slice(1, -1);
        const destination = parts[parts.length - 1];

        const destPath = this.makeAbsolute(destination);
        const destDir = this.getDirObject(destPath);
        const destExists = !!destDir;

        if (sources.length > 1 && !destExists) {
            return { success: false, output: `mv: target '${destination}' is not a directory` };
        }

        for (const source of sources) {
            const srcPath = this.makeAbsolute(source);
            const srcItem = this.getFileAtPath(srcPath);
            
            if (!srcItem) {
                return { success: false, output: `mv: cannot stat '${source}': No such file or directory` };
            }

            // Remove from source
            const srcPathParts = srcPath.split('/').filter(Boolean);
            const srcParentPath = '/' + srcPathParts.slice(0, -1).join('/');
            const srcName = srcPathParts[srcPathParts.length - 1];
            
            const srcParentDir = this.getDirObject(srcParentPath);
            if (srcParentDir && srcParentDir.content[srcName]) {
                delete srcParentDir.content[srcName];
            }

            // Add to destination
            if (destExists && destDir.type === 'dir') {
                // Move into directory
                const itemName = srcName;
                destDir.content[itemName] = srcItem;
            } else {
                // Move to destination (rename)
                const itemName = destPath.split('/').filter(Boolean).pop();
                const parentPath = '/' + destPath.split('/').filter(Boolean).slice(0, -1).join('/');
                const newParentDir = this.getDirObject(parentPath);
                if (newParentDir) {
                    newParentDir.content[itemName] = srcItem;
                }
            }
        }

        return { success: true, output: '' };
    }

    handleEditor(parts) {
        const editor = parts[0];
        if (parts.length < 2) {
            return { success: false, output: `${editor}: missing file operand` };
        }

        const filename = parts[1];
        const filePath = this.makeAbsolute(filename);
        const file = this.getFileAtPath(filePath);

        if (!file) {
            return { success: false, output: `${editor}: ${filename}: No such file or directory` };
        }

        // Simulate editor opening
        return { success: true, output: `${editor}: opened ${filename} for editing\n(Editing simulated - file unchanged)` };
    }

    handleLess(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'less: missing file operand' };
        }

        const filename = parts[1];
        const filePath = this.makeAbsolute(filename);
        const file = this.getFileAtPath(filePath);

        if (!file) {
            return { success: false, output: `less: ${filename}: No such file or directory` };
        }

        if (file.type === 'dir') {
            return { success: false, output: `less: ${filename}: Is a directory` };
        }

        const content = file.content || '';
        if (!content) {
            return { success: true, output: `${filename} (empty file)` };
        }

        // Simulate less viewer with first few lines
        const lines = content.split('\n');
        const preview = lines.slice(0, 20).join('\n');
        const more = lines.length > 20 ? `\n... (lines ${lines.length - 20} more, press 'q' to quit)` : '';

        return { 
            success: true, 
            output: `=== ${filename} ===\n${preview}${more}\n\n(less viewer simulated - showing first 20 lines)` 
        };
    }

    handleChmod(parts) {
        if (parts.length < 3) {
            return { success: false, output: 'chmod: missing operand' };
        }

        return { success: true, output: '' };
    }

    handlePs(parts) {
        const showAll = parts.includes('aux') || parts.includes('-aux');
        if (showAll) {
            return { 
                success: true, 
                output: `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
developer    1234  0.0  0.1   1234   567 pts/0    S+   10:30   0:00 -bash
developer    5678  0.0  0.2   2345   678 pts/0    S+   10:31   0:00 python3 main.py
developer    9012  0.0  0.1   3456   789 pts/0    R+   10:32   0:00 ps aux`
            };
        }
        return { success: true, output: '  PID TTY          TIME CMD\n 1234 pts/0    00:00:00 bash\n 5678 pts/0    00:00:00 python3' };
    }

    handleKill(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'kill: usage: kill [-s signal_spec] pid ...' };
        }

        const pid = parts[1];
        return { success: true, output: '' };
    }

    handleTop() {
        return { 
            success: true, 
            output: `top - 10:32:15 up 2 days,  3:45,  2 users,  load average: 0.00, 0.01, 0.05
Tasks: 123 total,   1 running, 122 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.1 sy,  0.0 ni, 99.9 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   8192.0 total,   2048.0 free,   3072.0 used,   3072.0 buff/cache
MiB Swap:   4096.0 total,   4096.0 free,     0.0 used.   5120.0 avail Mem 

    PID USER      PR  NI VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1234 developer  20   0  1234    567    456 S   0.0   0.1   0:00.05 bash
   5678 developer  20   0  2345    678    567 S   0.0   0.1   0:00.10 python3`
        };
    }

    handleDf(parts) {
        const humanReadable = parts.includes('-h');
        if (humanReadable) {
            return { 
                success: true, 
                output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   15G   33G  32% /
tmpfs           2.0G     0  2.0G   0% /dev/shm
/dev/sdb1       100G   45G   50G  48% /home`
            };
        }
        return { success: true, output: 'Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1        52428800 15728640 36700160  32% /' };
    }

    handleDu(parts) {
        const humanReadable = parts.includes('-h');
        const summary = parts.includes('-s');
        
        if (summary && humanReadable) {
            return { 
                success: true, 
                output: `15M     ./tests
2.0K    ./config.py
4.0K    ./utils.py
1.2K    ./main.py
256B    ./requirements.txt
18M     .`
            };
        }
        return { success: true, output: '16K\t./\n8K\t./tests\n4K\t./main.py' };
    }

    handleTar(parts) {
        return { success: true, output: 'tar: would create/extract archive' };
    }

    handleWget(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'wget: missing URL' };
        }

        const url = parts[1];
        return { success: true, output: `--2026-01-25 10:32:15--  ${url}\nResolving ${new URL(url).hostname}... 127.0.0.1\nConnecting to ${new URL(url).hostname}|127.0.0.1|:80... connected.\nHTTP request sent, awaiting response... 200 OK\nLength: unspecified [text/html]\nSaving to: 'index.html'\n\n     0K .......... .......... .......... .......... .......... 100%  1.23M=0s\n\n2026-01-25 10:32:15 (1.23 MB/s) - 'index.html' saved [1234]` };
    }

    handleClear() {
        const terminal = document.getElementById('terminal-output');
        if (terminal) {
            terminal.innerHTML = '';
        }
        return { success: true, output: '' };
    }

    handleEcho(parts) {
        const text = parts.slice(1).join(' ');
        return { success: true, output: text };
    }

    handleMan(parts) {
        if (parts.length < 2) {
            return { success: false, output: 'What manual page do you want?' };
        }

        const command = parts[1];
        return { 
            success: true, 
            output: `${command}(1)                            User Commands                           ${command}(1)

NAME
       ${command} - ${this.getCommandDescription(command)}

SYNOPSIS
       ${command} [OPTIONS]...

DESCRIPTION
       This is a simulated manual page for the ${command} command.

SEE ALSO
       help(1), man(7)

Linux                             2026-01-25                            ${command}(1)`
        };
    }

    handleHelp() {
        return { 
            success: true, 
            output: `Available commands:
  File Operations:
    ls, cd, pwd, cat, grep, find, rm, cp, mv, mkdir, touch
    nano, vim, vi, chmod

  System Information:
    ps, kill, top, df, du, date, whoami, hostname

  Network:
    wget, curl

  Utilities:
    echo, clear, man, help

  Git Commands (integrated with visualization):
    git init, add, commit, branch, switch, merge, status, log
    git push, pull, restore, reset, remote, clone, fetch, stash, tag

  Terminal Shortcuts:
    Ctrl+Shift+C    Copy selected text
    Ctrl+Shift+V    Paste from clipboard
    Ctrl+C          Interrupt current command
    Arrow Up/Down    Navigate command history
    Tab             Autocomplete command

Type 'man <command>' for more information on any command.`
        };
    }

    getCommandDescription(command) {
        const descriptions = {
            ls: 'list directory contents',
            cd: 'change directory',
            pwd: 'print working directory',
            cat: 'concatenate files and print on the standard output',
            grep: 'print lines that match patterns',
            find: 'search for files in a directory hierarchy',
            rm: 'remove files or directories',
            cp: 'copy files and directories',
            mv: 'move (rename) files',
            mkdir: 'make directories',
            touch: 'change file timestamps',
            nano: 'Nano\'s ANOther editor, an enhanced free Pico clone',
            vim: 'Vi IMproved, a programmer\'s text editor',
            chmod: 'change file mode bits',
            ps: 'report a snapshot of the current processes',
            kill: 'send a signal to a process',
            top: 'display Linux processes',
            df: 'report file system disk space usage',
            du: 'estimate file space usage',
            wget: 'non-interactive network downloader',
            curl: 'transfer a URL',
            echo: 'display a line of text',
            clear: 'clear the terminal screen',
            man: 'an interface to the system reference manuals'
        };
        return descriptions[command] || 'perform operations';
    }

    resolvePath(filename) {
        return this.makeAbsolute(filename);
    }

    getFileAtPath(path) {
        const absPath = this.makeAbsolute(path);
        const cleanPath = this.normalizePath(absPath);
        
        let current = this.fileSystem['/'];
        if (cleanPath === '/' || cleanPath === '') return current;

        const segments = cleanPath.slice(1).split('/').filter(Boolean);

        for (const seg of segments) {
            if (!current?.content?.[seg]) return null;
            current = current.content[seg];
        }
        return current;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0';
        const k = 1024;
        const sizes = ['B', 'K', 'M', 'G'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
    }
}