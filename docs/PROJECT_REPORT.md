# E-Cycle — Smart E-Waste Collection, Segregation & Recycling Platform
## Formative Assessment Project Report

**Assessment Type:** Formative Assessment (FA)
**Total Marks:** 5 — Idea & Innovation: 3 | Application Demonstration: 2

---

## 1. Executive Summary

**E-Cycle** is a browser-based single-page application that simulates the complete lifecycle of electronic waste using vanilla HTML5, CSS3, and JavaScript — zero external dependencies, no backend, runs in any modern browser.

> **Tagline:** "Turn Electronic Waste into Valuable Resources."

Modules: Collection Registration → Rule-Based Segregation → Circular Economy Workflow → Economic Value Estimator → Live Analytics Dashboard → Data Management & Export.

---

## 2. Problem Statement

Electronic waste is the world's fastest-growing solid waste stream. Phones, laptops, TVs, and batteries contain valuable metals (gold, silver, copper) alongside hazardous substances (lead, mercury, cadmium). Improper disposal endangers ecosystems and human health.

| Challenge | E-Cycle Response |
|-----------|-----------------|
| No collection tracking | Registration form + unique IDs + LocalStorage |
| Improper segregation | Rule-based triage engine (6 pathways) |
| Unknown circular options | Circular Economy Workflow + Journey Tracker |
| Hidden material value | Economic Value Estimator (INR/kg rates) |
| Missing data | Analytics Dashboard + Export/Import |

---

## 3. Project Objectives

1. Build a functional SPA modeling the complete e-waste lifecycle.
2. Implement a deterministic rule-based segregation engine.
3. Demonstrate circular economy pathway assignment per item.
4. Provide transparent economic valuation in Indian Rupees.
5. Implement persistent data management with export/import.
6. Ensure WCAG 2.1 AA accessibility and full mobile responsiveness.
7. Achieve all objectives with zero external dependencies.

---

## 4. Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 Semantic (header, nav, section, article, footer) |
| Styling | Vanilla CSS3 — Grid, Flexbox, Custom Properties |
| Logic | Vanilla JavaScript ES6+ — IIFE namespace pattern |
| Storage | Browser localStorage API with JSON serialization |
| Typography | Google Fonts — Inter (400/500/600/700) |
| Icons | Inline SVG vectors |

### File Structure

```
e-cycle/
├── index.html              ← SPA; 14 semantic sections
├── css/
│   ├── styles.css          ← Design tokens; typography; layout
│   └── components.css      ← Module-specific component styles
├── js/
│   ├── storage.js          ← Central data layer; CRUD; events; import/export
│   ├── collection.js       ← Registration form; ID generation; records table
│   ├── segregation.js      ← Rule-based classification; modal UI
│   ├── circular.js         ← Lifecycle workflow; journey tracker
│   ├── estimator.js        ← Value calculation; rate editor; chart
│   ├── dashboard.js        ← KPI cards; charts; global filters
│   └── app.js              ← Navigation; scroll; animations; mobile menu
└── docs/                   ← FA documentation
```

### Cross-Module Reactivity

`storage.js` dispatches a custom `ecycle:datachanged` DOM event when records change. All other modules listen and refresh independently — eliminating direct module-to-module coupling.

### Data Model (per item)

```json
{
  "id": "EW-20261019-AB1C2D",
  "timestamp": "2026-10-19T15:30:00.000Z",
  "deviceType": "Mobile Phones & Tablets",
  "deviceName": "Samsung Galaxy S10",
  "quantity": 2,
  "weight": 0.35,
  "condition": "Functional",
  "collectionPreference": "Drop-off at Centre",
  "notes": "Screen cracked on one unit",
  "status": "pending"
}
```

---

## 5. Feature Modules

### Module 1: E-Waste Collection Registration (#register)

- 8 device categories; Quantity 1–500; Weight 0.01–9999 kg.
- 5 condition options; 3 collection preference options.
- Notes field with live character counter (max 500 chars).
- Inline field-level validation and error messages.
- Unique ID: EW-YYYYMMDD-XXXXXX generated on submit.
- Records persisted in localStorage key `ecycle_collection_records`.

### Module 2: Smart E-Waste Segregation Engine (#segregation)

Classification priority order:

```
1. SPECIAL_HANDLING     → damaged/swollen/leaking batteries; mercury; chemicals
2. MANUAL_REVIEW        → Unknown condition; insufficient data
3. REUSE                → Functional; category supports direct reuse
4. REPAIR               → Minor issues; device type has repair ecosystem
5. REFURBISH            → Major issues; device supports refurbishment
6. AUTHORIZED_RECYCLING → Broken/damaged; no viable reuse pathway
```

Real-time search, multi-attribute filters, colour-coded badges, accessible modal with full details and safety warnings.

### Module 3: Circular Economy Workflow (#circular-economy)

