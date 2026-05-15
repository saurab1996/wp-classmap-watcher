# WP Classmap: Lightning-Fast WordPress Autoloading

[![Visual Studio Marketplace](https://img.shields.io/badge/Marketplace-WP%20Classmap-blue?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](https://opensource.org/licenses/MIT)

> Stop wasting CPU cycles searching for PHP files.

**WP Classmap** is a lightweight VS Code extension built specifically for WordPress developers.  
It automatically generates a high-performance PHP classmap, replacing expensive recursive autoloading with instant `$O(1)$` lookups.

Think of it as **Composer-style optimized autoloading**, without requiring Composer.

---

# ✨ Features

- ⚡ **Lightning-Fast Autoloading**  
  Replace `file_exists()` loops and recursive scans with direct array lookups.

- 🧠 **Zero-Configuration Runtime**  
  Your PHP autoloader only needs the generated classmap file.

- 🔄 **Automatic Rebuilding**  
  Instantly updates when files are created, renamed, deleted, or saved.

- 📁 **Multi-Directory Support**  
  Scan multiple folders simultaneously:
  - `includes/`
  - `src/`
  - `api/`
  - `modules/`
  - etc.

- 📊 **Status Bar Integration**
  - Total indexed classes
  - Rebuild progress indicator
  - One-click rebuild access

- 🚫 **No Composer Required**

---

# 🚀 Why Use WP Classmap?

Traditional WordPress autoloaders often do this:

```php
foreach ($paths as $path) {
    if (file_exists($path . $class . '.php')) {
        require_once $path . $class . '.php';
    }
}
```

That means:

- Multiple disk scans
- Repeated filesystem checks
- Slower request execution
- More CPU usage

WP Classmap converts that into:

```php
if (isset($classmap[$class])) {
    require_once $classmap[$class];
}
```

Result:

- Instant lookup
- Minimal filesystem access
- Faster plugin execution
- Cleaner architecture

---

# 📦 Installation

# 📦 Installation

Install the extension directly from the VS Code Marketplace:

👉 https://marketplace.visualstudio.com/items?itemName=saurab-gupta.wp-classmap-watcher

## Via VS Code

1. Open Extensions (`Ctrl + Shift + X`)
2. Search for:
   ```txt
   WP Classmap: Lightning Fast Autoloading

---

# 🚀 You're Ready

You now have:

- ⚡ High-performance PHP autoloading
- 🔄 Automated VS Code classmap rebuilding
- 📦 Professional `.vsix` packaging workflow
- 🧠 Composer-style optimization without Composer

Run:

```bash
npm run package
```

---

# ⚙️ Configuration

Add the following to your `.vscode/settings.json`:

```json
{
    "wpClassmap.directories": [
        {
            "includesDir": "includes",
            "outputFile": "includes/classmap.php"
        }
    ]
}
```

---

# 🛠 Example Generated Classmap

```php
<?php

return [
    'project_NAMESPACE\\Core\\Loader' => 'Core/Loader.php',
    'project_NAMESPACE\\Admin\\Settings' => 'Admin/Settings.php',
    'project_NAMESPACE\\API\\Routes' => 'API/Routes.php',
];
```

---

# 🧩 Optimized PHP Autoloader

Add this to your main plugin bootstrap file:

```php
<?php
/**
 * Optimized Classmap Autoloader
 *
 * @param string $class Fully-qualified class name.
 */
function project_autoload_class(string $class): void
{
    static $classmap = null;

    if (null === $classmap) {
        $file = PROJECT_DIR . 'includes/classmap.php';

        $classmap = file_exists($file)
            ? require $file
            : [];
    }

    if (isset($classmap[$class])) {
        require_once PROJECT_DIR . 'includes/' . $classmap[$class];
    }
}

spl_autoload_register('project_autoload_class');
```

---

# 🔄 Automatic Watching

WP Classmap can automatically rebuild mappings whenever files change.

Enable watch-on-save:

```json
{
    "wpClassmap.watchOnSave": true
}
```

---

# ⌨️ Commands

Open the Command Palette (`Ctrl + Shift + P`) and search for:

| Command | Description |
|---|---|
| `WP Classmap: Rebuild` | Force a complete rebuild of all configured directories |
| `WP Classmap: Add Directory` | Quickly add a new scan target using a folder picker |

---

# ⚙️ Settings Reference

| Setting | Type | Default | Description |
|---|---|---|---|
| `wpClassmap.directories` | `array` | `[]` | List of `{ includesDir, outputFile }` configurations |
| `wpClassmap.watchOnSave` | `boolean` | `false` | Automatically rebuild on every file save |

---

# 📊 Status Bar Integration

WP Classmap adds a lightweight status indicator to the VS Code status bar.

### Features

- 📦 Total indexed class count
- 🔄 Spinning rebuild indicator
- 🧾 Hover details for scanned directories
- 🖱 Click to manually rebuild

---

# 📁 Recommended Project Structure

```txt
my-plugin/
├── includes/
│   ├── Core/
│   ├── Admin/
│   ├── API/
│   └── classmap.php
├── my-plugin.php
└── .vscode/
    └── settings.json
```

---

# ✅ Requirements

- VS Code
- PHP 7.4+ or PHP 8+
- WordPress plugin or theme project

Supported platforms:

- Windows
- macOS
- Linux

---

# 🚫 No External Dependencies

WP Classmap does not require:

- Composer
- PSR-4 setup
- Vendor directories
- Third-party libraries

Just install the extension and start indexing classes.

---

# 📄 License

Released under the MIT License.

---

# ❤️ Built for WordPress Developers

WP Classmap was created to make WordPress plugin development faster, cleaner, and more scalable.

If you find it useful, consider leaving a review on the VS Code Marketplace.


---


# 🛠 Development & Building

If you want to contribute or build the extension from source:

## 1. Install Dependencies

```bash
npm install
```

---

## 2. Compile & Package

This command compiles the TypeScript source and generates the `.vsix` extension package:

```bash
npm run package
```

---

## 3. Local Installation

Install the generated `.vsix` file into VS Code.

### Via VS Code UI

```txt
Extensions View → ... → Install from VSIX...
```

### Via CLI

```bash
code --install-extension wp-classmap-x.x.x.vsix
```

---

# 💡 Pro Tip

For safer production builds, use a clean packaging script to avoid stale build artifacts:

```json
"package": "rm -rf out && npm run compile && vsce package"
```

This ensures old compiled files are removed before packaging the extension.

---

# 🚀 You're Ready

You now have:

- ⚡ High-performance PHP autoloading
- 🔄 Automated VS Code classmap rebuilding
- 📦 Professional `.vsix` packaging workflow
- 🧠 Composer-style optimization without Composer

Run:

```bash
npm run package
```

---

# ⚙️

…and ship it 🚀