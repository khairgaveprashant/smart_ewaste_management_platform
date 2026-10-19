# E-Cycle — Smart E-Waste Collection, Segregation & Recycling Platform

> **"Turn Electronic Waste into Valuable Resources."**

E-Cycle is a comprehensive, client-side sustainability web platform engineered for a college **Formative Assessment project on E-Waste Management** (Evaluation: 5 Marks — Idea & Innovation: 3 Marks, Application Demonstration: 2 Marks).

The platform models the complete lifecycle of electronic waste: intake registration, unique tracking IDs, rule-based algorithmic segregation, circular economy journey mapping, economic recovery valuation in Indian Rupees (₹/kg), real-time analytics KPIs, and browser-persisted audit trails.

---

## 🌟 Key Application Modules

1. **E-Waste Collection Registration (`#register`)**
   - User intake form with client-side validation across 8 e-waste categories.
   - Deterministic unique ID generation (`EW-YYYYMMDD-XXXXXX`).
   - Weight, quantity, condition, and collection preference recording.
   - Persistence in `localStorage` (`ecycle_collection_records`).

2. **Smart E-Waste Segregation Engine (`#segregation`)**
   - Deterministic rule-based classification triage engine (`js/segregation.js`).
   - Categorizes items into 6 distinct circular pathways: `REUSE`, `REPAIR`, `REFURBISH`, `AUTHORIZED_RECYCLING`, `SPECIAL_HANDLING`, and `MANUAL_REVIEW`.
   - **Safety-First Priority**: Special handling protocols take absolute priority for damaged, swollen, or leaking batteries and chemical contaminants.
   - Real-time search and multi-attribute filters.
   - Accessible modal details with WCAG focus management.

3. **Circular Economy Workflow & Journey Tracker (`#circular-economy`)**
   - Interactive lifecycle diagram: `Product → Use → Collection → Assessment → Condition Decision → [Reuse, Repair, Refurbish, Recycle]`.
   - **Explore an Item's Journey**: Select any registered item from actual session records to visualize its 4-stage progression (`Stage 1: Registered`, `Stage 2: Classified`, `Stage 3: Recommended Pathway`, `Stage 4: Future Action [Awaiting real-world action - Suggested Next Action]`).
   - Dynamic pathway information panels displaying recommended actions and safety warnings.
   - Environmental benefits cards and comparative Linear vs. Circular economy models.

4. **E-Waste Economic Value Estimator (`#estimator`)**
   - Calculates potential gross recovery value using recorded item weights and configurable illustrative category rates (₹/kg).
   - Formatted using Indian Currency locale (`Intl.NumberFormat('en-IN')`).
   - Category-wise horizontal breakdown bar chart and item-level valuation matrix.
   - Configurable rate editor with input validation and persistence (`ecycle_rates`).
   - Educational disclosure: transparent mathematical estimate, not a guaranteed recycler payout or market quote.

5. **Live Analytics Dashboard (`#dashboard`)**
   - 6 Real-time KPI Cards: Registered Items, Total Recorded Weight (kg), Awaiting Triage, Reuse & Repair, Recycling & Hazard, Estimated Gross Recovery Value.
   - Synchronized global filter bar (Search, Category, Condition, Pathway).
   - Category and Pathway distribution progress charts with textual summaries.
   - Honest collection status distribution tracking.
   - Recent registrations feed and quick actions toolbar.

6. **Central Data Management & Audit Registry (`#records-section`)**
   - Unified collection records registry with tabular and mobile card views.
   - Record deletion with confirmation dialog.
   - **Data Export**: Downloads valid session records as a structured JSON file (`ecycle-records-YYYY-MM-DD.json`).
   - **Data Import**: Validates JSON file structure, prevents duplicate ID collision, and merges records into storage.

---

## 🛠️ Technology Stack

