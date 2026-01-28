// Git State Space Tree Simulator for project_👍 (Python-focused)
class GitStateSpaceTree {
    constructor() {
        // Initial state
        this.currentState = {
            id: 'initial',
            name: 'Initial State (No Repository)',
            isInitialized: false,
            hasCommits: false,
            currentBranch: null,
            branches: {},
            head: null,
            stagingArea: [],
            workingDirectory: [
                'main.py',
                'utils.py',
                'requirements.txt',
                'config.py',
                'tests/test_main.py'
            ],
            trackedFiles: [],
            remotes: {},
            tags: [],
            commitHistory: [],
            detachedHEAD: false,
            mergeInProgress: false,
            rebaseInProgress: false,
            conflictFiles: []
        };

        this.stateIdCounter = 0;
        this.stateHistory = [JSON.parse(JSON.stringify(this.currentState))];
        this.transitionHistory = [];
        this.allPossibleStates = new Map();
        this.recordState(this.currentState);
        
        // Track project specifics
        this.projectName = 'project_👍';
        this.currentPath = `/home/user/${this.projectName}`;
        this.username = 'developer';
        this.hostname = 'git-workstation';
        
        // Define all command variations with Python file references
        this.commands = {
            'git init': [
                { cmd: 'git init', description: 'Initialize empty repository' },
                { cmd: 'git init project_👍', description: 'Initialize repo with project name' },
                { cmd: 'git init --bare', description: 'Create bare repository' },
                { cmd: 'git init --initial-branch=main', description: 'Initialize with main as default' },
                { cmd: 'git init .', description: 'Initialize in current directory' }
            ],
            'git add': [
                { cmd: 'git add .', description: 'Stage all Python files' },
                { cmd: 'git add main.py', description: 'Stage main.py file' },
                { cmd: 'git add *.py requirements.txt', description: 'Stage Python files and requirements' },
                { cmd: 'git add -A', description: 'Stage all including Python test files' },
                { cmd: 'git add -p', description: 'Interactive stage for Python files' }
            ],
            'git commit': [
                { cmd: 'git commit -m "feat: add main.py"', description: 'Commit Python file' },
                { cmd: 'git commit', description: 'Open editor for Python changes' },
                { cmd: 'git commit -m "feat:" -m "Added Python utility functions"', description: 'Multiline Python commit' },
                { cmd: 'git commit --amend', description: 'Amend Python commit' },
                { cmd: 'git commit -a -m "Update Python dependencies"', description: 'Stage and commit tracked Python files' }
            ],
            'git status': [
                { cmd: 'git status', description: 'Show Python repo status' },
                { cmd: 'git status -s', description: 'Short status for Python files' },
                { cmd: 'git status -sb', description: 'Short with Python branch info' },
                { cmd: 'git status --ignored', description: 'Show ignored Python files' },
                { cmd: 'git status --porcelain=v2', description: 'Machine-readable Python status' }
            ],
            'git branch': [
                { cmd: 'git branch', description: 'List Python project branches' },
                { cmd: 'git branch -a', description: 'List all Python branches' },
                { cmd: 'git branch feature/python-utils', description: 'Create Python feature branch' },
                { cmd: 'git branch -d old-python-branch', description: 'Delete old Python branch' },
                { cmd: 'git branch -m python-dev', description: 'Rename Python branch' }
            ],
            'git push': [
                { cmd: 'git push', description: 'Push Python code to default remote' },
                { cmd: 'git push origin main', description: 'Push Python main branch' },
                { cmd: 'git push -u origin python-feature', description: 'Push Python feature branch' },
                { cmd: 'git push --force-with-lease', description: 'Safely force push Python code' },
                { cmd: 'git push --tags', description: 'Push Python version tags' }
            ],
            'git pull': [
                { cmd: 'git pull', description: 'Pull Python changes' },
                { cmd: 'git pull origin main', description: 'Pull Python main branch' },
                { cmd: 'git pull --rebase', description: 'Pull and rebase Python changes' },
                { cmd: 'git pull --ff-only', description: 'Fast-forward only Python pull' },
                { cmd: 'git pull --prune', description: 'Pull and prune Python branches' }
            ],
            'git remote': [
                { cmd: 'git remote -v', description: 'List Python repo remotes' },
                { cmd: 'git remote add origin git@github.com:user/project_👍.git', description: 'Add Python project remote' },
                { cmd: 'git remote remove upstream', description: 'Remove Python upstream' },
                { cmd: 'git remote rename python-origin origin', description: 'Rename Python remote' },
                { cmd: 'git remote set-url origin new-url', description: 'Update Python remote URL' }
            ],
            'git merge': [
                { cmd: 'git merge feature/python-utils', description: 'Merge Python feature branch' },
                { cmd: 'git merge --no-ff python-dev', description: 'Merge with no fast-forward' },
                { cmd: 'git merge --ff-only', description: 'Fast-forward only Python merge' },
                { cmd: 'git merge --abort', description: 'Abort Python merge' },
                { cmd: 'git merge origin/python-main', description: 'Merge remote Python branch' }
            ],
            'git switch': [
                { cmd: 'git switch feature/python-auth', description: 'Switch to Python feature branch' },
                { cmd: 'git switch -c new-python-feature', description: 'Create and switch Python branch' },
                { cmd: 'git switch main', description: 'Switch to Python main' },
                { cmd: 'git switch --detach HEAD~2', description: 'Detach to Python commit' },
                { cmd: 'git switch -', description: 'Switch to previous Python branch' }
            ],
            'git remote remove': [
                { cmd: 'git remote remove upstream', description: 'Remove Python upstream' },
                { cmd: 'git remote rm origin', description: 'Remove Python origin' },
                { cmd: 'git remote remove python-backup', description: 'Remove Python backup remote' },
                { cmd: 'git remote rm staging', description: 'Remove Python staging remote' },
                { cmd: 'git remote remove test-origin', description: 'Remove Python test remote' }
            ],
            'git clone': [
                { cmd: 'git clone https://github.com/user/project_👍.git', description: 'Clone Python project' },
                { cmd: 'git clone git@github.com:user/project_👍.git python-project', description: 'Clone to Python folder' },
                { cmd: 'git clone --depth 1 https://github.com/user/python-repo.git', description: 'Shallow clone Python repo' },
                { cmd: 'git clone --single-branch --branch dev https://github.com/user/python-project.git', description: 'Clone Python dev branch' },
                { cmd: 'git clone --bare https://github.com/user/project_👍.git', description: 'Bare clone Python repo' }
            ],
            'git config': [
                { cmd: 'git config --global user.name "Python Developer"', description: 'Set Python dev name' },
                { cmd: 'git config --global user.email "python@example.com"', description: 'Set Python dev email' },
                { cmd: 'git config --global core.editor "vim"', description: 'Set editor for Python work' },
                { cmd: 'git config --list', description: 'List Python Git config' },
                { cmd: 'git config --global alias.st status', description: 'Python Git alias' }
            ],
            'git log': [
                { cmd: 'git log --oneline', description: 'One-line Python commit history' },
                { cmd: 'git log --oneline --graph --all', description: 'Graph of Python branches' },
                { cmd: 'git log -n 5', description: 'Last 5 Python commits' },
                { cmd: 'git log --oneline --decorate --graph --all', description: 'Decorated Python graph' },
                { cmd: 'git log -p main.py', description: 'Patch for Python file' }
            ],
            'git reset': [
                { cmd: 'git reset HEAD~1', description: 'Reset Python commit (mixed)' },
                { cmd: 'git reset --soft HEAD~1', description: 'Soft reset Python commit' },
                { cmd: 'git reset --hard HEAD~1', description: 'Hard reset Python files' },
                { cmd: 'git reset --hard origin/main', description: 'Reset to remote Python state' },
                { cmd: 'git reset main.py', description: 'Reset Python file from staging' }
            ]
        };

        // Command execution logic
        this.commandHandlers = {
            'git init': this.handleGitInit.bind(this),
            'git add': this.handleGitAdd.bind(this),
            'git commit': this.handleGitCommit.bind(this),
            'git status': this.handleGitStatus.bind(this),
            'git branch': this.handleGitBranch.bind(this),
            'git push': this.handleGitPush.bind(this),
            'git pull': this.handleGitPull.bind(this),
            'git remote': this.handleGitRemote.bind(this),
            'git merge': this.handleGitMerge.bind(this),
            'git switch': this.handleGitSwitch.bind(this),
            'git remote remove': this.handleGitRemoteRemove.bind(this),
            'git clone': this.handleGitClone.bind(this),
            'git config': this.handleGitConfig.bind(this),
            'git log': this.handleGitLog.bind(this),
            'git reset': this.handleGitReset.bind(this)
        };
    }

