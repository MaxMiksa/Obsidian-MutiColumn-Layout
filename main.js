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
        subItem.onClick(() => {
          const activeEditor = this.getActiveEditor() || editor;
          this.insertColumnLayout(activeEditor, 2);
        });
      });

      subMenu.addItem((subItem) => {
        subItem.setTitle("Sidebar Left (30/70)");
        subItem.onClick(() => {
          const activeEditor = this.getActiveEditor() || editor;
          this.insertColumnLayout(activeEditor, 2, [30, 70]);
        });
      });

      subMenu.addItem((subItem) => {
        subItem.setTitle("3 Columns (33/34/33)");
        subItem.onClick(() => {
          const activeEditor = this.getActiveEditor() || editor;
          this.insertColumnLayout(activeEditor, 3, [33, 34, 33]);
        });
      });

      subMenu.addSeparator();

      subMenu.addItem((subItem) => {
        subItem.setTitle("2 Columns + Divider");
        subItem.setIcon("columns");
        subItem.onClick(() => {
          const activeEditor = this.getActiveEditor() || editor;
          this.insertColumnLayout(activeEditor, 2, undefined, "bordered");
        });
      });

      subMenu.addItem((subItem) => {
        subItem.setTitle("3 Columns + Divider");
        subItem.setIcon("columns");
        subItem.onClick(() => {
          const activeEditor = this.getActiveEditor() || editor;
          this.insertColumnLayout(activeEditor, 3, [33, 34, 33], "bordered");
        });
      });
    });
  }

  insertColumnLayout(editor, columnCount, ratios, metadata = "") {
    if (!editor) return;

    // Ensure editor is focused
    editor.focus();

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
    const cursor = editor.getCursor();
    
    editor.replaceSelection(block);

    // Move cursor to the first column content line (after >> )
    const target = { line: cursor.line + 3, ch: 3 };
    editor.setCursor(target);
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
