class GitNode {
    constructor(id, type, data = {}) {
        this.id = id;
        this.type = type; // 'init', 'add', 'commit', 'branch', 'merge', 'clone', 'pull', 'push'
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.branch = data.branch || 'main';
        this.color = this.getNodeColor(type);
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
            'remote': '#3F51B5'
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
            user: {
                name: '',
                email: ''
            }
        };
        this.nodeCounter = 0;
        this.previousBranch = null;
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

    setHead(nodeId) {
        this.head = nodeId;
    }

    createBranch(branchName, fromNodeId = null) {
        const sourceNodeId = fromNodeId || this.head;
        if (!sourceNodeId) {
            throw new Error('No source node to create branch from');
        }
        
        const branchNode = this.addNode('branch', { 
            branch: branchName,
            message: `Created branch ${branchName}`
        });
        
        this.addEdge(sourceNodeId, branchNode.id, `git branch ${branchName}`);
        this.branches.set(branchName, branchNode.id);
        
        return branchNode;
    }

    switchToBranch(branchName) {
        if (!this.branches.has(branchName)) {
            throw new Error(`Branch ${branchName} does not exist`);
        }
        
        this.previousBranch = this.getCurrentBranch();
        this.setHead(this.branches.get(branchName));
    }

    getCurrentBranch() {
        for (const [branchName, nodeId] of this.branches.entries()) {
            if (nodeId === this.head) {
                return branchName;
            }
        }
        return null;
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
        return {
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values()),
            head: this.head,
            branches: Object.fromEntries(this.branches),
            remotes: Object.fromEntries(this.remotes),
            config: this.config
        };
    }
}

module.exports = { GitNode, GitEdge, GitTimeline };
