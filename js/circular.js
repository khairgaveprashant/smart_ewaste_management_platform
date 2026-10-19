/**
 * E-Cycle — circular.js
 * Circular Economy Workflow & Item Journey Tracker.
 * Manages interactive lifecycle diagram, real-record journey tracking,
 * 4-stage workflow states, and pathway information panels.
 */

(function (window) {
    'use strict';

    // ── PATHWAY DATA DICTIONARY ──
    const PATHWAYS_INFO = {
        REUSE: {
            id: 'REUSE',
            badge: 'Priority 1 • Direct Reuse',
            title: 'Keep Useful Electronics in Use',
            explanation: 'Working electronics may continue to serve their current owner or another user, provided the item is suitable for reuse.',
            actions: [
                'Continue using the item if it still fulfills your requirements.',
                'Consider responsible donation to schools, charities, or community centers.',
                'Explore an appropriate secondary reuse or resale channel.'
            ],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h14"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3"/></svg>`,
            colorClass: 'pathway-reuse'
        },
        REPAIR: {
            id: 'REPAIR',
            badge: 'Priority 2 • Technical Repair',
            title: 'Extend Product Life Through Repair',
            explanation: 'Repairable electronics may be assessed and restored by a qualified service provider.',
            actions: [
                'Arrange a qualified technical assessment to diagnose specific component issues.',
                'Determine whether modular repair or part replacement is practical and cost-effective.',
                'Consider professional repair before choosing disposal or replacement.'
            ],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            colorClass: 'pathway-repair'
        },
        REFURBISH: {
            id: 'REFURBISH',
            badge: 'Priority 3 • Inspection & Renewal',
            title: 'Restore Eligible Electronics',
            explanation: 'Some devices may be inspected, repaired, tested, and prepared for further use through an appropriate refurbishment process.',
            actions: [
                'Undergo professional inspection and component-level diagnostic review.',
                'Conduct suitable repairs, replacement of worn consumables, and data wiping.',
                'Perform appropriate functional testing and certification for secondary use.'
            ],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
            colorClass: 'pathway-refurbish'
        },
        AUTHORIZED_RECYCLING: {
            id: 'AUTHORIZED_RECYCLING',
            badge: 'Priority 4 • Material Recovery',
            title: 'Recover Valuable Materials Responsibly',
            explanation: 'Electronics that cannot reasonably be reused or repaired should be directed to an appropriate authorized e-waste recycling channel.',
            actions: [
                'Identify an appropriate authorized collection channel or certified recycler.',
                'Follow applicable handling instructions for intact electrical scrap.',
                'Support suitable material recovery to reclaim copper, gold, aluminum, and plastics.'
            ],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
            colorClass: 'pathway-recycling'
        },
        SPECIAL_HANDLING: {
            id: 'SPECIAL_HANDLING',
            badge: 'Critical Safety Stream',
            title: 'Handle Safety-Sensitive Items Separately',
            explanation: 'Certain items, particularly batteries and hazardous components, require separate collection and specialized handling.',
            actions: [
                'Keep the item separate from general e-waste to avoid short circuits or thermal runaway.',
                'Follow appropriate safety guidance: tape exposed battery terminals with non-conductive tape.',
                'Use a suitable authorized hazardous collection channel or municipal battery depot.'
            ],
            warning: 'Never dismantle, puncture, crush, open, incinerate, or personally repair batteries.',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            colorClass: 'pathway-hazard'
        },
        MANUAL_REVIEW: {
            id: 'MANUAL_REVIEW',
            badge: 'Verification Required',
            title: 'Assessment Needed',
            explanation: 'The recorded information is insufficient to recommend a confident next step.',
            actions: [
                'Review the item details to ensure condition and category are accurately recorded.',
                'Confirm the operational status and physical integrity of the equipment.',
                'Seek an appropriate qualified technical assessment before making a final decision.'
            ],
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
            colorClass: 'pathway-review'
        }
    };

    // State
    let selectedRecordId = null;
    let activePreviewPathway = 'REUSE';

    // ── INITIALIZATION ──
    function initCircularModule() {
        populateItemSelector();
        setupDiagramInteractions();
        setupEventListeners();
        renderActivePathwayPanel(activePreviewPathway);

        // Listen for storage events across modules
        window.addEventListener('ecycle:datachanged', function () {
            populateItemSelector();
            if (selectedRecordId) {
                renderSelectedItemJourney(selectedRecordId);
            }
        });
    }

    // ── ITEM SELECTOR POPULATION ──
    function populateItemSelector() {
        const selectEl = document.getElementById('ceItemSelect');
        const searchInput = document.getElementById('ceItemSearch');
        const emptyState = document.getElementById('ceJourneyEmpty');
        const detailPanel = document.getElementById('ceJourneyContent');

        if (!selectEl) return;

        const records = window.ECycleStorage ? window.ECycleStorage.getRecords() : [];

        if (records.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (detailPanel) detailPanel.style.display = 'none';
            selectEl.innerHTML = '<option value="">No registered items found</option>';
            selectEl.disabled = true;
            if (searchInput) searchInput.disabled = true;
            selectedRecordId = null;
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (detailPanel) detailPanel.style.display = 'block';
        selectEl.disabled = false;
        if (searchInput) searchInput.disabled = false;

        const currentTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const matchingRecords = records.filter(function (r) {
            if (!currentTerm) return true;
            return (r.id && r.id.toLowerCase().includes(currentTerm)) ||
                   (r.itemName && r.itemName.toLowerCase().includes(currentTerm)) ||
                   (r.category && r.category.toLowerCase().includes(currentTerm));
        });

        selectEl.innerHTML = '';

        if (matchingRecords.length === 0) {
            selectEl.innerHTML = '<option value="">No items match search</option>';
            return;
        }

        matchingRecords.forEach(function (rec) {
            const opt = document.createElement('option');
            opt.value = rec.id;
            opt.textContent = `${rec.id} — ${rec.itemName} (${rec.category})`;
            if (rec.id === selectedRecordId) {
                opt.selected = true;
            }
            selectEl.appendChild(opt);
        });

        // Auto select first record if none selected or selected was removed
        const exists = matchingRecords.some(function (r) { return r.id === selectedRecordId; });
        if (!exists && matchingRecords.length > 0) {
            selectedRecordId = matchingRecords[0].id;
            selectEl.value = selectedRecordId;
        }

        if (selectedRecordId) {
            renderSelectedItemJourney(selectedRecordId);
        }
    }

    // ── RENDER SELECTED ITEM JOURNEY ──
    function renderSelectedItemJourney(recordId) {
        if (!recordId || !window.ECycleStorage) return;
        const rec = window.ECycleStorage.getRecordById(recordId);
        if (!rec) return;

        selectedRecordId = recordId;

        // Ensure record has classification result
        let classification = rec.classification;
        if (!classification && window.classifyEWaste) {
            classification = window.classifyEWaste(rec);
            rec.classification = classification;
            rec.recommendedPathway = classification.recommendedPathway;
            window.ECycleStorage.updateRecord(rec);
        }

        const pathwayKey = (rec.recommendedPathway || (classification && classification.recommendedPathway) || 'MANUAL_REVIEW').toUpperCase();
        const pathwayData = PATHWAYS_INFO[pathwayKey] || PATHWAYS_INFO.MANUAL_REVIEW;

        // Basic Info Fields (safe textContent assignment)
        setSafeText('ceItemId', rec.id);
        setSafeText('ceItemName', rec.itemName);
        setSafeText('ceItemCategory', rec.category);
        setSafeText('ceItemCondition', rec.condition);
        setSafeText('ceItemWeight', `${Number(rec.weightKg).toFixed(2)} kg`);
        setSafeText('ceItemStatus', rec.status || 'Registered');

        // Condition Badge class
        const condBadge = document.getElementById('ceItemConditionBadge');
        if (condBadge) {
            condBadge.textContent = rec.condition;
            condBadge.className = 'badge ' + getConditionBadgeClass(rec.condition);
        }

        // Recommended Pathway Badge & Reason
        const recBadge = document.getElementById('ceItemPathwayBadge');
        if (recBadge) {
            recBadge.textContent = pathwayData.badge;
            recBadge.className = 'pathway-pill ' + pathwayData.colorClass;
        }

        const recTitle = document.getElementById('ceItemRecTitle');
        if (recTitle) {
            recTitle.textContent = (classification && classification.recommendationTitle) || pathwayData.title;
        }

        const recReason = document.getElementById('ceItemRecReason');
        if (recReason) {
            recReason.textContent = (classification && classification.recommendationReason) || pathwayData.explanation;
        }

        // Safety Warning guidance
        const safetyBox = document.getElementById('ceItemSafetyBox');
        const safetyText = document.getElementById('ceItemSafetyText');
        const warning = (classification && classification.safetyWarning) || pathwayData.warning;

        if (safetyBox && safetyText) {
            if (warning) {
                safetyText.textContent = warning;
                safetyBox.style.display = 'flex';
            } else {
                safetyBox.style.display = 'none';
            }
        }

        // 4-Stage Workflow Display
        renderWorkflowStages(rec, pathwayData);

        // Automatically update the pathway information panel to match item's recommended pathway
        renderActivePathwayPanel(pathwayKey);
    }

    // ── 4 WORKFLOW STAGES DISPLAY ──
    function renderWorkflowStages(record, pathwayData) {
        // Stage 1: Registered
        const stage1Date = record.createdAt ? formatDate(record.createdAt) : 'Recorded';
        setSafeText('ceStage1Status', 'Completed');
        setSafeText('ceStage1Meta', `Registered on ${stage1Date}`);

        // Stage 2: Classified
        setSafeText('ceStage2Status', 'Completed');
        setSafeText('ceStage2Meta', `Evaluated category & condition (${record.condition})`);

        // Stage 3: Recommended Pathway
        setSafeText('ceStage3Status', 'Recommendation Generated');
        setSafeText('ceStage3Meta', `Suggested: ${pathwayData.title}`);

        // Stage 4: Future Action (explicitly NOT completed, real-world action)
        setSafeText('ceStage4Status', 'Awaiting Real-World Action');
        setSafeText('ceStage4Meta', `Suggested next action: Contact authorized facility or recycler. Physical collection/processing is not verified by this prototype.`);
    }

    // ── PATHWAY INFORMATION PANEL ──
    function renderActivePathwayPanel(pathwayKey) {
        activePreviewPathway = pathwayKey;
        const data = PATHWAYS_INFO[pathwayKey] || PATHWAYS_INFO.REUSE;

        const panel = document.getElementById('cePathwayInfoPanel');
        if (!panel) return;

        // Update active classes on diagram nodes and pathway switcher buttons
        document.querySelectorAll('.ce-pathway-btn, .ce-node-btn').forEach(function (btn) {
            const btnKey = btn.getAttribute('data-pathway-key');
            if (btnKey === pathwayKey) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });

        // Panel contents
        const badgeEl = panel.querySelector('.ce-panel-badge');
        const titleEl = panel.querySelector('.ce-panel-title');
        const descEl = panel.querySelector('.ce-panel-desc');
        const listEl = panel.querySelector('.ce-panel-actions-list');
        const alertEl = panel.querySelector('.ce-panel-safety-alert');

        if (badgeEl) {
            badgeEl.textContent = data.badge;
            badgeEl.className = 'ce-panel-badge ' + data.colorClass;
        }
        if (titleEl) titleEl.textContent = data.title;
        if (descEl) descEl.textContent = data.explanation;

        if (listEl) {
            listEl.innerHTML = '';
            data.actions.forEach(function (actionText) {
                const li = document.createElement('li');
                li.className = 'ce-action-item';
                li.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-check-icon" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>${escapeHTML(actionText)}</span>
                `;
                listEl.appendChild(li);
            });
        }

        if (alertEl) {
            if (data.warning) {
                alertEl.style.display = 'flex';
                const alertText = alertEl.querySelector('.alert-text');
                if (alertText) alertText.textContent = data.warning;
            } else {
                alertEl.style.display = 'none';
            }
        }
    }

    // ── DIAGRAM & CONTROL INTERACTIONS ──
    function setupDiagramInteractions() {
        // Pathway preview buttons
        document.querySelectorAll('.ce-pathway-btn, .ce-node-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const key = this.getAttribute('data-pathway-key');
                if (key && PATHWAYS_INFO[key]) {
                    renderActivePathwayPanel(key);
                }
            });
        });
    }

    function setupEventListeners() {
        const selectEl = document.getElementById('ceItemSelect');
        const searchInput = document.getElementById('ceItemSearch');

        if (selectEl) {
            selectEl.addEventListener('change', function () {
                renderSelectedItemJourney(this.value);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', debounce(function () {
                populateItemSelector();
            }, 200));
        }
    }

    // ── HELPERS ──
    function setSafeText(elemId, text) {
        const el = document.getElementById(elemId);
        if (el) el.textContent = text || '-';
    }

    function getConditionBadgeClass(condition) {
        switch (condition) {
            case 'Working': return 'badge-success';
            case 'Repairable': return 'badge-warning';
            case 'Damaged / Non-working': return 'badge-error';
            default: return 'badge-info';
        }
    }

    function formatDate(isoStr) {
        try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return 'Recently';
            return d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Recently';
        }
    }

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(context, args);
            }, wait);
        };
    }

    // Public API
    window.ECycleCircular = {
        init: initCircularModule,
        refresh: populateItemSelector,
        selectItem: renderSelectedItemJourney,
        setPathwayPreview: renderActivePathwayPanel,
        getPathwaysData: function () { return PATHWAYS_INFO; }
    };

    // Auto-init on DOM load
    document.addEventListener('DOMContentLoaded', initCircularModule);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initCircularModule();
    }

})(window);
