# Changelog

All notable changes to PHP Classmap Watcher are documented here.

---

## [1.1.0] — 2025-05-16

### Changed
- Extension renamed from **WP Classmap** to **PHP Classmap Watcher**
- Now works with any PHP project — WordPress, Laravel, Symfony, custom frameworks
- Directory paths are now **absolute** instead of workspace-relative
- Settings are saved to global VS Code config, not workspace `.vscode/settings.json`

### Added
- **Window focus rebuild** — automatically rebuilds when VS Code regains focus, catching changes made via terminal or git
- **Right-click rebuild** — trigger rebuild from Explorer or editor context menu on any `.php` file or folder
- **Directory exclusions** — `exclude` per directory and `wpClassmap.exclude` globally; `vendor`, `node_modules`, `.git` always excluded
- **Warnings** — notifies when a file contains multiple class declarations (only first is mapped) or duplicate class names across files
- **Warning badge** in status bar when warnings are present
- `wpClassmap.exclude` global setting for exclusions shared across all directories
- `PHP: Add Classmap Directory` command now prompts for exclusions

### Fixed
- Generated `classmap.php` no longer triggers a rebuild loop (correctly skipped by watcher)

---

## [1.0.0] — Initial Release

### Added
- Automatic classmap generation for PHP files
- File watcher — rebuilds on file create, delete, and rename
- Multi-directory support — each directory gets its own classmap file
- Status bar indicator with class count and rebuild progress
- `wpClassmap.directories` configuration
- `wpClassmap.watchOnSave` option
- Debounced rebuild to handle bulk file operations
- `PHP: Rebuild Classmap(s)` command
- Duplicate class detection with console warning