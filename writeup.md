# Typed in Words
### An Interactive Visualization of MBTI Writing Styles
**CSC316 — Assignment 3** | Data: MBTI Personality Type Dataset (Kaggle / PersonalityCafe)

---

## 1. Design Rationale

### Dataset & Question

The dataset contains aggregated writing statistics for 8,675 forum posts drawn from PersonalityCafe, broken down by MBTI personality type. Each of the 16 types has five numeric attributes: average words per post, links per post, question marks per post, writing variance, and total user count. I wanted to explore whether different MBTI types seem to communicate in measurably different ways, and if so, what those differences actually look like in the data.

### Visual Encodings

The primary view is a **bubble (scatter) chart**. Two axes encode any pair of the four writing metrics, chosen dynamically by the user. Bubble size encodes user count via a square-root scale (`d3.scaleSqrt`), which preserves area perception proportional to the underlying value rather than radius. Color encodes the four MBTI temperament groupings used in the visualization: NT (Intuitive Thinkers), NF (Intuitive Feelers), SF (Sensing Feelers), and ST (Sensing Thinkers). Type abbreviations are rendered as labels inside each bubble for direct identification without requiring a hover.

A **horizontal bar chart** below ranks all 16 types on the current X-axis metric. A **donut chart** on the right encodes community share by temperament group, and a **radar chart** appears in the detail panel on click, showing a normalized four-axis writing profile vs. the all-type average.

When a type is selected, a **character avatar** (low-poly illustrated character unique to each type) appears in the right panel and the detail card, sourced from the MBTI_Avatars open-source repository.

### Interaction Techniques

- **Dynamic query filters** — Eight highlight buttons (Introvert/Extravert, Intuitive/Sensing, Thinking/Feeling, Judging/Perceiving) apply AND-logic opacity fading. Two dropdowns swap the X and Y axes with animated transitions.
- **Brushing (multi-view coordination)** — `d3.brushX` on the bar chart selects a value range that filters scatter opacity, linking the two views.
- **Details-on-demand (tooltips)** — Hovering any bubble or bar reveals a floating tooltip with all five metrics.
- **Click to inspect** — Clicking a bubble or bar opens a full detail panel with stats, a radar chart, and the type's avatar.
- **Zoom and pan** — `d3.zoom` enables scroll-to-zoom and drag-to-pan on the scatter chart (0.5× to 10×). A Reset Zoom button appears when active. A custom filter function prevents pan from interfering with bubble clicks.
- **Donut click-filter** — Clicking a temperament slice filters the scatter and bar chart to that temperament group only.
- **Narrative story mode** — Four pre-authored insights auto-advance (▶ Play Story), each setting axis, highlight, and annotation state. Story dots allow manual navigation.
- **SVG annotations** — Contextual callout labels (e.g. "Most users (1,832)" on INFP) use teal dashed leader lines and update with zoom and metric changes.
- **Resizable right panel** — A drag handle between the chart area and the right panel lets users expand or minimize the panel to suit their screen.
- **Inline trait descriptions** — Hovering Introvert · Intuitive · Thinking · Judging in the detail card shows a plain-English description of each MBTI dimension instantly below (no OS tooltip lag).

### Design Alternatives Considered

A choropleth map was rejected as MBTI data has no geographic dimension. A stacked area chart was considered but the bubble chart better encodes two metrics simultaneously. I kept the color grouping aligned with the four temperament combinations already present in the dataset (`NF`, `NT`, `SF`, `ST`) so the legend, donut chart, and filters all use the same categories consistently. Dark background was chosen so the four saturated colors read as clear accents rather than appearing harsh.

---

## 2. Development Process

### Overview

Total development time was approximately 14–16 hours. The first session covered the bubble chart, bar chart, donut, and brush. The second session added zoom/pan, radar chart, story mode, annotations, and avatar integration. A third session refined the color system, added the resizable panel, improved text visibility, and polished the detail card interaction.

### Use of LLMs

I used Claude as a coding assistant for a few implementation steps and for debugging. The main issues still needed manual testing and revision, especially keeping zoom state stable when switching metrics, getting avatar images to render reliably, and preventing the resize handle from conflicting with D3 zoom interactions.

### What Took the Most Time

One challenge I personally struggled with was getting zoom and click to work together in a way that still felt natural. Early on, trying to inspect a bubble would sometimes turn into a pan gesture instead, so I had to spend time adjusting the event handling before the interaction felt reliable.

- **Avatar integration** — SVG files referenced inside SVG `<image>` elements are blocked by browser security policy. PNG files work directly. Diagnosing this and verifying the fix across browsers took significant time.
- **Zoom + click coexistence** — A custom `filter()` on `d3.zoom` was required to prevent mousedown on bubbles from being captured as a pan gesture.
- **Color system refinement** — I standardized the color system around the four temperament combinations already encoded in the dataset (`NF`, `NT`, `SF`, `ST`), which required updating the donut chart, legend, and filtering logic so they all used the same grouping consistently.
- **Resizable panel** — Coordinating the drag handle with D3's event system and triggering a donut redraw on release required careful ordering.

### Insights Discovered

INFP is the most common type (1,832 users — 21%), which is probably affected by self-selection on personality forums. ENTJ writes the most words on average (108.3) and also asks the most questions per post (0.240), which pushes back against the stereotype that Thinking types are always terse. A broader pattern I found more interesting is that Intuitive types tend to cluster around longer, more question-heavy writing, while Sensing types more often appear in the shorter, more link-sharing part of the chart. Writing variability also seems much less tied to any one MBTI dimension than I expected at the start.

---

## References

- **Dataset:** Mitchell, J. (2017). *MBTI Personality Type Dataset*. Kaggle / PersonalityCafe. [https://www.kaggle.com/datasets/datasnaek/mbti-type](https://www.kaggle.com/datasets/datasnaek/mbti-type)
- **Avatar Images:** Gizatullin, A. *MBTI_Avatars* (open-source character illustrations). GitHub. [https://github.com/Amirgizz/MBTI_Avatars/tree/main](https://github.com/Amirgizz/MBTI_Avatars/tree/main)
- **Inspiration:** Bostock, M. *Wealth & Health of Nations*. Observable. [https://observablehq.com/@mbostock/the-wealth-health-of-nations](https://observablehq.com/@mbostock/the-wealth-health-of-nations)
- **MBTI Framework:** Myers & Briggs Foundation. [https://www.myersbriggs.org/my-mbti-personality-type/myers-briggs-overview/](https://www.myersbriggs.org/my-mbti-personality-type/myers-briggs-overview/)