- **Markup**: HTML5 (Semantic elements, ARIA attributes, single `h1`, accessible heading hierarchy).
- **Styling**: Vanilla CSS3 (Custom design system tokens, responsive mobile-first grid/flexbox, dark emerald/forest green sustainability palette, no CSS frameworks).
- **Logic**: Vanilla JavaScript (ES6+, modular architecture, IIFE namespaces, zero external dependencies).
- **Storage**: Browser LocalStorage (`ecycle_collection_records`, `ecycle_rates`) with in-memory fallbacks and event-based cross-module reactivity (`ecycle:datachanged`).
- **Icons & Graphics**: Pure scalable SVG vectors.

---

## 📂 Project Structure

```text
e-cycle/
├── index.html                   # Complete single-page application structure
├── css/
│   ├── styles.css               # Core design tokens, typography, and base layout
│   └── components.css           # Modular component styling, cards, diagrams, tables
├── js/
│   ├── storage.js               # Central LocalStorage manager, rate persistence, import/export
│   ├── collection.js            # Registration form validation, ID generation, records table
│   ├── segregation.js           # Rule-based classification engine and modal details
│   ├── circular.js              # Circular economy lifecycle, journey tracker, pathway switcher
│   ├── estimator.js             # Economic value calculation, rate editor, category breakdown
│   ├── dashboard.js             # Live analytics KPIs, distribution charts, global filters
│   └── app.js                   # Mobile navigation, smooth scrolling, scroll observer
├── docs/
│   ├── PROJECT_REPORT.md        # Comprehensive FA academic report
│   ├── PRESENTATION_OUTLINE.md  # 8-Slide presentation deck outline with speaker notes
│   ├── DEMO_SCRIPT.md           # 3-4 minute live demonstration walkthrough script
│   └── VIVA_QUESTIONS.md        # 25 Viva voce questions and detailed answers
├── test_step4_segregation.js    # Automated test suite for Step 4 classification
└── test_suite_all.js            # Comprehensive automated test suite for Steps 5-9
```

---

## 🚀 How to Run the Website Locally

Since E-Cycle is built using standards-compliant vanilla web technologies, no heavy build tools, Node servers, or package installations are strictly required to view the application:

### Method 1: Local HTTP Server (Recommended)

Using Python (built into macOS, Linux, and Windows Developer tools):

```bash
# Navigate to the project directory
cd e-cycle

# Start a local static server on port 8080
python -m http.server 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

### Method 2: Direct Browser Launch

Double-click `index.html` or drag and drop it into any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).

---

## 🧪 Automated Testing

Run the automated test suites using Node.js:

```bash
# Run complete test suite (Steps 5 to 9)
node test_suite_all.js

# Run classification regression suite
node test_step4_segregation.js
```

---

## 👥 Group Contribution Details (Template)

| Member Name | Roll Number | Role / Responsibility | Key Contributions |
| :--- | :--- | :--- | :--- |
| **[Student 1 Name]** | `[Roll Number]` | Frontend Architecture & Collection | Design system, HTML structure, collection form validation, unique ID generation. |
| **[Student 2 Name]** | `[Roll Number]` | Segregation Engine & Circular Flow | Rule-based triage engine, battery safety protocols, circular lifecycle diagram. |
| **[Student 3 Name]** | `[Roll Number]` | Valuation & Analytics Dashboard | Economic calculation logic, rate configuration editor, KPI cards, distribution charts. |
| **[Student 4 Name]** | `[Roll Number]` | Data Management, QA & Documentation | LocalStorage persistence, import/export handling, test suite creation, project report. |

---

## ⚠️ Academic Prototype Disclaimers

1. **Educational Simulation**: E-Cycle is an academic software prototype developed for educational assessment. It does not interface with physical collection trucks, recycler IoT hardware, or municipal weighbridges.
2. **Rule-Based Triage**: The classification engine applies deterministic environmental heuristics and safety rules. It does not use neural networks or cloud computer-vision APIs.
3. **Illustrative Valuation**: Recovery value calculations reflect configurable demonstration unit rates (₹/kg). They do not represent guaranteed real-time market prices, recycler buyback offers, or net profits.
