import * as vscode from 'vscode';
import { generateAllClassmaps } from './generateClassmap';
import { DirectoryConfig, GenerateResult, Warning } from './types';

let statusBar:      vscode.StatusBarItem;
let debounceTimer:  ReturnType<typeof setTimeout> | null = null;
let activeWatchers: vscode.FileSystemWatcher[]           = [];

// ─── Config ──────────────────────────────────────────────────────────────────

function getDirectories(): DirectoryConfig[] {
    const cfg  = vscode.workspace.getConfiguration('wpClassmap');
    return cfg.get<DirectoryConfig[]>('directories', []);
}

function getGlobalExclude(): string[] {
    return vscode.workspace.getConfiguration('wpClassmap').get<string[]>('exclude', []);
}

function getWatchOnSave(): boolean {
    return vscode.workspace.getConfiguration('wpClassmap').get<boolean>('watchOnSave', false);
}

// ─── Warnings ────────────────────────────────────────────────────────────────

function showWarnings(results: GenerateResult[]): void {
    const allWarnings: Warning[] = results.flatMap(r => r.warnings);
    if (allWarnings.length === 0) return;

    const multiClass = allWarnings.filter(w => w.type === 'multiple_classes_in_file');
    const duplicates = allWarnings.filter(w => w.type === 'duplicate_class');

    if (multiClass.length > 0) {
        vscode.window.showWarningMessage(
            `PHP Classmap: ${multiClass.length} file(s) have multiple class declarations — only the first is mapped.`,
            'Show Files'
        ).then(action => {
            if (action !== 'Show Files') return;
            multiClass.forEach(w => vscode.window.showInformationMessage(w.file));
        });
    }

    if (duplicates.length > 0) {
        vscode.window.showWarningMessage(
            `PHP Classmap: ${duplicates.length} duplicate class name(s) — last file wins.`,
            'Show Details'
        ).then(action => {
            if (action !== 'Show Details') return;
            duplicates.forEach(w => vscode.window.showWarningMessage(w.message));
        });
    }
}

// ─── Rebuild ─────────────────────────────────────────────────────────────────

function rebuild(): void {
    const directories   = getDirectories();
    const globalExclude = getGlobalExclude();

    if (directories.length === 0) {
        statusBar.text    = '$(symbol-class) Classmap: no directories';
        statusBar.tooltip = 'Add directories via wpClassmap.directories in settings';
        return;
    }

    // Merge global exclude into each directory config
    const resolved: DirectoryConfig[] = directories.map(d => ({
        ...d,
        exclude: [...(d.exclude ?? []), ...globalExclude],
    }));

    statusBar.text    = '$(sync~spin) Rebuilding...';
    statusBar.tooltip = `Scanning ${directories.length} director${directories.length === 1 ? 'y' : 'ies'}...`;

    const results:    GenerateResult[] = generateAllClassmaps(resolved);
    const errors:     GenerateResult[] = results.filter(r => r.error);
    const totalCount: number           = results.reduce((sum, r) => sum + r.count, 0);
    const totalWarns: number           = results.reduce((sum, r) => sum + r.warnings.length, 0);

    if (errors.length > 0) {
        errors.forEach(r =>
            vscode.window.showErrorMessage(`PHP Classmap [${r.includesDir}]: ${r.error}`)
        );
        statusBar.text    = `$(error) Classmap: ${errors.length} error(s)`;
        statusBar.tooltip = errors.map(r => `${r.includesDir}: ${r.error}`).join('\n');
        return;
    }

    showWarnings(results);

    const warnBadge = totalWarns > 0 ? ` $(warning)${totalWarns}` : '';
    const lines     = results.map(r => {
        const w = r.warnings.length > 0 ? ` — ${r.warnings.length} warning(s)` : '';
        return `${r.includesDir}  →  ${r.count} classes${w}`;
    });

    statusBar.text    = `$(check) Classmap: ${totalCount}${warnBadge}`;
    statusBar.tooltip = `Click to rebuild\n${lines.join('\n')}`;

    setTimeout(() => {
        statusBar.text = `$(symbol-class) Classmap: ${totalCount}${warnBadge}`;
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
    const outputFiles = new Set(directories.map(d => d.outputFile));

    for (const { includesDir } of directories) {
        // Use absolute path directly — no workspace root needed
        const pattern = new vscode.RelativePattern(
            vscode.Uri.file(includesDir),
            '**/*.php'
        );
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);

        const handler = (uri: vscode.Uri): void => {
            if (outputFiles.has(uri.fsPath)) return;
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
    statusBar.tooltip = 'Click to manually rebuild classmap';
    statusBar.show();

    // ── Commands ──
    const rebuildCmd = vscode.commands.registerCommand('wpClassmap.rebuild', () => {
        rebuild();
    });

    const addDirCmd = vscode.commands.registerCommand('wpClassmap.addDirectory', async () => {
        const dir = await vscode.window.showInputBox({
            prompt:      'Full absolute path of directory to scan',
            placeHolder: '/home/user/my-plugin/includes',
        });
        if (!dir) return;

        const out = await vscode.window.showInputBox({
            prompt: 'Full absolute path of output classmap file',
            value:  `${dir}/classmap.php`,
        });
        if (!out) return;

        const excl = await vscode.window.showInputBox({
            prompt:      'Directory names to exclude (comma-separated, optional)',
            placeHolder: 'tests, fixtures',
        });

        const cfg  = vscode.workspace.getConfiguration('wpClassmap');
        const dirs = getDirectories();
        dirs.push({
            includesDir: dir,
            outputFile:  out,
            exclude:     excl ? excl.split(',').map(s => s.trim()).filter(Boolean) : [],
        });

        await cfg.update('directories', dirs, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`PHP Classmap: added "${dir}"`);
        rebuild();
    });

    // ── Config change → re-register watchers + rebuild ──
    const cfgWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (!e.affectsConfiguration('wpClassmap')) return;
        registerWatchers(context);
        rebuild();
    });

    // ── Window focus → rebuild in case files changed outside VS Code ──
    const focusWatcher = vscode.window.onDidChangeWindowState(e => {
        if (e.focused) debouncedRebuild();
    });

    // ── Right-click rebuild ──
    const contextCmd = vscode.commands.registerCommand('wpClassmap.rebuildFromContext', () => {
        rebuild();
    });

    // ── Initial setup ──
    registerWatchers(context);
    rebuild();

    context.subscriptions.push(rebuildCmd, addDirCmd, contextCmd, cfgWatcher, focusWatcher, statusBar);
}

export function deactivate(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    activeWatchers.forEach(w => w.dispose());
}