- Interactive lifecycle diagram: Product → Use → Collection → Assessment → 4 Pathways.
- Item Journey Tracker — 4-stage visual progression per selected registered item:
  Stage 1: Registered | Stage 2: Classified | Stage 3: Recommended Pathway | Stage 4: Future Action
- Linear Economy vs. Circular Economy comparison.

### Module 4: Economic Value Estimator (#estimator)

- Item weight × configurable illustrative INR/kg rates = gross recovery value.
- Rate Editor: validate (INR 1–99,999) and persist all 8 category rates in localStorage.
- Horizontal category-wise bar chart; item-level valuation table.
- Indian Rupee formatting via `Intl.NumberFormat('en-IN')`.
- Prominent educational disclaimer.

### Module 5: Live Analytics Dashboard (#dashboard)

- 6 KPI Cards: Items, Weight (kg), Awaiting Triage, Reuse+Repair, Recycling+Hazard, Recovery Value.
- Global Filter Bar: search + category + condition + pathway (all synchronized).
- Category and Pathway distribution progress charts.
- Recent 5 registrations feed; quick action toolbar.

### Module 6: Data Management (#records-section)

- Full records table + search; mobile-responsive card view.
- Deletion with confirmation dialog.
- Export: JSON download (`ecycle-records-YYYY-MM-DD.json`).
- Import: validates structure, prevents ID duplicates, reports results.

---

## 6. Design System

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | #1B4332 | Dark forest green; brand; navbar |
| Primary Mid | #2D6A4F | Secondary emphasis |
| Accent | #40916C | Interactive elements; badges |
| Accent Light | #52B788 | Hover states |
| Background | #F8FAF9 | Page background |
| Warning | #B45309 | Special handling alerts |
| Danger | #B91C1C | Error states |

### Typography
Inter (Google Fonts) — 400/500/600/700. Scale: xs (0.75rem) to 4xl (2.5rem).

### Breakpoints
Mobile < 640px | Tablet ≥ 640px | Desktop ≥ 1024px | Wide ≥ 1280px

---

## 7. Accessibility (WCAG 2.1 AA)

| Feature | Implementation |
|---------|---------------|
| Semantic HTML | header, nav, main, section, article, footer |
| Heading hierarchy | Single h1 in hero; correct h2–h4 nesting |
| ARIA | roles, aria-label, aria-expanded, aria-controls, role=dialog, aria-modal |
| Keyboard access | Full Tab traversal; focus trap in modals; Escape closes |
| Colour contrast | ≥ 4.5:1 on all body text |
| Focus indicators | Visible :focus-visible rings |
| Motion | prefers-reduced-motion disables animations |

---

## 8. Testing

### Automated (Node.js)

`test_step4_segregation.js` — 25 regression tests covering all 6 classification pathways.

`test_suite_all.js` — Multi-module: storage CRUD, import/export, estimator accuracy, dashboard aggregation.

### Manual QA (all verified)

- Valid registration → record in all modules
- Invalid data → inline errors; no record saved
- Delete → removed from all views
- Export → valid JSON downloaded
- Import valid JSON → merged; duplicates skipped
- Import invalid JSON → error shown; no corruption
- Rate changes → persisted after page reload
- Mobile menu, modals, keyboard nav — all functional

---

## 9. Results

1. Complete e-waste lifecycle model in a single browser application.
2. Working rule-based classification — auditable, transparent, deterministic.
3. Real circular economy education through interactive visualization.
4. Transparent economic incentive modeling via value estimator.
5. Zero-dependency, zero-backend — runs in any modern browser offline.

---

## 10. Limitations & Future Scope

| Limitation | Proposed Enhancement |
|------------|---------------------|
| Browser-only data | Backend DB or Firebase cloud sync |
| Illustrative rates | Real-time commodity price API |
| Rule-based only | TensorFlow.js image recognition |
| No logistics | QR code labels; GPS truck tracking |
| Single-user | Multi-user accounts; org dashboards |
| No regulatory data | E-Waste Rules 2022 compliance check |

---

## 11. Conclusion

E-Cycle demonstrates that meaningful e-waste management awareness begins with transparent, accessible software. The platform achieves every stated objective — registering, classifying, routing, valuing, and auditing e-waste — entirely in the browser, with clean modular code and full accessibility.

---

## 12. References

1. Global E-waste Statistics Partnership. *Global E-waste Monitor 2024.* UNU, 2024.
2. MoEFCC, Govt. of India. *E-Waste Management Rules, 2022.*
3. Ellen MacArthur Foundation. *Towards the Circular Economy.* 2013.
4. CPCB India. *Guidelines for Environmentally Sound Management of E-Waste.* 2020.
5. WHO. *Children and Digital Dumpsites: E-waste Exposure and Child Health.* 2021.
6. ITU. *The Global E-waste Monitor.* 2020.
7. Baldé et al. *E-waste Statistics: Guidelines on Classification.* UNU, 2015.

---
*E-Cycle | HTML5 · CSS3 · JavaScript ES6+ | Client-side only | Zero dependencies*
