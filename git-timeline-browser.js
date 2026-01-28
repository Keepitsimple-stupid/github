// Browser-compatible version of git-timeline.js

class GitNode {
    constructor(id, type, data = {}) {
        this.id = id;
        this.type = type; // 'init', 'add', 'commit', 'branch', 'merge', 'clone', 'pull', 'push'
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.branch = data.branch || 'main';
        this.color = this.getNodeColor(type);
        this.is_head = false; // HEAD tracking flag - like a radio button
    }

    getNodeColor(type) {
        const colors = {
            'init': '#4CAF50',
            'add': '#2196F3', 
            'commit': '#FF9800',
            'branch': '#9C27B0',
            'merge': '#F44336',
            'clone': '#00BCD4',
            'pull': '#795548',
            'push': '#607D8B',
            'remote': '#3F51B5',
            'revert': '#E91E63'
        };
        return colors[type] || '#757575';
    }
}

class GitEdge {
    constructor(fromNodeId, toNodeId, command, data = {}) {
        this.id = `edge_${fromNodeId}_${toNodeId}_${Date.now()}`;
        this.from = fromNodeId;
        this.to = toNodeId;
        this.command = command;
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.isBold = false;
        this.isMerge = data.isMerge || false;
    }
}

class GitTimeline {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.head = null;
        this.branches = new Map(); // branch_name -> node_id
        this.remotes = new Map(); // remote_name -> {url, last_sync_node}
        this.config = {
            'user.name': 'John Doe',
            'user.email': 'john@example.com'
        };
        this.nodeCounter = 0;
        this.currentBranch = 'main';
        this.current_working_branch = 'main'; // Internal tracking for current working branch
        this.detachedHEAD = null; // Track detached HEAD state
        this.previousBranch = null; // Track previous branch for switching back
    }
    
    // Generate realistic Git commit hash
    generateCommitHash() {
        // Generate a 40-character hex string like real Git SHA-1
        const chars = '0123456789abcdef';
        let hash = '';
        for (let i = 0; i < 40; i++) {
            hash += chars[Math.floor(Math.random() * 16)];
        }
        return hash;
    }
    
    // Get short hash (first 7 characters) like Git
    getShortHash(fullHash) {
        return fullHash.substring(0, 7);
    }
    
    // HEAD management methods - like radio button behavior
    setHead(nodeId) {
        console.log('setHead called with nodeId:', nodeId);
        
        // Clear HEAD flag from all nodes (radio button behavior)
        this.nodes.forEach((node, id) => {
            node.is_head = false;
        });
        
        // Set HEAD flag on the specified node
        if (this.nodes.has(nodeId)) {
            this.nodes.get(nodeId).is_head = true;
            this.head = nodeId;
            console.log('HEAD set on node:', nodeId, 'Node type:', this.nodes.get(nodeId).type);
        } else {
            console.log('Node not found:', nodeId);
        }
        
        // Debug: Check all nodes for HEAD flags
        console.log('All nodes HEAD status:');
        this.nodes.forEach((node, id) => {
            console.log(`Node ${id} (${node.type}): is_head = ${node.is_head}`);
        });
    }
    
    getHeadNode() {
        // Find the node that has HEAD flag
        for (const [nodeId, node] of this.nodes.entries()) {
            if (node.is_head) {
                return node;
            }
        }
        return null;
    }
    
    getHeadNodeId() {
        const headNode = this.getHeadNode();
        return headNode ? headNode.id : null;
    }

    generateNodeId() {
        return `node_${++this.nodeCounter}`;
    }

    addNode(type, data = {}) {
        const nodeId = this.generateNodeId();
        const node = new GitNode(nodeId, type, data);
        this.nodes.set(nodeId, node);
        return node;
    }

    addEdge(fromNodeId, toNodeId, command, data = {}) {
        const edge = new GitEdge(fromNodeId, toNodeId, command, data);
        this.edges.set(edge.id, edge);
        return edge;
    }

    createBranch(branchName, fromNodeId = null) {
        // Check if branch already exists
        if (this.branches.has(branchName)) {
            throw new Error(`fatal: a branch named '${branchName}' already exists`);
        }
        
        const sourceNodeId = fromNodeId || this.head;
        if (!sourceNodeId) {
            throw new Error('No source node to create branch from');
        }
        
        const branchNode = this.addNode('branch', { 
            branch: branchName,
            message: `Created branch ${branchName}`
        });
        
        // IMPORTANT: git branch does NOT create an edge because it doesn't move HEAD
        // It just creates a branch pointer, not a state transition
        // this.addEdge(sourceNodeId, branchNode.id, `git branch ${branchName}`);
        this.branches.set(branchName, branchNode.id);
        
        // IMPORTANT: git branch does NOT move HEAD - HEAD stays where it was
        // Don't call setHead here - let the command processor handle HEAD changes
        
        return branchNode;
    }

    switchToBranch(branchName) {
        if (!this.branches.has(branchName)) {
            throw new Error(`Branch ${branchName} does not exist`);
        }
        
        this.previousBranch = this.getCurrentBranch();
        
        // Update internal working branch variable
        this.current_working_branch = branchName;
        
        // Find the latest node on the target branch
        const latestNodeOnBranch = this.findLatestNodeOnBranch(branchName);
        let targetNodeId;
        
        if (latestNodeOnBranch) {
            targetNodeId = latestNodeOnBranch.id;
            this.setHead(latestNodeOnBranch.id);
        } else {
            // Fallback to branch creation point if no other nodes on branch
            targetNodeId = this.branches.get(branchName);
            this.setHead(targetNodeId);
        }
        
        console.log(`Switched working branch to: ${this.current_working_branch}`);
        
        // Return the target node ID for edge creation
        return targetNodeId;
    }
    
    findLatestNodeOnBranch(branchName) {
        // Find all nodes on this branch and return the most recent one
        const branchNodes = Array.from(this.nodes.values())
            .filter(node => node.branch === branchName)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return branchNodes.length > 0 ? branchNodes[0] : null;
    }

    getCurrentBranch() {
        // Return the internal working branch variable for consistency
        return this.current_working_branch;
        
        // Old logic - keep as fallback
        // const headNode = this.getHeadNode();
        // if (!headNode) return 'main';
        
        // // If HEAD is on a switch node, use the target branch from that switch
        // if (headNode.type === 'switch' && headNode.data.branch) {
        //     return headNode.data.branch;
        // }
        
        // // If HEAD is on a branch creation node, use that branch
        // if (headNode.type === 'branch' && headNode.data.branch) {
        //     return headNode.data.branch;
        // }
        
        // // For all other nodes, use the branch property of the node
        // return headNode.branch || 'main';
    }

    getBranchHead(branchName) {
        return this.branches.get(branchName);
    }

    deleteBranch(branchName) {
        if (!this.branches.has(branchName)) {
            throw new Error(`Branch ${branchName} does not exist`);
        }
        
        const currentBranch = this.getCurrentBranch();
        if (currentBranch === branchName) {
            throw new Error('Cannot delete the current branch');
        }
        
        this.branches.delete(branchName);
    }

    renameBranch(oldName, newName) {
        if (!this.branches.has(oldName)) {
            throw new Error(`Branch ${oldName} does not exist`);
        }
        
        if (this.branches.has(newName)) {
            throw new Error(`Branch ${newName} already exists`);
        }
        
        const nodeId = this.branches.get(oldName);
        this.branches.delete(oldName);
        this.branches.set(newName, nodeId);
        
        const node = this.nodes.get(nodeId);
        if (node) {
            node.data.branch = newName;
            node.data.message = `Created branch ${newName}`;
        }
    }

    addRemote(name, url) {
        this.remotes.set(name, { url, last_sync_node: null });
    }

    removeRemote(name) {
        this.remotes.delete(name);
    }

    getRemote(name) {
        return this.remotes.get(name);
    }

    setConfig(key, value) {
        const keys = key.split('.');
        let obj = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
    }

    getConfig(key) {
        const keys = key.split('.');
        let obj = this.config;
        
        for (const k of keys) {
            if (obj[k] === undefined) {
                return undefined;
            }
            obj = obj[k];
        }
        
        return obj;
    }

    getCommits(limit = null) {
        const commits = Array.from(this.nodes.values())
            .filter(node => node.type === 'commit')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (limit) {
            return commits.slice(0, limit);
        }
        
        return commits;
    }

    getTimelineData() {
        // Sort nodes by timestamp to ensure chronological order
        const sortedNodes = Array.from(this.nodes.values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return {
            nodes: sortedNodes,
            edges: Array.from(this.edges.values()),
            head: this.head,
            branches: Object.fromEntries(this.branches),
            remotes: Object.fromEntries(this.remotes),
            config: this.config
        };
    }

    // Detached HEAD methods
    isDetachedHEAD() {
        return this.detachedHEAD !== null;
    }

    setDetachedHEAD(commitHash) {
        this.detachedHEAD = commitHash;
        this.previousBranch = this.currentBranch;
        this.currentBranch = null;
    }

    clearDetachedHEAD() {
        if (this.previousBranch) {
            this.currentBranch = this.previousBranch;
            this.previousBranch = null;
        }
        this.detachedHEAD = null;
    }
}

// Make classes available globally
window.GitNode = GitNode;
window.GitEdge = GitEdge;
window.GitTimeline = GitTimeline;
