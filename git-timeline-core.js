// git-timeline-core.js
class GitTimelineCore {
    constructor(projectName = 'project_👍') {
        this.projectName = projectName;
        this.currentState = {
            isInitialized: false,
            currentBranch: 'main',
            detachedHEAD: null,                    // commit hash when in detached state
            branches: new Map([['main', null]]),   // branchName → head commit hash
            branchStates: new Map(),               // branchName → {workingDirectory, stagingArea}
            commits: new Map(),                    // hash → full commit object
            reflog: [],                            // [{hash?, action, timestamp, oldHead?, message}]
            remotes: {},
            tags: [],
            mergeInProgress: false,
            rebaseInProgress: false,
            // Directory storage areas
            localDirectory: [],                    // Working directory files
            stageDirectory: [],                    // Staged files
            commitDirectory: [],                   // Committed files
            remoteDirectory: [],                   // Remote repository files
            // Configuration
            userConfig: {
                name: 'Developer',
                email: 'dev@project.local'
            },
            // Timeline nodes and edges
            timelineNodes: new Map(),              // nodeId → node object
            timelineEdges: [],                     // edge objects
            headPointer: null,                     // Current HEAD pointer
            previousBranch: null                   // For git switch -
        };
        this.commitCounter = 0;
        this.commandHistory = [];
        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;
    }

    executeCommand(command) {
        this.commandHistory.push({ command, timestamp: new Date() });
        const parts = command.trim().split(/\s+/);
        if (parts[0] !== 'git') {
            return { success: false, output: "Command must start with 'git'" };
        }
        const gitCmd = parts[1];
        const args = parts.slice(2);

        const handlers = {
            init:    () => this.handleInit(args),
            add:     () => this.handleAdd(args),
            commit:  () => this.handleCommit(args),
            branch:  () => this.handleBranch(args),
            switch:  () => this.handleSwitch(args),
            checkout:() => this.handleSwitch(args),
            merge:   () => this.handleMerge(args),
            status:  () => this.handleStatus(args),
            log:     () => this.handleLog(args),
            reflog:  () => this.handleReflog(),
            reset:   () => this.handleReset(args),
            rebase:  () => this.handleRebase(args),
            remote:  () => this.handleRemote(args),
            push:    () => this.handlePush(args),
            pull:    () => this.handlePull(args),
            clone:   () => this.handleClone(args),
            config:  () => this.handleConfig(args)
        };

        const handler = handlers[gitCmd];
        if (!handler) {
            return { success: false, output: `git: '${gitCmd}' is not a git command.` };
        }

        return handler();
    }

    handleInit(args) {
        // Handle git init . (current directory)
        if (args.length > 0 && args[0] === '.') {
            if (this.currentState.isInitialized) {
                return { 
                    success: false, 
                    output: 'Reinitialized existing Git repository' 
                };
            }
        }
        // Handle git init my-project (invalid for now)
        else if (args.length > 0 && args[0] !== '.') {
            return { 
                success: false, 
                output: 'git init with project name is not supported yet. Use "git init ." instead.' 
            };
        }

        if (this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'Reinitialized existing Git repository' 
            };
        }

        this.currentState.isInitialized = true;
        this.currentState.currentBranch = 'main';
        this.currentState.branches.set('main', null);
        
        // Initialize local directory with some default files
        this.currentState.localDirectory = [
            { name: 'main.py', type: 'python', staged: false, committed: false, content: '# Python main file\nprint("Hello World")' },
            { name: 'utils.py', type: 'python', staged: false, committed: false, content: '# Utility functions\ndef helper():\n    pass' },
            { name: 'requirements.txt', type: 'requirements', staged: false, committed: false, content: 'requests>=2.25.1\nflask>=2.0.0' },
            { name: 'config.py', type: 'config', staged: false, committed: false, content: 'DEBUG = True\nPORT = 5000' },
            { name: 'README.md', type: 'markdown', staged: false, committed: false, content: '# Project_👍\n\nA Python project with Git visualization.' },
            { name: 'tests', type: 'dir', staged: false, committed: false, content: [] }
        ];
        
        this.currentState.branchStates.set('main', {
            workingDirectory: [...this.currentState.localDirectory],
            stagingArea: []
        });

        // Create initial timeline node for git init
        const initNodeId = this.createTimelineNode('git init', 'Repository initialized', 'init');
        this.currentState.headPointer = initNodeId;

        this.currentState.reflog.push({
            action: 'init',
            timestamp: new Date(),
            message: 'repository initialized',
            nodeId: initNodeId
        });