    recordState(state) {
        const stateKey = JSON.stringify(state);
        if (!this.allPossibleStates.has(stateKey)) {
            this.allPossibleStates.set(stateKey, {
                id: `state_${this.stateIdCounter++}`,
                state: JSON.parse(JSON.stringify(state)),
                transitions: []
            });
        }
        return this.allPossibleStates.get(stateKey);
    }

    addTransition(fromState, toState, command, output) {
        const fromKey = JSON.stringify(fromState);
        const toKey = JSON.stringify(toState);
        
        const fromNode = this.allPossibleStates.get(fromKey);
        const toNode = this.allPossibleStates.get(toKey);
        
        if (fromNode && toNode) {
            fromNode.transitions.push({
                to: toNode.id,
                command: command,
                output: output
            });
        }
    }

    generatePrompt() {
        return `${this.username}@${this.hostname}:${this.currentPath}$ `;
    }

    simulateTerminalOutput(message, isError = false) {
        const prefix = isError ? '\x1b[31m✗\x1b[0m ' : '\x1b[32m✓\x1b[0m ';
        return prefix + message;
    }

    // Command Handlers with Python-focused outputs
    handleGitInit(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (fullCommand.includes('--bare')) {
            output.push(this.simulateTerminalOutput(`Initialized empty bare Git repository in ${this.currentPath}/`));
            this.currentState.isInitialized = true;
            this.currentState.isBare = true;
        } else {
            output.push(this.simulateTerminalOutput(`Initialized empty Git repository in ${this.currentPath}/.git/`));
            this.currentState.isInitialized = true;
            this.currentState.currentBranch = 'main';
            this.currentState.branches = { main: null };
            this.currentState.head = 'main';
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        this.transitionHistory.push({ command: fullCommand, from: fromState, to: toState });
        
        return output.join('\n');
    }

    handleGitAdd(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (fullCommand === 'git add .' || fullCommand === 'git add -A') {
            this.currentState.workingDirectory.forEach(file => {
                if (!this.currentState.stagingArea.includes(file)) {
                    this.currentState.stagingArea.push(file);
                }
            });
            output.push(this.simulateTerminalOutput(`Added ${this.currentState.workingDirectory.length} Python files to staging area`));
        } else if (fullCommand.includes('main.py')) {
            this.currentState.stagingArea.push('main.py');
            output.push(this.simulateTerminalOutput("Staged 'main.py' for commit"));
        } else if (fullCommand.includes('*.py')) {
            this.currentState.workingDirectory
                .filter(file => file.endsWith('.py'))
                .forEach(file => {
                    if (!this.currentState.stagingArea.includes(file)) {
                        this.currentState.stagingArea.push(file);
                    }
                });
            output.push(this.simulateTerminalOutput("Staged Python (.py) files"));
        } else if (fullCommand === 'git add -p') {
            output.push(this.simulateTerminalOutput("Interactive staging mode for Python files"));
            output.push("diff --git a/main.py b/main.py");
            output.push("Stage this hunk [y,n,q,a,d,s,e,?]? ");
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        this.transitionHistory.push({ command: fullCommand, from: fromState, to: toState });
        
        return output.join('\n');
    }

    handleGitCommit(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (this.currentState.stagingArea.length === 0) {
            output.push(this.simulateTerminalOutput('nothing to commit, working directory clean'));
            return output.join('\n');
        }
        
        const commitHash = Math.random().toString(36).substring(2, 14);
        const commitMsg = fullCommand.includes('-m') ? 
            fullCommand.match(/-m "([^"]+)"/)?.[1] || 'Python commit' : 
            'Update Python files';
        
        const commit = {
            hash: commitHash,
            message: commitMsg,
            files: [...this.currentState.stagingArea],
            timestamp: new Date().toISOString(),
            branch: this.currentState.currentBranch
        };
        
        this.currentState.commitHistory.push(commit);
        this.currentState.hasCommits = true;
        this.currentState.branches[this.currentState.currentBranch] = commitHash;
        this.currentState.head = commitHash;
        this.currentState.stagingArea = [];
        
        output.push(this.simulateTerminalOutput(`[${this.currentState.currentBranch} ${commitHash.substring(0, 7)}] ${commitMsg}`));
        output.push(`${commit.files.length} Python files changed`);
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        this.transitionHistory.push({ command: fullCommand, from: fromState, to: toState });
        
        return output.join('\n');
    }

    handleGitStatus(fullCommand) {
        const output = [];
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (fullCommand.includes('-s') || fullCommand.includes('--porcelain')) {
            // Short format
            if (this.currentState.stagingArea.length > 0) {
                this.currentState.stagingArea.forEach(file => {
                    output.push(`A  ${file}`);
                });
            }
            if (this.currentState.workingDirectory.length > this.currentState.stagingArea.length) {
                output.push('?? ' + this.currentState.workingDirectory.filter(f => !this.currentState.stagingArea.includes(f)).join(' '));
            }
        } else {
            // Long format
            output.push(`On branch ${this.currentState.currentBranch || 'No branch'}`);
            if (this.currentState.commitHistory.length === 0) {
                output.push('No commits yet');
            }
            if (this.currentState.stagingArea.length > 0) {
                output.push('Changes to be committed:');
                output.push('  (use "git reset HEAD <file>..." to unstage)');
                this.currentState.stagingArea.forEach(file => {
                    output.push(`\tnew file:   ${file}`);
                });
            }
            if (this.currentState.workingDirectory.length > this.currentState.stagingArea.length) {
                output.push('Untracked Python files:');
                output.push('  (use "git add <file>..." to include in what will be committed)');
                this.currentState.workingDirectory
                    .filter(f => !this.currentState.stagingArea.includes(f))
                    .forEach(file => {
                        output.push(`\t${file}`);
                    });
            }
            if (this.currentState.stagingArea.length === 0 && 
                this.currentState.workingDirectory.length === this.currentState.trackedFiles.length) {
                output.push('nothing to commit, working directory clean');
            }
        }
        
        return output.join('\n');
    }

    handleGitBranch(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (fullCommand === 'git branch') {
            Object.keys(this.currentState.branches).forEach(branch => {
                const prefix = branch === this.currentState.currentBranch ? '*' : ' ';
                output.push(`${prefix} ${branch}`);
            });
        } else if (fullCommand.includes('feature/python-utils')) {
            const newBranch = 'feature/python-utils';
            this.currentState.branches[newBranch] = this.currentState.branches[this.currentState.currentBranch];
            output.push(this.simulateTerminalOutput(`Created Python feature branch '${newBranch}'`));
        } else if (fullCommand.includes('-d')) {
            const branch = fullCommand.match(/-d (\S+)/)?.[1];
            if (branch && this.currentState.branches[branch]) {
                delete this.currentState.branches[branch];
                output.push(this.simulateTerminalOutput(`Deleted Python branch '${branch}'`));
            }
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    handleGitPush(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (!this.currentState.remotes.origin) {
            output.push(this.simulateTerminalOutput('fatal: No configured push destination.', true));
            output.push('Either specify the URL or add a remote repository');
            return output.join('\n');
        }
        
        const branch = fullCommand.includes('origin') ? 
            fullCommand.match(/origin (\S+)/)?.[1] || 'main' : 
            this.currentState.currentBranch;
        
        output.push(this.simulateTerminalOutput(`Enumerating objects: ${this.currentState.commitHistory.length}, done.`));
        output.push(`Writing objects: 100% (${this.currentState.commitHistory.length}/${this.currentState.commitHistory.length}), done.`);
        output.push(`Total ${this.currentState.commitHistory.length} (delta 0), reused 0 (delta 0)`);
        output.push(`To ${this.currentState.remotes.origin}`);
        output.push(` * [new branch]      ${branch} -> ${branch}`);
        
        if (fullCommand.includes('-u')) {
            output.push(`Branch '${branch}' set up to track remote branch '${branch}' from 'origin'.`);
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    handleGitPull(fullCommand) {
        const output = [];
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (!this.currentState.remotes.origin) {
            output.push(this.simulateTerminalOutput('fatal: No remote repository specified.', true));
            return output.join('\n');
        }
        
        output.push(this.simulateTerminalOutput('From https://github.com/user/project_👍'));
        output.push(` * branch            main       -> FETCH_HEAD`);
        output.push('Already up to date.');
        
        if (fullCommand.includes('--rebase')) {
            output.push('Successfully rebased and updated Python repository.');
        }
        
        return output.join('\n');
    }

    handleGitRemote(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (fullCommand === 'git remote -v') {
            Object.keys(this.currentState.remotes).forEach(remote => {
                output.push(`${remote}\t${this.currentState.remotes[remote]} (fetch)`);
                output.push(`${remote}\t${this.currentState.remotes[remote]} (push)`);
            });
        } else if (fullCommand.includes('add origin')) {
            const url = fullCommand.match(/add origin (\S+)/)?.[1];
            if (url) {
                this.currentState.remotes.origin = url;
                output.push(this.simulateTerminalOutput(`Added remote 'origin' for Python project`));
            }
        } else if (fullCommand.includes('set-url')) {
            const url = fullCommand.match(/set-url origin (\S+)/)?.[1];
            if (url) {
                this.currentState.remotes.origin = url;
                output.push(this.simulateTerminalOutput('Updated Python remote URL'));
            }
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    handleGitMerge(fullCommand) {
        const output = [];
const fromState = JSON.parse(JSON.stringify(this.currentState));        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (fullCommand.includes('--abort')) {
            output.push(this.simulateTerminalOutput('Aborted Python merge successfully'));
            this.currentState.mergeInProgress = false;
            this.currentState.conflictFiles = [];
        } else {
            const branch = fullCommand.match(/merge (\S+)/)?.[1];
            if (branch) {
                output.push(this.simulateTerminalOutput(`Merging Python branch '${branch}' into '${this.currentState.currentBranch}'`));
                output.push('Auto-merging main.py');
                output.push('Merge made by Python strategy');
                
                const commitHash = Math.random().toString(36).substring(2, 14);
                const commit = {
                    hash: commitHash,
                    message: `Merge branch '${branch}'`,
                    files: ['main.py', 'utils.py'],
                    timestamp: new Date().toISOString(),
                    branch: this.currentState.currentBranch,
                    isMerge: true
                };
                
                this.currentState.commitHistory.push(commit);
                this.currentState.branches[this.currentState.currentBranch] = commitHash;
                this.currentState.head = commitHash;
            }
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    handleGitSwitch(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (fullCommand.includes('-c')) {
            const newBranch = fullCommand.match(/-c (\S+)/)?.[1];
            if (newBranch) {
                this.currentState.branches[newBranch] = this.currentState.branches[this.currentState.currentBranch];
                this.currentState.currentBranch = newBranch;
                output.push(this.simulateTerminalOutput(`Switched to new Python branch '${newBranch}'`));
            }
        } else if (fullCommand.includes('feature/python-auth')) {
            this.currentState.currentBranch = 'feature/python-auth';
            output.push(this.simulateTerminalOutput(`Switched to Python feature branch 'feature/python-auth'`));
        } else if (fullCommand === 'git switch main') {
            this.currentState.currentBranch = 'main';
            output.push(this.simulateTerminalOutput("Switched to Python main branch"));
        } else if (fullCommand === 'git switch -') {
            output.push(this.simulateTerminalOutput("Switched to previous Python branch"));
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    handleGitRemoteRemove(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        const remote = fullCommand.match(/remove (\S+)/)?.[1] || fullCommand.match(/rm (\S+)/)?.[1];
        if (remote && this.currentState.remotes[remote]) {
            delete this.currentState.remotes[remote];
            output.push(this.simulateTerminalOutput(`Removed Python remote '${remote}'`));
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    handleGitClone(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        output.push(this.simulateTerminalOutput('Cloning into project_👍...'));
        output.push('remote: Enumerating objects: 15, done.');
        output.push('remote: Counting objects: 100% (15/15), done.');
        output.push('remote: Compressing objects: 100% (10/10), done.');
        output.push('remote: Total 15 (delta 3), reused 12 (delta 2), pack-reused 0');
        output.push('Receiving objects: 100% (15/15), 25.34 KiB | 2.30 MiB/s, done.');
        output.push('Resolving deltas: 100% (3/3), done.');
        
        // Reset to cloned state
        this.currentState = {
            id: 'cloned',
            name: 'Cloned Repository',
            isInitialized: true,
            hasCommits: true,
            currentBranch: 'main',
            branches: { main: 'abc123', 'feature/python': 'def456' },
            head: 'abc123',
            stagingArea: [],
            workingDirectory: ['main.py', 'utils.py', 'requirements.txt', 'README.md', 'tests/'],
            trackedFiles: ['main.py', 'utils.py', 'requirements.txt', 'README.md'],
            remotes: { origin: 'https://github.com/user/project_👍.git' },
            tags: ['v1.0'],
            commitHistory: [
                { hash: 'abc123', message: 'Initial Python commit', files: ['main.py'], timestamp: '2024-01-01T00:00:00Z', branch: 'main' },
                { hash: 'def456', message: 'Add Python utilities', files: ['utils.py'], timestamp: '2024-01-02T00:00:00Z', branch: 'feature/python' }
            ],
            detachedHEAD: false,
            mergeInProgress: false,
            rebaseInProgress: false,
            conflictFiles: []
        };
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        this.transitionHistory.push({ command: fullCommand, from: fromState, to: toState });
        
        return output.join('\n');
    }

    handleGitConfig(fullCommand) {
        const output = [];
        
        if (fullCommand.includes('user.name')) {
            output.push(this.simulateTerminalOutput('Set Git username for Python projects'));
        } else if (fullCommand.includes('user.email')) {
            output.push(this.simulateTerminalOutput('Set Git email for Python commits'));
        } else if (fullCommand.includes('--list')) {
            output.push('user.name=Python Developer');
            output.push('user.email=python@example.com');
            output.push('core.editor=vim');
            output.push('init.defaultbranch=main');
        }
        
        return output.join('\n');
    }

    handleGitLog(fullCommand) {
        const output = [];
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (this.currentState.commitHistory.length === 0) {
            output.push('No Python commits yet');
            return output.join('\n');
        }
        
        if (fullCommand.includes('--oneline')) {
            this.currentState.commitHistory.slice(-5).reverse().forEach(commit => {
                output.push(`${commit.hash.substring(0, 7)} ${commit.message}`);
            });
        } else if (fullCommand.includes('--graph')) {
            output.push('*   abc1234 Merge Python feature branch');
            output.push('|\\  ');
            output.push('| * def5678 Add Python utility functions');
            output.push('* | ghi9012 Update main.py');
            output.push('|/  ');
            output.push('* jkl3456 Initial Python commit');
        } else if (fullCommand.includes('-p')) {
            output.push('commit abc123456789');
            output.push('Author: Python Developer <python@example.com>');
            output.push('Date:   Mon Jan 1 12:00:00 2024 +0000');
            output.push('');
            output.push('    feat: Add main.py');
            output.push('');
            output.push('diff --git a/main.py b/main.py');
            output.push('new file mode 100644');
            output.push('index 0000000..abc1234');
            output.push('--- /dev/null');
            output.push('+++ b/main.py');
            output.push('@@ -0,0 +1,10 @@');
            output.push('+#!/usr/bin/env python3');
            output.push('+');
            output.push('+def main():');
            output.push('+    print("Hello from Python project_👍")');
        }
        
        return output.join('\n');
    }

    handleGitReset(fullCommand) {
        const output = [];
        const fromState = JSON.parse(JSON.stringify(this.currentState));
        
        if (!this.currentState.isInitialized) {
            output.push(this.simulateTerminalOutput('fatal: not a git repository (or any of the parent directories): .git', true));
            return output.join('\n');
        }
        
        if (this.currentState.commitHistory.length === 0) {
            output.push(this.simulateTerminalOutput('Cannot reset: no commits yet', true));
            return output.join('\n');
        }
        
        if (fullCommand.includes('--hard')) {
            output.push(this.simulateTerminalOutput('HEAD is now at abc1234 Previous Python commit'));
            if (this.currentState.commitHistory.length > 1) {
                this.currentState.commitHistory.pop();
                this.currentState.head = this.currentState.commitHistory[this.currentState.commitHistory.length - 1]?.hash || null;
                this.currentState.branches[this.currentState.currentBranch] = this.currentState.head;
            }
        } else if (fullCommand.includes('--soft')) {
            output.push(this.simulateTerminalOutput('Soft reset Python commit - changes staged but not committed'));
        } else if (fullCommand === 'git reset main.py') {
            this.currentState.stagingArea = this.currentState.stagingArea.filter(f => f !== 'main.py');
            output.push(this.simulateTerminalOutput('Unstaged main.py changes'));
        } else {
            output.push(this.simulateTerminalOutput('Reset Python commit (mixed) - changes unstaged'));
        }
        
        const toState = JSON.parse(JSON.stringify(this.currentState));
        this.recordState(toState);
        this.addTransition(fromState, toState, fullCommand, output.join('\n'));
        this.stateHistory.push(toState);
        
        return output.join('\n');
    }

    executeCommand(fullCommand) {
        console.log('\x1b[36m' + this.generatePrompt() + fullCommand + '\x1b[0m');
        
        // Find which command category this belongs to
        for (const [cmdCategory, variations] of Object.entries(this.commands)) {
            for (const variation of variations) {
                if (variation.cmd === fullCommand) {
                    const handler = this.commandHandlers[cmdCategory];
                    if (handler) {
                        const output = handler(fullCommand);
                        console.log(output);
                        console.log(''); // Empty line for spacing
                        return {
                            success: !output.includes('fatal:'),
                            output: output,
                            newState: JSON.parse(JSON.stringify(this.currentState))
                        };
                    }
                }
            }
        }
        
        // If no exact match found, try partial match
        for (const [cmdCategory, handler] of Object.entries(this.commandHandlers)) {
            if (fullCommand.startsWith(cmdCategory)) {
                const output = handler(fullCommand);
                console.log(output);
                console.log('');
                return {
                    success: !output.includes('fatal:'),
                    output: output,
                    newState: JSON.parse(JSON.stringify(this.currentState))
                };
            }
        }
        
        const errorMsg = this.simulateTerminalOutput(`git: '${fullCommand.split(' ')[1]}' is not a git command. See 'git --help'.`, true);
        console.log(errorMsg);
        console.log('');
        return { success: false, output: errorMsg, newState: this.currentState };
    }

    getStateSpaceTree() {
        const tree = {
            initialState: 'state_0',
            states: {},
            transitions: []
        };
        
        for (const [stateKey, stateData] of this.allPossibleStates.entries()) {
            tree.states[stateData.id] = {
                ...stateData.state,
                transitions: stateData.transitions
            };
        }
        
        return tree;
    }

    visualizeStateSpace() {
        console.log('\n=== GIT STATE SPACE TREE FOR project_👍 ===\n');
        console.log(`Total states discovered: ${this.allPossibleStates.size}`);
        console.log(`Total transitions: ${this.transitionHistory.length}`);
        console.log('\nStates:');
        
        for (const [stateKey, stateData] of this.allPossibleStates.entries()) {
            console.log(`\n${stateData.id}: ${stateData.state.name}`);
            console.log(`  Branch: ${stateData.state.currentBranch || 'None'}`);
            console.log(`  Commits: ${stateData.state.commitHistory.length}`);
            console.log(`  Staged: ${stateData.state.stagingArea.length} Python files`);
            console.log(`  Remotes: ${Object.keys(stateData.state.remotes).length}`);
            
            if (stateData.transitions.length > 0) {
                console.log(`  Transitions to:`);
                stateData.transitions.forEach(t => {
                    console.log(`    → ${t.to} via "${t.command}"`);
                });
            }
        }
        
        console.log('\n=== TRANSITION HISTORY ===');
        this.transitionHistory.forEach((t, i) => {
            console.log(`${i + 1}. ${t.command}`);
            console.log(`   From: ${Object.keys(t.from.branches).join(', ') || 'No branches'}`);
            console.log(`   To: ${Object.keys(t.to.branches).join(', ') || 'No branches'}`);
        });
    }

    exportStateSpace(format = 'json') {
        const tree = this.getStateSpaceTree();
        
        if (format === 'json') {
            return JSON.stringify(tree, null, 2);
        } else if (format === 'graphviz') {
            let dot = 'digraph GitStateSpace {\n';
            dot += '  rankdir=LR;\n';
            dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n\n';
            
            // Add nodes
            for (const [stateKey, stateData] of this.allPossibleStates.entries()) {
                const label = `${stateData.id}\\n${stateData.state.currentBranch || 'No branch'}\\n${stateData.state.commitHistory.length} commits`;
                dot += `  ${stateData.id} [label="${label}"];\n`;
            }
            
            // Add edges
            dot += '\n';
            for (const [stateKey, stateData] of this.allPossibleStates.entries()) {
                stateData.transitions.forEach(t => {
                    const cmdShort = t.command.length > 20 ? t.command.substring(0, 17) + '...' : t.command;
                    dot += `  ${stateData.id} -> ${t.to} [label="${cmdShort}"];\n`;
                });
            }
            
            dot += '}\n';
            return dot;
        }
        
        return tree;
    }
}

// Example usage and test runner
function runGitWorkflowSimulation() {
    const simulator = new GitStateSpaceTree();
    
    console.log('🚀 Starting Git Workflow Simulation for project_👍\n');
    
    // Execute sample commands to build state space
    const sampleCommands = [
        'git init',
        'git status',
        'git add main.py',
        'git status -s',
        'git commit -m "feat: add main.py"',
        'git branch feature/python-utils',
        'git switch feature/python-utils',
        'git add utils.py',
        'git commit -m "feat: add utils.py"',
        'git switch main',
        'git merge feature/python-utils',
        'git remote add origin git@github.com:user/project_👍.git',
        'git push -u origin main',
        'git log --oneline',
        'git clone https://github.com/user/project_👍.git'
    ];
    
    sampleCommands.forEach(cmd => {
        simulator.executeCommand(cmd);
    });
    
    // Execute all 15x5 command variations to build complete state space
    console.log('\n=== EXECUTING ALL COMMAND VARIATIONS ===\n');
    let commandCount = 0;
    
    for (const [category, variations] of Object.entries(simulator.commands)) {
        console.log(`\n--- ${category.toUpperCase()} ---`);
        for (const variation of variations) {
            commandCount++;
            console.log(`\nCommand ${commandCount}: ${variation.cmd}`);
            simulator.executeCommand(variation.cmd);
            
            // For branching commands, try them from different states
            if (category === 'git branch' || category === 'git switch') {
                // Try from a state with commits
                if (simulator.currentState.hasCommits) {
                    simulator.executeCommand(variation.cmd);
                }
            }
        }
    }
    
    console.log(`\n✅ Executed ${commandCount} command variations`);
    
    // Visualize the state space
    simulator.visualizeStateSpace();
    
    // Export state space
    const jsonExport = simulator.exportStateSpace('json');
    const dotExport = simulator.exportStateSpace('graphviz');
    
    console.log('\n=== EXPORT OPTIONS ===');
    console.log('1. JSON state space (copy below):');
    console.log(jsonExport.substring(0, 500) + '...');
    
    console.log('\n2. Graphviz DOT format (paste at https://dreampuf.github.io/GraphvizOnline):');
    console.log(dotExport.substring(0, 500) + '...');
    
    return simulator;
}

// Run the simulation if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    runGitWorkflowSimulation();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GitStateSpaceTree, runGitWorkflowSimulation };
}