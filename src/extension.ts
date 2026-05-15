import * as vscode from 'vscode';
import * as path   from 'path';
import { generateAllClassmaps } from './generateClassmap';
import { DirectoryConfig, GenerateResult } from './types';

let statusBar:      vscode.StatusBarItem;
let debounceTimer:  ReturnType<typeof setTimeout> | null = null;
let activeWatchers: vscode.FileSystemWatcher[]           = [];

// ─── Config ──────────────────────────────────────────────────────────────────

function getDirectories(): DirectoryConfig[] {
    const cfg = vscode.workspace.getConfiguration('wpClassmap');
    return cfg.get<DirectoryConfig[]>('directories') || [];
}

function getWatchOnSave(): boolean {
    return vscode.workspace.getConfiguration('wpClassmap').get<boolean>('watchOnSave', false);
}

// ─── Rebuild ─────────────────────────────────────────────────────────────────

function rebuild(): void {
    const directories = getDirectories();

    if (directories.length === 0) {
        statusBar.text = '$(warning) Classmap: No dirs';
        statusBar.tooltip = 'Click to add a directory';
        return;
    }

    statusBar.text    = '$(sync~spin) Rebuilding...';
    statusBar.tooltip = `Scanning ${directories.length} directories...`;

    const results:    GenerateResult[] = generateAllClassmaps(directories);
    const errors:     GenerateResult[] = results.filter(r => r.error);
    const totalCount: number           = results.reduce((sum, r) => sum + r.count, 0);

    if (errors.length > 0) {
        errors.forEach(r => {
            vscode.window.showErrorMessage(`WP Classmap Error: ${r.error}`);
        });
        statusBar.text    = `$(warning) Classmap Error`;
        statusBar.tooltip = errors.map(r => r.error).join('\n');
        return;
    }

    statusBar.text    = `$(check) Classmap: ${totalCount}`;
    statusBar.tooltip = results.map(r => `${r.includesDir}: ${r.count} classes`).join('\n');

    setTimeout(() => {
        statusBar.text = `$(symbol-class) Classmap: ${totalCount}`;
    }, 3000);
}

function debouncedRebuild(ms: number = 300): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => rebuild(), ms);
}

// ─── Watchers ────────────────────────────────────────────────────────────────

function registerWatchers(context: vscode.ExtensionContext): void {
    // Clear existing watchers
    activeWatchers.forEach(w => w.dispose());
    activeWatchers = [];

    const directories = getDirectories();
    const watchOnSave = getWatchOnSave();

    for (const { includesDir, outputFile } of directories) {
        // Since we aren't using pluginRoot, we create a watcher 
        // directly on the absolute path pattern
        const pattern = new vscode.RelativePattern(includesDir, '**/*.php');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        const handler = (uri: vscode.Uri): void => {
            // Ignore if the changed file is the output classmap itself
            if (uri.fsPath === path.resolve(outputFile)) return;
            debouncedRebuild();
        };

        watcher.onDidCreate(handler);
        watcher.onDidDelete(handler);
        if (watchOnSave) watcher.onDidChange(handler);

        activeWatchers.push(watcher);
        context.subscriptions.push(watcher);
    }
}

// ─── Activate ────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
    // ── Status bar ──
    statusBar         = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
    statusBar.text    = '$(symbol-class) Classmap';
    statusBar.command = 'wpClassmap.rebuild';
    statusBar.show();

    // ── Commands ──
    const rebuildCmd = vscode.commands.registerCommand('wpClassmap.rebuild', () => {
        rebuild();
    });

    const addDirCmd = vscode.commands.registerCommand('wpClassmap.addDirectory', async () => {
        const uris = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles:   false,
            canSelectMany:    false,
            openLabel:        'Select Directory to Scan'
        });

        if (!uris || uris.length === 0) return;
        const selectedPath = uris[0].fsPath;

        const cfg  = vscode.workspace.getConfiguration('wpClassmap');
        const dirs = getDirectories();
        
        dirs.push({ 
            includesDir: selectedPath, 
            outputFile:  path.join(selectedPath, 'classmap.php') 
        });

        await cfg.update('directories', dirs, vscode.ConfigurationTarget.Global);
        // registerWatchers and rebuild will be triggered by onDidChangeConfiguration
    });

    // ── Config change listener ──
    const cfgWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('wpClassmap')) {
            registerWatchers(context);
            rebuild();
        }
    });

    // ── Initial setup ──
    registerWatchers(context);
    rebuild();

    context.subscriptions.push(rebuildCmd, addDirCmd, cfgWatcher, statusBar);
}

export function deactivate(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    activeWatchers.forEach(w => w.dispose());
}