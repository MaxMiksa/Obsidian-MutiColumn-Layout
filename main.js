const { Plugin, Menu, MarkdownView, PluginSettingTab, Setting, Modal } = require("obsidian");

const DEFAULT_SETTINGS = {
  dividerWidth: "1px",
  dividerStyle: "solid",
  dividerColor: "#7d7d7d", // Default to a visible gray instead of var for better picker UX
  horzDivider: false,
  horzDividerWidth: "1px",
  horzDividerStyle: "solid",
  horzDividerColor: "#7d7d7d"
};

class MultiColumnLayoutPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    // Add Settings Tab
    this.addSettingTab(new MultiColumnLayoutSettingTab(this.app, this));

    // Apply CSS Variables
    this.applySettingsStyles();

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        this.addInsertMenu(menu, editor);
      })
    );

    this.registerMarkdownPostProcessor((el) => {
      this.applyColumnWidths(el);
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applySettingsStyles();
  }

  applySettingsStyles() {
    // Inject settings into CSS variables on the body
    const style = document.body.style;
    style.setProperty("--mcl-divider-width", this.settings.dividerWidth);
    style.setProperty("--mcl-divider-style", this.settings.dividerStyle);
    style.setProperty("--mcl-divider-color", this.settings.dividerColor);
    
    style.setProperty("--mcl-horz-divider-width", this.settings.horzDividerWidth);
    style.setProperty("--mcl-horz-divider-style", this.settings.horzDividerStyle);
    style.setProperty("--mcl-horz-divider-color", this.settings.horzDividerColor);
  }

  addInsertMenu(menu, editor) {
    menu.addItem((item) => {
      item.setTitle("2 Columns + Divider");
      item.setIcon("columns");
      item.onClick(() => this.safeInsert(editor, 2, [50, 50], "bordered"));
    });

    menu.addItem((item) => {
      item.setTitle("3 Columns + Divider");
      item.setIcon("columns");
      item.onClick(() => this.safeInsert(editor, 3, [33, 34, 33], "bordered"));
    });
    
    menu.addSeparator();

    menu.addItem((item) => {
      item.setTitle("Custom Layout...");
      item.setIcon("settings-sliders");
      item.onClick(() => {
        const activeEditor = this.getActiveEditor() || editor;
        if(activeEditor) {
            new CustomRatioModal(this.app, (cols, ratios) => {
                this.insertColumnLayout(activeEditor, cols, ratios, "bordered");
            }).open();
        }
      });
    });
  }

  safeInsert(passedEditor, cols, ratios, meta) {
    const activeEditor = this.getActiveEditor() || passedEditor;
    if (!activeEditor) {
      console.error("Multi-Column Plugin: No active editor found.");
      return;
    }
    this.insertColumnLayout(activeEditor, cols, ratios, meta);
  }

  getActiveEditor() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view ? view.editor : null;
  }

  insertColumnLayout(editor, columnCount, ratios, metadata = "") {
    if (!editor) return;

    editor.focus();

    // Check if horizontal dividers are enabled in settings
    const metaParts = [];
    if (metadata) metaParts.push(metadata);
    if (this.settings.horzDivider) metaParts.push("horizontal");
    
    const metaStr = metaParts.length > 0 ? `|${metaParts.join("|")}` : "";

    const lines = [];
    lines.push(`> [!multi-column${metaStr}]`);
    lines.push(">");

    for (let i = 0; i < columnCount; i++) {
      const ratio = Array.isArray(ratios) ? ratios[i] : undefined;
      const colMeta = typeof ratio === "number" && !isNaN(ratio) ? `|${ratio}` : "";
      lines.push(`>> [!col${colMeta}]`);
      lines.push(">> ");
      
      // Only add spacer line if it's NOT the last column
      if (i < columnCount - 1) {
        lines.push(">");
      }
    }

    const block = lines.join("\n") + "\n";
    
    try {
        const cursor = editor.getCursor();
        editor.replaceSelection(block);
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

class CustomRatioModal extends Modal {
    constructor(app, onSubmit) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Custom Column Ratios" });

        const instruction = contentEl.createEl("p", { text: "Enter ratios separated by slashes (e.g. 30/70 or 20/30/50). Sum must be 100." });
        instruction.style.color = "var(--text-muted)";
        instruction.style.marginBottom = "1rem";

        const inputContainer = contentEl.createDiv();
        const input = inputContainer.createEl("input", { type: "text", placeholder: "50/50" });
        input.style.width = "100%";
        input.focus();

        const errorMsg = contentEl.createEl("p", { text: "" });
        errorMsg.style.color = "var(--text-error)";
        errorMsg.style.marginTop = "0.5rem";
        errorMsg.style.display = "none";

        const btnContainer = contentEl.createDiv();
        btnContainer.style.marginTop = "1rem";
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "flex-end";

        const submitBtn = btnContainer.createEl("button", { text: "Insert Layout" });
        submitBtn.addClass("mod-cta");

        const validateAndSubmit = () => {
            const val = input.value.trim();
            if (!val) return;

            const parts = val.split("/").map(p => parseInt(p.trim(), 10));
            const sum = parts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);

            if (parts.some(isNaN)) {
                errorMsg.text = "Invalid format. Use numbers separated by /.";
                errorMsg.style.display = "block";
                return;
            }

            if (sum !== 100) {
                errorMsg.text = `Sum is ${sum}%, but must be 100%.`;
                errorMsg.style.display = "block";
                return;
            }

            this.onSubmit(parts.length, parts);
            this.close();
        };

        submitBtn.onclick = validateAndSubmit;
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") validateAndSubmit();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class MultiColumnLayoutSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Multi-Column Layout Settings" });

    new Setting(containerEl)
        .setName("Vertical Divider Width")
        .setDesc("Width of the divider between columns.")
        .addText(text => text
            .setPlaceholder("1px")
            .setValue(this.plugin.settings.dividerWidth)
            .onChange(async (value) => {
                this.plugin.settings.dividerWidth = value;
                await this.plugin.saveSettings();
            }));

    new Setting(containerEl)
        .setName("Vertical Divider Style")
        .setDesc("Style of the divider line.")
        .addDropdown(dropdown => dropdown
            .addOption("solid", "Solid")
            .addOption("dashed", "Dashed")
            .addOption("dotted", "Dotted")
            .addOption("double", "Double")
            .setValue(this.plugin.settings.dividerStyle)
            .onChange(async (value) => {
                this.plugin.settings.dividerStyle = value;
                await this.plugin.saveSettings();
            }));

    new Setting(containerEl)
        .setName("Vertical Divider Color")
        .setDesc("Color of the divider.")
        .addColorPicker(color => color
            .setValue(this.plugin.settings.dividerColor)
            .onChange(async (value) => {
                this.plugin.settings.dividerColor = value;
                await this.plugin.saveSettings();
            }));

    containerEl.createEl("h3", { text: "Horizontal Dividers" });

    new Setting(containerEl)
        .setName("Add Horizontal Dividers")
        .setDesc("Automatically add top and bottom borders to NEW inserted layouts.")
        .addToggle(toggle => toggle
            .setValue(this.plugin.settings.horzDivider)
            .onChange(async (value) => {
                this.plugin.settings.horzDivider = value;
                await this.plugin.saveSettings();
            }));

    new Setting(containerEl)
        .setName("Horizontal Divider Width")
        .addText(text => text
            .setPlaceholder("1px")
            .setValue(this.plugin.settings.horzDividerWidth)
            .onChange(async (value) => {
                this.plugin.settings.horzDividerWidth = value;
                await this.plugin.saveSettings();
            }));
            
    new Setting(containerEl)
        .setName("Horizontal Divider Style")
        .addDropdown(dropdown => dropdown
            .addOption("solid", "Solid")
            .addOption("dashed", "Dashed")
            .addOption("dotted", "Dotted")
            .addOption("double", "Double")
            .setValue(this.plugin.settings.horzDividerStyle)
            .onChange(async (value) => {
                this.plugin.settings.horzDividerStyle = value;
                await this.plugin.saveSettings();
            }));
            
    new Setting(containerEl)
        .setName("Horizontal Divider Color")
        .addColorPicker(color => color
            .setValue(this.plugin.settings.horzDividerColor)
            .onChange(async (value) => {
                this.plugin.settings.horzDividerColor = value;
                await this.plugin.saveSettings();
            }));
  }
}

module.exports = MultiColumnLayoutPlugin;