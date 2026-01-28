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
