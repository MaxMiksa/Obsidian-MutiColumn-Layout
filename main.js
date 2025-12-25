const { Plugin, Menu, MarkdownView, PluginSettingTab, Setting, Modal, Notice } = require("obsidian");

const DEFAULT_SETTINGS = {
  language: "en",
  dividerWidth: "1px",
  dividerStyle: "solid",
  dividerColor: "gray",
  horzDivider: false,
  horzDividerWidth: "1px",
  horzDividerStyle: "solid",
  horzDividerColor: "gray"
};

const PRESET_COLORS = {
  "gray": "#7d7d7d",
  "red": "#e93030",
  "orange": "#e9973f",
  "yellow": "#e0de71",
  "green": "#44cf6e",
  "cyan": "#53dfdd",
  "blue": "#3875d7",
  "purple": "#945ecf",
  "black": "#000000",
  "white": "#ffffff"
};

const TEXTS = {
  en: {
    "settings.title": "Multi-Column Layout Settings",
    "settings.general": "General",
    "settings.language": "Language",
    "settings.language.desc": "Choose the display language for the plugin.",
    "settings.vertical": "Vertical Dividers (Bordered)",
    "settings.horizontal": "Horizontal Dividers",
    "settings.width": "Width",
    "settings.width.desc": "Width of the line (e.g., 1px, 2px).",
    "settings.style": "Style",
    "settings.style.desc": "Style of the line.",
    "settings.color": "Color",
    "settings.color.desc": "Color of the line.",
    "settings.horz.enable": "Enable Horizontal Dividers",
    "settings.horz.enable.desc": "Automatically add top and bottom borders to NEW inserted layouts.",
    "menu.2col": "2 Columns + Divider",
    "menu.3col": "3 Columns + Divider",
    "menu.custom": "Custom Layout...",
    "modal.title": "Custom Column Ratios",
    "modal.instruction": "Enter ratios separated by slashes (e.g. 30/70 or 20/30/50). Sum must be 100.",
    "modal.insert": "Insert Layout",
    "modal.error.format": "Invalid format. Use numbers separated by /.",
    "modal.error.sum": "Sum is {0}%, but must be 100%."
  },
  zh: {
    "settings.title": "多栏布局设置",
    "settings.general": "常规",
    "settings.language": "语言",
    "settings.language.desc": "选择插件显示的语言。",
    "settings.vertical": "竖直分割线",
    "settings.horizontal": "水平分割线",
    "settings.width": "宽度",
    "settings.width.desc": "线条的粗细（例如 1px, 2px）。",
    "settings.style": "样式",
    "settings.style.desc": "线条的类型。",
    "settings.color": "颜色",
    "settings.color.desc": "线条的颜色。",
    "settings.horz.enable": "启用水平分割线",
    "settings.horz.enable.desc": "在插入新布局时自动添加上下边框。",
    "menu.2col": "2栏 + 分割线",
    "menu.3col": "3栏 + 分割线",
    "menu.custom": "自定义布局...",
    "modal.title": "自定义分栏比例",
    "modal.instruction": "输入以斜杠分隔的比例（例如 30/70 或 20/30/50）。总和必须为 100。",
    "modal.insert": "插入布局",
    "modal.error.format": "格式无效。请使用斜杠分隔数字。",
    "modal.error.sum": "当前总和为 {0}%，但必须是 100%。"
  }
};

class MultiColumnLayoutPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.addSettingTab(new MultiColumnLayoutSettingTab(this.app, this));
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

  t(key, ...args) {
    const lang = this.settings.language || "en";
    let str = TEXTS[lang][key] || TEXTS["en" у][key] || key;
    args.forEach((arg, i) => {
      str = str.replace(`{${i}}`, arg);
    });
    return str;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applySettingsStyles();
  }

  applySettingsStyles() {
    const style = document.body.style;
    
    const vColor = PRESET_COLORS[this.settings.dividerColor] || this.settings.dividerColor;
    const hColor = PRESET_COLORS[this.settings.horzDividerColor] || this.settings.horzDividerColor;

    style.setProperty("--mcl-divider-width", this.settings.dividerWidth);
    style.setProperty("--mcl-divider-style", this.settings.dividerStyle);
    style.setProperty("--mcl-divider-color", vColor);
    
    style.setProperty("--mcl-horz-divider-width", this.settings.horzDividerWidth);
    style.setProperty("--mcl-horz-divider-style", this.settings.horzDividerStyle);
    style.setProperty("--mcl-horz-divider-color", hColor);
  }

  addInsertMenu(menu, editor) {
    menu.addItem((item) => {
      item.setTitle(this.t("menu.2col"));
      item.setIcon("columns");
      item.onClick(() => this.safeInsert(editor, 2, [50, 50], "bordered"));
    });

    menu.addItem((item) => {
      item.setTitle(this.t("menu.3col"));
      item.setIcon("columns");
      item.onClick(() => this.safeInsert(editor, 3, [33, 34, 33], "bordered"));
    });
    
    menu.addSeparator();

    menu.addItem((item) => {
      item.setTitle(this.t("menu.custom"));
      item.setIcon("settings-sliders");
      item.onClick(() => {
        const activeEditor = this.getActiveEditor() || editor;
        if(activeEditor) {
            new CustomRatioModal(this.app, this, (cols, ratios) => {
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
      lines.push(">>");
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
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: this.plugin.t("modal.title") });

        const instruction = contentEl.createEl("p", { text: this.plugin.t("modal.instruction") });
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

        const submitBtn = btnContainer.createEl("button", { text: this.plugin.t("modal.insert") });
        submitBtn.addClass("mod-cta");

        const validateAndSubmit = () => {
            const val = input.value.trim();
            if (!val) return;

            const parts = val.split("/").map(p => parseInt(p.trim(), 10));
            const sum = parts.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);

            if (parts.some(isNaN)) {
                errorMsg.text = this.plugin.t("modal.error.format");
                errorMsg.style.display = "block";
                return;
            }

            if (sum !== 100) {
                errorMsg.text = this.plugin.t("modal.error.sum", sum);
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

    containerEl.createEl("h2", { text: this.plugin.t("settings.title") });

    new Setting(containerEl)
        .setName(this.plugin.t("settings.language"))
        .setDesc(this.plugin.t("settings.language.desc"))
        .addDropdown(dropdown => dropdown
            .addOption("en", "English")
            .addOption("zh", "简体中文")
            .setValue(this.plugin.settings.language)
            .onChange(async (value) => {
                this.plugin.settings.language = value;
                await this.plugin.saveSettings();
                this.display(); // Refresh settings tab to show new language
            }));

    containerEl.createEl("h3", { text: this.plugin.t("settings.vertical") });

    new Setting(containerEl)
        .setName(this.plugin.t("settings.width"))
        .setDesc(this.plugin.t("settings.width.desc"))
        .addText(text => text
            .setPlaceholder("1px")
            .setValue(this.plugin.settings.dividerWidth)
            .onChange(async (value) => {
                this.plugin.settings.dividerWidth = value;
                await this.plugin.saveSettings();
            }));

    new Setting(containerEl)
        .setName(this.plugin.t("settings.style"))
        .setDesc(this.plugin.t("settings.style.desc"))
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

    this.addColorDropdown(containerEl, "dividerColor", this.plugin.t("settings.color"), this.plugin.t("settings.color.desc"));

    containerEl.createEl("h3", { text: this.plugin.t("settings.horizontal") });

    new Setting(containerEl)
        .setName(this.plugin.t("settings.horz.enable"))
        .setDesc(this.plugin.t("settings.horz.enable.desc"))
        .addToggle(toggle => toggle
            .setValue(this.plugin.settings.horzDivider)
            .onChange(async (value) => {
                this.plugin.settings.horzDivider = value;
                await this.plugin.saveSettings();
            }));

    new Setting(containerEl)
        .setName(this.plugin.t("settings.width"))
        .addText(text => text
            .setPlaceholder("1px")
            .setValue(this.plugin.settings.horzDividerWidth)
            .onChange(async (value) => {
                this.plugin.settings.horzDividerWidth = value;
                await this.plugin.saveSettings();
            }));
            
    new Setting(containerEl)
        .setName(this.plugin.t("settings.style"))
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
            
    this.addColorDropdown(containerEl, "horzDividerColor", this.plugin.t("settings.color"), "");
  }

  addColorDropdown(containerEl, settingKey, name, desc) {
      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addDropdown(dropdown => {
            Object.keys(PRESET_COLORS).forEach(color => {
                dropdown.addOption(color, color.charAt(0).toUpperCase() + color.slice(1));
            });
            dropdown.setValue(this.plugin.settings[settingKey]);
            dropdown.onChange(async (value) => {
                this.plugin.settings[settingKey] = value;
                await this.plugin.saveSettings();
            });
        });
  }
}

module.exports = MultiColumnLayoutPlugin;
