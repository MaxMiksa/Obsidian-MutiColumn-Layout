const { Plugin, Menu, MarkdownView } = require("obsidian");

class MultiColumnLayoutPlugin extends Plugin {
  onload() {
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        this.addInsertMenu(menu, editor);
      })
    );

    this.registerMarkdownPostProcessor((el) => {
      this.applyColumnWidths(el);
    });
  }

  addInsertMenu(menu, editor) {
    menu.addItem((item) => {
      item.setTitle("Insert Multi-Column");
      item.setIcon("layout-grid");

      const subMenu = item.setSubmenu();

      subMenu.addItem((subItem) => {
        subItem.setTitle("2 Columns (50/50)");
        subItem.onClick(() => this.safeInsert(editor, 2));
      });

      subMenu.addItem((subItem) => {
        subItem.setTitle("Sidebar Left (30/70)");
        subItem.onClick(() => this.safeInsert(editor, 2, [30, 70]));
      });

      subMenu.addItem((subItem) => {
        subItem.setTitle("3 Columns (33/34/33)");
        subItem.onClick(() => this.safeInsert(editor, 3, [33, 34, 33]));
      });

      subMenu.addSeparator();

      subMenu.addItem((subItem) => {
        subItem.setTitle("2 Columns + Divider");
        subItem.setIcon("columns");
        subItem.onClick(() => this.safeInsert(editor, 2, undefined, "bordered"));
      });

      subMenu.addItem((subItem) => {
        subItem.setTitle("3 Columns + Divider");
        subItem.setIcon("columns");
        subItem.onClick(() => this.safeInsert(editor, 3, [33, 34, 33], "bordered"));
      });
    });
  }

  // Wrapper to safely handle editor resolution
  safeInsert(passedEditor, cols, ratios, meta) {
    // Try to get the editor from the active view first, as it's most reliable
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const activeEditor = view ? view.editor : passedEditor;

    if (!activeEditor) {
      console.error("Multi-Column Plugin: No active editor found.");
      return;
    }

    this.insertColumnLayout(activeEditor, cols, ratios, meta);
  }

  insertColumnLayout(editor, columnCount, ratios, metadata = "") {
    if (!editor) {
      console.log("Multi-Column Plugin: Editor instance is null/undefined");
      return;
    }

    console.log(`Multi-Column Plugin: Inserting ${columnCount} columns...`);

    const lines = [];
    const metaStr = metadata ? `|${metadata}` : "";
    lines.push(`> [!multi-column${metaStr}]`);
    lines.push(">");

    for (let i = 0; i < columnCount; i++) {
      const ratio = Array.isArray(ratios) ? ratios[i] : undefined;
      const colMeta = typeof ratio === "number" && !isNaN(ratio) ? `|${ratio}` : "";
      lines.push(`>> [!col${colMeta}]`);
      lines.push(">> ");
      if (i !== columnCount - 1) {
        lines.push(">");
      }
    }

    const block = lines.join("\n") + "\n";
    
    try {
        const cursor = editor.getCursor();
        editor.replaceSelection(block);
        
        // Calculate new cursor position
        const target = { line: cursor.line + 3, ch: 3 };
        editor.setCursor(target);
        editor.focus();
    } catch (err) {
        console.error("Multi-Column Plugin: Failed to insert text", err);
    }
  }

  applyColumnWidths(el) {
    const columns = el.querySelectorAll('div.callout[data-callout="col"][data-callout-metadata]');
    columns.forEach((col) => {
      const raw = col.getAttribute("data-callout-metadata");
      const width = parseInt(raw, 10);
      if (Number.isFinite(width) && width > 0 && width <= 100) {
        col.style.flex = `0 0 ${width}%`;
        col.style.minWidth = "0";
      }
    });
  }
}

module.exports = MultiColumnLayoutPlugin;
