# Git Status Implementation Documentation

## Overview
This document describes the implementation of the `git status` command in the Git visualizer project. The implementation follows the standard Git status behavior and supports multiple output formats.

## Features Implemented

### Core Functionality
- **File State Detection**: Compares files across local, staged, and committed states
- **Change Classification**: Identifies added, modified, deleted, and untracked files
- **Multiple Output Formats**: Supports long, short, and porcelain formats
- **Branch Information**: Displays current branch or detached HEAD state
- **Option Parsing**: Handles various command-line options

### Supported Options
- `-s, --short`: Short format output
- `--porcelain[=v1|v2]`: Machine-parseable format
- `--long`: Long format (default)
- `-b, --branch`: Show branch and tracking info
- `--show-stash`: Show stash entries
- `-u[<mode>], --untracked-files[=<mode>]`: Control untracked file display
- `--ignored[=<mode>]`: Show ignored files
- `-v, --verbose`: Verbose output

## File States

The status command tracks files in three main states:
1. **Local**: Files in the working directory
2. **Staged**: Files in the staging area
3. **Committed**: Files in the last commit

### Status Codes
- `A`: Added
- `M`: Modified
- `D`: Deleted
- `??`: Untracked
- ` `: Unmodified

## Output Formats

### Long Format (Default)
```
On branch main
Changes to be committed:
  new file:   filename.js
  modified:   existing.js

Changes not staged for commit:
  modified:   working.js

Untracked files:
  use "git add <file>..." to include in what will be committed
  newfile.txt
```

### Short Format
```
## main
A  filename.js
 M existing.js
?? newfile.txt
```

### Porcelain Format
```
A  filename.js
 M existing.js
?? newfile.txt
```

## Implementation Details

### Key Methods

#### `handleStatus(parts)`
Main entry point that processes the status command.

#### `parseStatusOptions(parts)`
Parses command-line arguments and returns configuration options.

#### `getFileStates()`
Compares files across local, staged, and committed directories to determine their states.

#### `getFileStatus(state)`
Determines the two-character status code for a file based on its state.

#### `displayBranchInfo()`
Shows current branch information or detached HEAD state.

#### `displayFileChanges(fileStates, options)`
Formats and displays file changes based on the selected output format.

#### `displayUntrackedFiles(fileStates, options)`
Handles display of untracked files.

## File State Logic

The implementation uses the following logic to determine file states:

1. **Staged Changes** (Index Status):
   - `A`: File exists in staging but not in last commit
   - `D`: File exists in last commit but not in staging
   - `M`: File exists in both but content differs

2. **Working Tree Changes** (Work Tree Status):
   - `A`: File exists locally but not in staging
   - `D`: File exists in staging but not locally
   - `M`: File exists in both but content differs

3. **Untracked Files**:
   - Files that exist locally but not in staging or commits

## Integration

The status command integrates with:
- **GitFileSystem**: For file operations and directory management
- **GitTimeline**: For branch information and commit history
- **Command Processor**: For command routing and output handling

## Usage Examples

```bash
# Basic status
git status

# Short format
git status -s

# Porcelain format
git status --porcelain

# With branch info
git status -b

# Show untracked files
git status --untracked-files=all

# Verbose output
git status -v
```

## Future Enhancements

Potential improvements:
- **Remote Tracking**: Add ahead/behind information
- **Ignored Files**: Complete ignored file handling
- **Porcelain v2**: Implement version 2 porcelain format
- **Merge Conflicts**: Detect and display merge conflict states
- **Submodules**: Handle submodule status display
- **Performance**: Optimize for large repositories

## Testing

The implementation should be tested with various scenarios:
- Clean working directory
- Staged and unstaged changes
- New and deleted files
- Different output formats
- Various command-line options
- Detached HEAD state
