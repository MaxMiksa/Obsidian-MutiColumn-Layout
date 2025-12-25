# Multi-Column Layout | [中文版](./README-zh.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-v1.5.0+-purple.svg)](https://obsidian.md)

✅ **Magazine-style Layout | No Syntax to Memorize | Live Preview Support**  
✅ **Multi-Column Layout | Quick Insert Templates | Custom Width Ratios**  
✅ **Obsidian v1.5.0+ | Windows / macOS / Linux**  

Multi-Column Layout is an Obsidian plugin that simplifies the creation of side-by-side content using the built-in Callout syntax. It provides a convenient context menu to insert layouts instantly.

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **🚀 Quick Insert** | Right-click context menu to insert 50/50, 30/70, or 33/34/33 layouts. |
| **🎨 Custom Widths** | Adjust column widths easily using metadata like `[!col|40]`. |
| **📺 Live Preview** | See your layouts rendered instantly as you type. |
| **🔗 Compatibility** | Uses standard Markdown/Callout syntax for maximum portability. |

## 🚀 Usage Guide

1. **Right-click** anywhere in your editor.
2. Navigate to **Insert Multi-Column**.
3. Select your desired layout.
4. Start typing your content inside the generated blocks!

## 📝 Syntax Guide

The syntax is designed to be simple and intuitive if you prefer typing it manually:

- **Container**: Use `> [!multi-column]` to create the wrapper.
- **Column**: Use `>> [!col]` nested inside to create columns.
- **Widths**: Add a pipe and number to define width percentage, e.g., `>> [!col|30]`.

```markdown
> [!multi-column]
>
>> [!col]
>> This is the left column.
>
>> [!col]
>> This is the right column.
```

Or with custom widths (e.g., 30% / 70%):

```markdown
> [!multi-column]
>
>> [!col|30]
>> Left sidebar content...
>
>> [!col|70]
>> Main content area...
```

---

<details>
<summary><b>🛠️ Requirements & Technical Details</b></summary>

- Requires Obsidian v1.5.0 or higher.
- Uses CSS Flexbox for rendering.
- Syntax: `> [!multi-column]` as container, `>> [!col]` as columns.
</details>

<details>
<summary><b>💻 Developer Guide</b></summary>

1. Clone this repo.
2. Run `npm install` (if package.json is added).
3. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder.
</details>

## 🤝 Contribution & Contact

Welcome to submit Issues and Pull Requests!
Any questions or suggestions? Please contact Zheyuan (Max) Kong (Carnegie Mellon University, Pittsburgh, PA).

Zheyuan (Max) Kong: kongzheyuan@outlook.com | zheyuank@andrew.cmu.edu