        return { 
            success: true, 
            output: `Initialized empty Git repository in ${this.projectName}/.git/`,
            stateChange: true,
            timelineNode: { id: initNodeId, type: 'init', command: 'git init' }
        };
    }

    handleAdd(args) {
        if (!this.currentState.isInitialized) return { success: false, output: "fatal: not a git repository" };

        const state = this.getCurrentBranchState();
        const added = [];

        args.forEach(arg => {
            if (arg === '.') {
                // git add . - copies all local directory files into stage directory
                state.workingDirectory.forEach(file => {
                    if (!file.staged && !state.stagingArea.includes(file.name)) {
                        file.staged = true;
                        state.stagingArea.push(file.name);
                        
                        // Copy to stage directory
                        const stagedFile = { ...file };
                        this.currentState.stageDirectory.push(stagedFile);
                        
                        added.push(file.name);
                    }
                });
            } else if (arg.includes('*')) {
                // Handle patterns like *.py
                const pattern = arg.replace('*', '.*');
                const regex = new RegExp(`^${pattern}$`);
                
                state.workingDirectory.forEach(file => {
                    if (regex.test(file.name) && !file.staged && !state.stagingArea.includes(file.name)) {
                        file.staged = true;
                        state.stagingArea.push(file.name);
                        
                        // Copy to stage directory
                        const stagedFile = { ...file };
                        this.currentState.stageDirectory.push(stagedFile);
                        
                        added.push(file.name);
                    }
                });
            } else {
                // git add <filename> - copies specific file to stage directory
                const file = state.workingDirectory.find(f => f.name === arg);
                if (file && !file.staged) {
                    file.staged = true;
                    state.stagingArea.push(arg);
                    
                    // Copy to stage directory
                    const stagedFile = { ...file };
                    this.currentState.stageDirectory.push(stagedFile);
                    
                    added.push(file.name);
                }
            }
        });

        // Create timeline node for git add if files were added
        let timelineNode = null;
        if (added.length > 0) {
            const nodeId = this.createTimelineNode(`git add ${args.join(' ')}`, `Staged ${added.length} file(s)`, 'add');
            
            // Create edge from previous head to this node
            if (this.currentState.headPointer) {
                this.createTimelineEdge(this.currentState.headPointer, nodeId, `git add ${args.join(' ')}`, 'add');
            }
            
            this.currentState.headPointer = nodeId;
            timelineNode = { id: nodeId, type: 'add', command: `git add ${args.join(' ')}` };
        }

        return {
            success: added.length > 0,
            output: added.length ? `Added ${added.length} file(s) to staging area: ${added.join(', ')}` : "nothing added",
            stateChange: added.length > 0,
            timelineNode
        };
    }

    handleCommit(args) {
        if (!this.currentState.isInitialized) return { success: false, output: "fatal: not a git repository" };

        const state = this.getCurrentBranchState();
        
        // Check if there are staged files
        const stagedFiles = state.stagingArea || [];
        if (stagedFiles.length === 0) {
            return { success: false, output: "nothing to commit, working tree clean\nnothing added to commit" };
        }

        // Check for -m flag
        let message = "no message";
        if (args.includes('-m')) {
            const messageIndex = args.indexOf('-m');
            if (messageIndex + 1 < args.length) {
                message = args[messageIndex + 1];
            }
        } else {
            return { success: false, output: "fatal: commit message required. Use 'git commit -m \"message\"'" };
        }

        // Create commit snapshot from staged files
        const stagedFileObjects = state.workingDirectory.filter(file => stagedFiles.includes(file.name));
        const snapshot = stagedFileObjects.map(file => ({
            ...file,
            staged: false,
            committed: true
        }));

        const hash = this.generateCommitHash();
        const currentHead = this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
        const parents = currentHead ? [currentHead] : [];

        const commit = {
            hash,
            message,
            parents,
            files: snapshot.map(f => f.name),
            timestamp: new Date(),
            author: this.currentState.userConfig,
            filesChanged: stagedFiles.length
        };

        this.currentState.commits.set(hash, commit);

        // Move files from staging to committed state
        this.currentState.commitDirectory.push(...stagedFileObjects);
        state.stagingArea = [];

        // Update working directory state
        state.workingDirectory.forEach(file => {
            if (stagedFiles.includes(file.name)) {
                file.staged = false;
                file.committed = true;
            }
        });

        // Update branch head
        if (!this.currentState.detachedHEAD) {
            this.currentState.branches.set(this.currentState.currentBranch, hash);
        }

        // Create timeline node for commit
        const nodeId = this.createTimelineNode(`git commit -m "${message}"`, message, 'commit', hash);
        
        // Create edge from previous head to this commit
        if (this.currentState.headPointer) {
            this.createTimelineEdge(this.currentState.headPointer, nodeId, `git commit -m "${message}"`, 'commit');
        }
        
        this.currentState.headPointer = nodeId;

        this.currentState.reflog.push({
            hash,
            action: 'commit',
            timestamp: new Date(),
            oldHead: currentHead,
            message,
        });

        return {
            success: true,
            output: `[${this.currentState.currentBranch} ${hash.slice(0,7)}] ${message}`,
            stateChange: true,
            commit,
            timelineNode: { id: nodeId, type: 'commit', command: `git commit -m "${message}"`, hash }
        };
    }

    handleBranch(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        if (args.length === 0) {
            // git branch - show all branches in terminal
            const branches = Array.from(this.currentState.branches.keys());
            const current = this.currentState.currentBranch;
            const output = branches.map(branch => 
                (branch === current ? '* ' : '  ') + branch
            ).join('\n');
            return { success: true, output };
        }

        const firstArg = args[0];
        
        if (firstArg === '-a') {
            // git branch -a - invalid for now
            return { success: false, output: 'git branch -a is not supported yet' };
        }
        
        if (firstArg === '-d') {
            // git branch -d <old-branch>
            if (args.length < 2) {
                return { success: false, output: 'fatal: branch name required' };
            }
            
            const branchToDelete = args[1];
            
            // Check if trying to delete current branch
            if (branchToDelete === this.currentState.currentBranch) {
                return { success: false, output: `fatal: Cannot delete branch '${branchToDelete}' while checked out` };
            }
            
            // Check if branch exists
            if (!this.currentState.branches.has(branchToDelete)) {
                return { success: false, output: `fatal: branch '${branchToDelete}' not found` };
            }
            
            // Delete branch and its timeline nodes
            const branchHead = this.currentState.branches.get(branchToDelete);
            
            // Remove timeline nodes for this branch
            const nodesToRemove = [];
            this.currentState.timelineNodes.forEach((node, nodeId) => {
                if (node.branch === branchToDelete) {
                    nodesToRemove.push(nodeId);
                }
            });
            
            nodesToRemove.forEach(nodeId => {
                this.currentState.timelineNodes.delete(nodeId);
                // Remove edges connected to this node
                this.currentState.timelineEdges = this.currentState.timelineEdges.filter(
                    edge => edge.from !== nodeId && edge.to !== nodeId
                );
            });
            
            this.currentState.branches.delete(branchToDelete);
            
            return { 
                success: true, 
                output: `Deleted branch '${branchToDelete}'`,
                stateChange: true
            };
        }
        
        if (firstArg === '-m') {
            // git branch -m old new
            if (args.length < 3) {
                return { success: false, output: 'fatal: old and new branch names required' };
            }
            
            const oldName = args[1];
            const newName = args[2];
            
            // Check if old branch exists
            if (!this.currentState.branches.has(oldName)) {
                return { success: false, output: `fatal: branch '${oldName}' not found` };
            }
            
            // Check if new name already exists
            if (this.currentState.branches.has(newName)) {
                return { success: false, output: `fatal: a branch named '${newName}' already exists` };
            }
            
            // Rename branch
            const branchHead = this.currentState.branches.get(oldName);
            this.currentState.branches.delete(oldName);
            this.currentState.branches.set(newName, branchHead);
            
            // Update current branch if it was renamed
            if (this.currentState.currentBranch === oldName) {
                this.currentState.currentBranch = newName;
            }
            
            // Update timeline nodes
            this.currentState.timelineNodes.forEach((node) => {
                if (node.branch === oldName) {
                    node.branch = newName;
                }
            });
            
            return { 
                success: true, 
                output: `Renamed branch '${oldName}' to '${newName}'`,
                stateChange: true
            };
        }
        
        // git branch <branch_name> - create new branch
        const branchName = firstArg;
        
        // Check if branch already exists
        if (this.currentState.branches.has(branchName)) {
            return { success: false, output: `fatal: a branch named '${branchName}' already exists` };
        }
        
        // Get current head commit for new branch
        const currentHead = this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
        
        // Create new branch at current head
        this.currentState.branches.set(branchName, currentHead);
        
        // Create timeline node for new branch (parallel to current head)
        const nodeId = this.createTimelineNode(
            `git branch ${branchName}`, 
            `Created branch '${branchName}'`, 
            'branch',
            null,
            branchName
        );
        
        // Create edge from current head to new branch node
        if (this.currentState.headPointer) {
            this.createTimelineEdge(this.currentState.headPointer, nodeId, `git branch ${branchName}`, 'branch');
        }
        
        return { 
            success: true, 
            output: `Created branch '${branchName}'`,
            stateChange: true,
            timelineNode: { id: nodeId, type: 'branch', command: `git branch ${branchName}`, branchName }
        };
    }

    handleSwitch(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        if (args.length === 0) {
            return { 
                success: false, 
                output: 'Missing branch name' 
            };
        }

        const targetBranch = args[0];
        
        if (targetBranch === '-') {
            // git switch - - reverts HEAD to previous branch
            if (!this.currentState.previousBranch) {
                return { success: false, output: 'fatal: no previous branch to switch to' };
            }
            
            const currentBranch = this.currentState.currentBranch;
            this.currentState.currentBranch = this.currentState.previousBranch;
            this.currentState.previousBranch = currentBranch;
            
            // Update HEAD pointer to last commit of the switched branch
            const branchHead = this.currentState.branches.get(this.currentState.currentBranch);
            if (branchHead) {
                // Find the timeline node for this commit
                const commitNode = this.findTimelineNodeByCommit(branchHead);
                if (commitNode) {
                    this.currentState.headPointer = commitNode;
                }
            }
            
            return { 
                success: true, 
                output: `Switched to branch '${this.currentState.currentBranch}'`,
                stateChange: true,
                branchSwitch: { from: currentBranch, to: this.currentState.currentBranch }
            };
        }
        
        if (targetBranch === '-c') {
            // git switch -c <new_branchname>
            if (args.length < 2) {
                return { success: false, output: 'fatal: branch name required' };
            }
            
            const newBranchName = args[1];
            
            // Check if branch already exists
            if (this.currentState.branches.has(newBranchName)) {
                return { success: false, output: `fatal: a branch named '${newBranchName}' already exists` };
            }
            
            // Create new branch at current head
            const currentHead = this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
            this.currentState.branches.set(newBranchName, currentHead);
            
            // Switch to new branch
            const previousBranch = this.currentState.currentBranch;
            this.currentState.previousBranch = previousBranch;
            this.currentState.currentBranch = newBranchName;
            
            // Create timeline node for new branch
            const nodeId = this.createTimelineNode(
                `git switch -c ${newBranchName}`, 
                `Created and switched to '${newBranchName}'`, 
                'switch',
                null,
                newBranchName
            );
            
            // Create edge from current head to new branch node
            if (this.currentState.headPointer) {
                this.createTimelineEdge(this.currentState.headPointer, nodeId, `git switch -c ${newBranchName}`, 'switch');
            }
            
            this.currentState.headPointer = nodeId;
            
            return { 
                success: true, 
                output: `Switched to a new branch '${newBranchName}'`,
                stateChange: true,
                branchSwitch: { from: previousBranch, to: newBranchName },
                timelineNode: { id: nodeId, type: 'switch', command: `git switch -c ${newBranchName}`, branchName: newBranchName }
            };
        }

        // git switch <branch_name>
        if (!this.currentState.branches.has(targetBranch)) {
            return { 
                success: false, 
                output: `fatal: pathspec '${targetBranch}' did not match any file(s) known to git` 
            };
        }

        const previousBranch = this.currentState.currentBranch;
        this.currentState.previousBranch = previousBranch;
        this.currentState.currentBranch = targetBranch;

        // Update HEAD pointer to last commit of the switched branch
        const branchHead = this.currentState.branches.get(targetBranch);
        if (branchHead) {
            // Find the timeline node for this commit
            const commitNode = this.findTimelineNodeByCommit(branchHead);
            if (commitNode) {
                this.currentState.headPointer = commitNode;
            }
        }

        return { 
            success: true, 
            output: `Switched to branch '${targetBranch}'`,
            stateChange: true,
            branchSwitch: { from: previousBranch, to: targetBranch }
        };
    }

    handleMerge(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        if (args.length === 0) {
            return { 
                success: false, 
                output: 'Specify a branch to merge' 
            };
        }

        const branchToMerge = args[0];
        if (!this.currentState.branches[branchToMerge]) {
            return { 
                success: false, 
                output: `branch '${branchToMerge}' not found` 
            };
        }

        // Create merge commit
        this.commitCounter++;
        const commitHash = this.generateCommitHash();
        const mergeCommit = {
            hash: commitHash,
            message: `Merge branch '${branchToMerge}' into ${this.currentState.currentBranch}`,
            files: ['merged changes'],
            timestamp: new Date(),
            branch: this.currentState.currentBranch,
            isMerge: true,
            mergedFrom: branchToMerge
        };

        this.currentState.commits.push(mergeCommit);
        
        const currentBranch = this.currentState.branches[this.currentState.currentBranch];
        if (currentBranch) {
            currentBranch.commits.push(commitHash);
            currentBranch.head = commitHash;
        }

        return { 
            success: true, 
            output: `Merge made by recursive strategy.\nCreated merge commit ${commitHash.substring(0, 7)}`,
            stateChange: true,
            commit: mergeCommit
        };
    }

    handleStatus(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        const stagedCount = this.currentState.stagingArea.length;
        const modifiedCount = this.currentState.workingDirectory.filter(f => !f.committed).length;
        const untrackedCount = this.currentState.workingDirectory.filter(f => !f.staged && !f.committed).length;

        let output = `On branch ${this.currentState.currentBranch}\n`;
        
        if (this.currentState.commits.length === 0) {
            output += 'No commits yet\n';
        }
        
        if (stagedCount > 0) {
            output += 'Changes to be committed:\n';
            output += '  (use "git restore --staged <file>..." to unstage)\n';
            this.currentState.stagingArea.forEach(file => {
                output += `\tnew file:   ${file}\n`;
            });
        }
        
        if (modifiedCount > 0) {
            output += 'Changes not staged for commit:\n';
            output += '  (use "git add <file>..." to update what will be committed)\n';
        }
        
        if (untrackedCount > 0) {
            output += 'Untracked files:\n';
            output += '  (use "git add <file>..." to include in what will be committed)\n';
            this.currentState.workingDirectory
                .filter(f => !f.staged && !f.committed)
                .forEach(file => {
                    output += `\t${file.name}\n`;
                });
        }
        
        if (stagedCount === 0 && modifiedCount === 0 && untrackedCount === 0) {
            output += 'nothing to commit, working tree clean';
        }

        return { success: true, output };
    }

    handleLog(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        if (this.currentState.commits.length === 0) {
            return { success: true, output: 'No commits yet' };
        }

        let output = '';
        const showOneline = args.includes('--oneline');
        
        this.currentState.commits.slice().reverse().forEach(commit => {
            if (showOneline) {
                output += `${commit.hash.substring(0, 7)} ${commit.message}\n`;
            } else {
                output += `commit ${commit.hash}\n`;
                output += `Author: Developer <dev@project.local>\n`;
                output += `Date:   ${new Date(commit.timestamp).toLocaleString()}\n\n`;
                output += `    ${commit.message}\n\n`;
            }
        });

        return { success: true, output: output.trim() };
    }

    handleRemote(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        if (args.length === 0) {
            return { 
                success: false, 
                output: 'Usage: git remote <command>' 
            };
        }

        const subcommand = args[0];
        
        if (subcommand === 'add') {
            const remoteName = args[1];
            const remoteUrl = args[2];
            if (remoteName && remoteUrl) {
                this.currentState.remotes[remoteName] = remoteUrl;
                return { 
                    success: true, 
                    output: `Added remote '${remoteName}'`,
                    stateChange: true
                };
            } else {
                return { success: false, output: 'Usage: git remote add <name> <url>' };
            }
        } else if (subcommand === 'remove') {
            const remoteName = args[1];
            if (remoteName && this.currentState.remotes[remoteName]) {
                delete this.currentState.remotes[remoteName];
                return { 
                    success: true, 
                    output: `Removed remote '${remoteName}'`,
                    stateChange: true
                };
            } else {
                return { success: false, output: `fatal: No such remote '${remoteName}'` };
            }
        } else if (subcommand === '-v') {
            let output = '';
            Object.entries(this.currentState.remotes).forEach(([name, url]) => {
                output += `${name}\t${url} (fetch)\n`;
                output += `${name}\t${url} (push)\n`;
            });
            return { success: true, output: output || 'No remotes configured' };
        } else if (subcommand === 'set-url') {
            const remoteName = args[1];
            const newUrl = args[2];
            if (remoteName && newUrl) {
                if (this.currentState.remotes[remoteName]) {
                    this.currentState.remotes[remoteName] = newUrl;
                    return { 
                        success: true, 
                        output: `Updated remote '${remoteName}' URL to ${newUrl}`,
                        stateChange: true
                    };
                } else {
                    return { success: false, output: `fatal: No such remote '${remoteName}'` };
                }
            } else {
                return { success: false, output: 'Usage: git remote set-url <name> <new-url>' };
            }
        }

        return { success: false, output: `Unknown remote command: ${subcommand}` };
    }

    handlePush(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        if (Object.keys(this.currentState.remotes).length === 0) {
            return { 
                success: false, 
                output: 'fatal: No configured push destination.' 
            };
        }

        // Check if origin exists and was pulled from before
        const originUrl = this.currentState.remotes.origin;
        if (!originUrl) {
            return { 
                success: false, 
                output: 'fatal: No remote origin configured.' 
            };
        }

        const branch = args.includes('origin') ? args[args.indexOf('origin') + 1] : 'main';
        
        // Copy current commit directory to remote directory
        this.currentState.remoteDirectory = [...this.currentState.commitDirectory];
        
        // Create timeline node for push
        const nodeId = this.createTimelineNode(
            `git push origin ${branch}`, 
            `Pushed to remote ${branch}`, 
            'push'
        );
        
        // Create bold edge from current head to remote node
        if (this.currentState.headPointer) {
            this.createTimelineEdge(this.currentState.headPointer, nodeId, `git push origin ${branch}`, 'push');
        }
        
        this.currentState.headPointer = nodeId;
        
        return { 
            success: true, 
            output: `Enumerating objects: ${this.currentState.commits.size}, done.\n` +
                   `Writing objects: 100% (${this.currentState.commits.size}/${this.currentState.commits.size}), done.\n` +
                   `To ${originUrl}\n` +
                   ` * [new branch]      ${branch} -> ${branch}`,
            stateChange: true,
            timelineNode: { id: nodeId, type: 'push', command: `git push origin ${branch}` }
        };
    }

    handlePull(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        // Check if remote origin URL exists
        const originUrl = this.currentState.remotes.origin;
        if (!originUrl) {
            return { 
                success: false, 
                output: 'fatal: No remote origin URL configured' 
            };
        }

        const branch = args.includes('origin') ? args[args.indexOf('origin') + 1] : 'main';
        
        // Copy files from remote directory to local directory
        if (this.currentState.remoteDirectory.length > 0) {
            this.currentState.localDirectory = [...this.currentState.remoteDirectory];
            
            // Update working directory state
            const state = this.getCurrentBranchState();
            state.workingDirectory = [...this.currentState.remoteDirectory];
        }
        
        // Create timeline node for pull
        const nodeId = this.createTimelineNode(
            `git pull origin ${branch}`, 
            `Pulled from remote ${branch}`, 
            'pull'
        );
        
        // Create bold incoming edge from remote node to current head
        if (this.currentState.headPointer) {
            this.createTimelineEdge(this.currentState.headPointer, nodeId, `git pull origin ${branch}`, 'pull');
        }
        
        this.currentState.headPointer = nodeId;
        
        return { 
            success: true, 
            output: `From ${originUrl}\n * branch            ${branch}     -> FETCH_HEAD\nAlready up to date.`,
            stateChange: true,
            timelineNode: { id: nodeId, type: 'pull', command: `git pull origin ${branch}` }
        };
    }

    handleClone(args) {
        if (this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: destination path already exists and is not an empty directory.' 
            };
        }

        if (args.length === 0) {
            return { 
                success: false, 
                output: 'fatal: repository URL required' 
            };
        }

        const repoUrl = args[0];
        
        // Initialize repository
        this.currentState.isInitialized = true;
        this.currentState.currentBranch = 'main';
        this.currentState.branches.set('main', null);
        
        // Add remote origin
        this.currentState.remotes.origin = repoUrl;
        
        // Create initial commit directory (simulating cloned files)
        this.currentState.remoteDirectory = [
            { name: 'README.md', type: 'markdown', staged: false, committed: true, content: '# Cloned Repository\n\nThis repository was cloned.' },
            { name: 'main.py', type: 'python', staged: false, committed: true, content: '# Main file from cloned repo\nprint("Hello from cloned repo")' },
            { name: 'config.json', type: 'json', staged: false, committed: true, content: '{"name": "cloned-repo", "version": "1.0.0"}' }
        ];
        
        // Copy to local directory
        this.currentState.localDirectory = [...this.currentState.remoteDirectory];
        
        // Initialize branch state
        this.currentState.branchStates.set('main', {
            workingDirectory: [...this.currentState.localDirectory],
            stagingArea: []
        });
        
        // Create initial commit
        const initialCommitHash = this.generateCommitHash();
        const initialCommit = {
            hash: initialCommitHash,
            message: 'Initial commit',
            parents: [],
            timestamp: new Date(),
            branch: 'main',
            isMerge: false,
            snapshot: [...this.currentState.remoteDirectory],
            filesChanged: this.currentState.remoteDirectory.length
        };
        
        this.currentState.commits.set(initialCommitHash, initialCommit);
        this.currentState.branches.set('main', initialCommitHash);
        this.currentState.commitDirectory = [...this.currentState.remoteDirectory];
        
        // Create timeline node for clone
        const nodeId = this.createTimelineNode(
            `git clone ${repoUrl}`, 
            `Cloned repository from ${repoUrl}`, 
            'clone',
            initialCommitHash
        );
        
        this.currentState.headPointer = nodeId;
        
        return { 
            success: true, 
            output: `Cloning into '${this.projectName}'...\n` +
                   'remote: Enumerating objects: 3, done.\n' +
                   'remote: Counting objects: 100% (3/3), done.\n' +
                   'remote: Total 3 (delta 0), reused 0 (delta 0), pack-reused 0\n' +
                   'Unpacking objects: 100% (3/3), done.',
            stateChange: true,
            timelineNode: { id: nodeId, type: 'clone', command: `git clone ${repoUrl}`, hash: initialCommitHash }
        };
    }

    handleConfig(args) {
        // git config --global user.name "Name"
        // git config --global user.email "email"
        
        if (args.includes('--global')) {
            const globalIndex = args.indexOf('--global');
            const configKey = args[globalIndex + 1];
            const configValue = args[globalIndex + 2];
            
            if (configKey === 'user.name') {
                this.currentState.userConfig.name = configValue || 'Developer';
                return { 
                    success: true, 
                    output: `Set user name to ${this.currentState.userConfig.name}`,
                    stateChange: true
                };
            } else if (configKey === 'user.email') {
                this.currentState.userConfig.email = configValue || 'dev@project.local';
                return { 
                    success: true, 
                    output: `Set user email to ${this.currentState.userConfig.email}`,
                    stateChange: true
                };
            }
        }
        
        return { 
            success: false, 
            output: 'Usage: git config --global user.name "<name>" or git config --global user.email "<email>"' 
        };
    }

    handleReset(args) {
        if (!this.currentState.isInitialized) {
            return { 
                success: false, 
                output: 'fatal: not a git repository' 
            };
        }

        // Handle git reset HEAD~1
        if (args.includes('HEAD~1')) {
            const currentHead = this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
            if (!currentHead) {
                return { success: false, output: 'fatal: no commits to reset' };
            }
            
            const currentCommit = this.currentState.commits.get(currentHead);
            if (!currentCommit || !currentCommit.parents[0]) {
                return { success: false, output: 'fatal: no parent commit to reset to' };
            }
            
            const parentCommit = currentCommit.parents[0];
            
            // Remove last commit from timeline
            const nodeToRemove = this.findTimelineNodeByCommit(currentHead);
            if (nodeToRemove) {
                this.currentState.timelineNodes.delete(nodeToRemove);
                // Remove edges connected to this node
                this.currentState.timelineEdges = this.currentState.timelineEdges.filter(
                    edge => edge.from !== nodeToRemove && edge.to !== nodeToRemove
                );
            }
            
            // Reset branch head to parent
            if (this.currentState.detachedHEAD) {
                this.currentState.detachedHEAD = parentCommit;
            } else {
                this.currentState.branches.set(this.currentState.currentBranch, parentCommit);
            }
            
            // Remove files from commit directory that were in the last commit
            if (currentCommit.snapshot) {
                currentCommit.snapshot.forEach(file => {
                    const index = this.currentState.commitDirectory.findIndex(f => f.name === file.name);
                    if (index !== -1) {
                        this.currentState.commitDirectory.splice(index, 1);
                    }
                });
            }
            
            // Update HEAD pointer
            const parentNode = this.findTimelineNodeByCommit(parentCommit);
            if (parentNode) {
                this.currentState.headPointer = parentNode;
            }
            
            return { 
                success: true, 
                output: 'Reset HEAD~1 completed',
                stateChange: true
            };
        }
        
        // Handle git reset --soft HEAD~1
        if (args.includes('--soft') && args.includes('HEAD~1')) {
            const currentHead = this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
            if (!currentHead) {
                return { success: false, output: 'fatal: no commits to reset' };
            }
            
            const currentCommit = this.currentState.commits.get(currentHead);
            if (!currentCommit || !currentCommit.parents[0]) {
                return { success: false, output: 'fatal: no parent commit to reset to' };
            }
            
            const parentCommit = currentCommit.parents[0];
            
            // Move files from commit directory back to stage directory
            if (currentCommit.snapshot) {
                currentCommit.snapshot.forEach(file => {
                    const stagedFile = { ...file, staged: true };
                    this.currentState.stageDirectory.push(stagedFile);
                    
                    // Remove from commit directory
                    const index = this.currentState.commitDirectory.findIndex(f => f.name === file.name);
                    if (index !== -1) {
                        this.currentState.commitDirectory.splice(index, 1);
                    }
                });
            }
            
            // Reset branch head to parent
            if (this.currentState.detachedHEAD) {
                this.currentState.detachedHEAD = parentCommit;
            } else {
                this.currentState.branches.set(this.currentState.currentBranch, parentCommit);
            }
            
            return { 
                success: true, 
                output: 'Soft reset HEAD~1 completed',
                stateChange: true
            };
        }
        
        return { 
            success: false, 
            output: 'Usage: git reset HEAD~1 or git reset --soft HEAD~1' 
        };
    }

    // Helper methods for timeline management
    createTimelineNode(command, description, type, commitHash = null, branchName = null) {
        const nodeId = `node_${this.nodeIdCounter++}`;
        const node = {
            id: nodeId,
            command,
            description,
            type,
            commitHash,
            branch: branchName || this.currentState.currentBranch,
            timestamp: new Date(),
            x: 0, // Will be calculated by visualizer
            y: 0  // Will be calculated by visualizer
        };
        
        this.currentState.timelineNodes.set(nodeId, node);
        return nodeId;
    }

    createTimelineEdge(fromNodeId, toNodeId, command, type) {
        const edge = {
            id: `edge_${this.edgeIdCounter++}`,
            from: fromNodeId,
            to: toNodeId,
            command,
            type,
            timestamp: new Date()
        };
        
        this.currentState.timelineEdges.push(edge);
        return edge.id;
    }

    findTimelineNodeByCommit(commitHash) {
        for (const [nodeId, node] of this.currentState.timelineNodes) {
            if (node.commitHash === commitHash) {
                return nodeId;
            }
        }
        return null;
    }

    // Helper methods
    getCurrentBranchState() {
        const key = this.currentState.detachedHEAD || this.currentState.currentBranch;
        let s = this.currentState.branchStates.get(key);
        if (!s) {
            s = { workingDirectory: [], stagingArea: [] };
            this.currentState.branchStates.set(key, s);
        }
        return s;
    }

    generateCommitHash() {
        this.commitCounter++;
        return 'commit_' + this.commitCounter.toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    }

    resolveRef(ref) {
        if (ref === 'HEAD') return this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
        if (this.currentState.branches.has(ref)) return this.currentState.branches.get(ref);
        if (this.currentState.commits.has(ref)) return ref;
        return null;
    }

    getAncestorHash(ref) {
        // Simple implementation for HEAD~n
        if (ref.startsWith('HEAD~')) {
            const n = parseInt(ref.slice(5)) || 1;
            let current = this.currentState.detachedHEAD || this.currentState.branches.get(this.currentState.currentBranch);
            for (let i = 0; i < n && current; i++) {
                const commit = this.currentState.commits.get(current);
                if (!commit || !commit.parents[0]) break;
                current = commit.parents[0];
            }
            return current;
        }
        return null;
    }

    getState() {
        return JSON.parse(JSON.stringify(this.currentState)); // for visualization
    }

    reset() {
        this.currentState = {
            isInitialized: false,
            currentBranch: 'master',
            detachedHEAD: null,
            branches: new Map([['master', null]]),
            branchStates: new Map(),
            commits: new Map(),
            reflog: [],
            remotes: {},
            tags: [],
            mergeInProgress: false,
            rebaseInProgress: false
        };
        this.commitCounter = 0;
        this.commandHistory = [];
    }

    // Detached HEAD methods
    setDetachedHEAD(commitHash) {
        this.currentState.detachedHEAD = commitHash;
    }

    getDetachedHEAD() {
        return this.currentState.detachedHEAD;
    }

    isDetachedHEAD() {
        return this.currentState.detachedHEAD !== null;
    }

    clearDetachedHEAD() {
        this.currentState.detachedHEAD = null;
    }
}

// Export
if (typeof window !== 'undefined') window.GitTimelineCore = GitTimelineCore;