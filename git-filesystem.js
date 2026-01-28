const fs = require('fs').promises;
const path = require('path');
const { GitTimeline } = require('./git-timeline');

class GitFileSystem {
    constructor() {
        this.baseDir = process.cwd();
        this.storageDir = path.join(this.baseDir, 'storage');
        this.localDir = path.join(this.storageDir, 'local');
        this.stageDir = path.join(this.storageDir, 'stage');
        this.commitDir = path.join(this.storageDir, 'commit');
        this.remoteDir = path.join(this.storageDir, 'remote');
        this.timeline = new GitTimeline();
    }

    async ensureDirectories() {
        const dirs = [this.localDir, this.stageDir, this.commitDir, this.remoteDir];
        await Promise.all(dirs.map(dir => fs.mkdir(dir, { recursive: true })));
    }

    async copyFile(src, dest) {
        await fs.copyFile(src, dest);
    }

    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        await Promise.all(entries.map(async (entry) => {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await this.copyFile(srcPath, destPath);
            }
        }));
    }

    async listFiles(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            return entries.filter(entry => entry.isFile()).map(entry => entry.name);
        } catch (error) {
            return [];
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async readFile(filePath) {
        return await fs.readFile(filePath, 'utf8');
    }

    async writeFile(filePath, content) {
        await fs.writeFile(filePath, content);
    }

    async deleteFile(filePath) {
        await fs.unlink(filePath);
    }

    async deleteDirectory(dir) {
        try {
            await fs.rmdir(dir, { recursive: true });
        } catch (error) {
            // Directory might not exist
        }
    }

    async moveFiles(fromDir, toDir, files = null) {
        await fs.mkdir(toDir, { recursive: true });
        
        if (files) {
            // Move specific files
            await Promise.all(files.map(async (file) => {
                const srcPath = path.join(fromDir, file);
                const destPath = path.join(toDir, file);
                
                if (await this.fileExists(srcPath)) {
                    await this.copyFile(srcPath, destPath);
                    await this.deleteFile(srcPath);
                }
            }));
        } else {
            // Move all files
            const allFiles = await this.listFiles(fromDir);
            await this.moveFiles(fromDir, toDir, allFiles);
        }
    }

    async copyFiles(fromDir, toDir, files = null) {
        await fs.mkdir(toDir, { recursive: true });
        
        if (files) {
            // Copy specific files
            await Promise.all(files.map(async (file) => {
                const srcPath = path.join(fromDir, file);
                const destPath = path.join(toDir, file);
                
                if (await this.fileExists(srcPath)) {
                    await this.copyFile(srcPath, destPath);
                }
            }));
        } else {
            // Copy all files
            await this.copyDirectory(fromDir, toDir);
        }
    }

    async isDirectoryEmpty(dir) {
        try {
            const files = await this.listFiles(dir);
            return files.length === 0;
        } catch {
            return true;
        }
    }

    async getGitDirectory() {
        const gitDir = path.join(this.baseDir, '.git');
        return await this.fileExists(gitDir) ? gitDir : null;
    }

    async createGitDirectory() {
        const gitDir = path.join(this.baseDir, '.git');
        await fs.mkdir(gitDir, { recursive: true });
        return gitDir;
    }

    async saveTimeline() {
        const timelineData = JSON.stringify(this.timeline.getTimelineData(), null, 2);
        await fs.writeFile(path.join(this.storageDir, 'timeline.json'), timelineData);
    }

    async loadTimeline() {
        try {
            const timelineData = await fs.readFile(path.join(this.storageDir, 'timeline.json'), 'utf8');
            const data = JSON.parse(timelineData);
            
            // Reconstruct timeline from saved data
            this.timeline = new GitTimeline();
            data.nodes.forEach(node => this.timeline.nodes.set(node.id, node));
            data.edges.forEach(edge => this.timeline.edges.set(edge.id, edge));
            this.timeline.head = data.head;
            this.timeline.branches = new Map(Object.entries(data.branches));
            this.timeline.remotes = new Map(Object.entries(data.remotes));
            this.timeline.config = data.config;
            this.timeline.nodeCounter = Math.max(...data.nodes.map(n => parseInt(n.id.split('_')[1]) || 0));
            
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = GitFileSystem;
