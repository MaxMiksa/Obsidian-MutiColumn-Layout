# Multi-Column Showcase

## 3 Columns (33/34/33)
> [!multi-column]
>
>> [!col|33]
>> ## Project A
>> - Overview: basic multi-column layout.
>> - Highlight: pure Markdown, readable in plaintext.
>
>> [!col|34]
>> ## Project B
>> - Overview: two-column template with ratios.
>> - Highlight: one-click insert via context menu.
>
>> [!col|33]
>> ## Project C
>> - Overview: mobile auto-stack demo.
>> - Highlight: CSS snippet works standalone.

---
## Siderbar Left (30/70)
> [!multi-column]
>
>> [!col|30]
>> ## Mode D: Sidebar Left
>> - 30/70 left sidebar layout.
>> - Good for TOC, navigation, summaries.
>
>> [!col|70]
>> ## Mode E: Main Content
>> - Large content area for prose/charts. Large content area for prose/charts. Large content area for prose/charts.
>> - Pair with the sidebar for focus. Pair with the sidebar for focus. Pair with the sidebar for focus. Pair with the sidebar for focus.

---

> [!multi-column]
>
>> [!col]
>> ### Column 1
>> Content here...
>
>> [!col]
>> ### Column 2
>> Content there...

### With Dividers (New!)

> [!multi-column|bordered]
>
>> [!col]
>> ### Left Side
>> This layout has a divider line on the right.
>
>> [!col]
>> ### Right Side
>> Clean separation between content.

---
## Rich Content Demo (Mixed Media)
> [!multi-column]
>
>> [!col|45]
>> ## Rich Markdown
>> - **Bold**, *italic*, and `inline code`.
>> - Task list:
>>   - [ ] Write spec
>>   - [x] Style columns
>> - Table:
>>   | Feature | Status |
>>   | --- | --- |
>>   | Tables | ✅ |
>>   | Images | ✅ |
>> - Link: [Obsidian](https://obsidian.md)
>> - Mermaid Diagram:
>> ```mermaid
>> graph LR
>> A[Start] --> B(Process)
>> B --> C{Decision}
>> C -->|Yes| D[Result]
>> ```
>> - LaTeX Equation:
>> $$ e^{i\pi} + 1 = 0 $$
>
>> [!col|55]
>> ## Media & Nested Blocks
>> ![Placeholder image](https://via.placeholder.com/320x120)
>> ```js
>> // Code block inside column
>> const cols = [33, 34, 33];
>> console.log('Supports code blocks', cols);
>> ```
>> > Blockquote to show nested text.
>> > Can span multiple lines without breaking layout.
>> >
>> >> [!col]
>> >> Nested callout to illustrate embedding.
