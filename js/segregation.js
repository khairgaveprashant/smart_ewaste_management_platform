/**
 * E-Cycle — segregation.js
 * Smart E-Waste Segregation Engine.
 * Rule-based classification, pathway determination, safety assessment,
 * summary metrics, filtering, and accessible modal details.
 */

(function (window) {
    'use strict';

    // ── PATHWAY CONSTANTS ──
    const PATHWAYS = {
        REUSE: 'REUSE',
        REPAIR: 'REPAIR',
        REFURBISH: 'REFURBISH',
        AUTHORIZED_RECYCLING: 'AUTHORIZED_RECYCLING',
        SPECIAL_HANDLING: 'SPECIAL_HANDLING',
        MANUAL_REVIEW: 'MANUAL_REVIEW'
    };

    /**
     * Rule-Based Classification Engine for E-Waste Items
     * Evaluates item category, reported condition, and safety attributes.
     * 
     * @param {Object} record - Collection record
     * @returns {Object} Structured classification result
     */
    function classifyEWaste(record) {
        if (!record || typeof record !== 'object') {
            return {
                classificationCategory: 'Unknown',
                recommendedPathway: PATHWAYS.MANUAL_REVIEW,
                recommendationTitle: 'Manual Triage Required',
                recommendationReason: 'Record data is missing or invalid.',
                safetyWarning: 'Exercise caution handling unverified items.',
                classificationStatus: 'Pending Review'
            };
        }

        const category = (record.category || '').trim();
        const condition = (record.condition || '').trim();
        const itemName = (record.itemName || '').toLowerCase();
        const notes = (record.notes || '').toLowerCase();

        // ── RULE 1: DETECT BATTERIES (Highest Priority) ──
        const isBatteryCategory = category === 'Batteries';
        const hasBatteryKeywords = /battery|batteries|li-ion|lithium-ion|lipo|lead-acid/i.test(itemName) ||
                                  /battery|batteries|li-ion|lithium-ion|lipo|lead-acid/i.test(notes);

        if (isBatteryCategory || hasBatteryKeywords) {
            const hasDamageClues = condition === 'Damaged / Non-working' ||
                                  /damage|swollen|leak|cracked|hot|smoke|punctur|burst|bloat/i.test(notes);

            if (hasDamageClues) {
                return {
                    classificationCategory: 'Battery Hazard',
                    recommendedPathway: PATHWAYS.SPECIAL_HANDLING,
                    recommendationTitle: 'Special Handling — Hazardous Battery',
                    recommendationReason: 'Physical damage or swelling in electrochemical cells poses immediate fire and chemical runaway risks.',
                    safetyWarning: 'Damaged, swollen, leaking, or unusually hot batteries require particular caution. Never dismantle, puncture, crush, open, or personally repair batteries. Store in an isolated, cool, non-flammable area and deliver directly to an authorized battery collection facility. Do not discard with ordinary waste.',
                    classificationStatus: 'Special Handling Required'
                };
            }

            return {
                classificationCategory: 'Battery Stream',
                recommendedPathway: PATHWAYS.SPECIAL_HANDLING,
                recommendationTitle: 'Special Handling — Battery Collection',
                recommendationReason: 'Batteries contain heavy metals and concentrated chemical components requiring dedicated authorized recovery channels rather than general shredding.',
                safetyWarning: 'Keep batteries separate from general e-waste and use an appropriate authorized collection or recycling channel. Tape electrical terminals with non-conductive tape and do not crush or open.',
                classificationStatus: 'Special Handling Required'
            };
        }

        // ── RULE 2: DETECT CRITICAL CHEMICAL / HAZARDOUS NOTES ──
        if (/mercury|asbestos|acid leak|toxic chemical|burnt component|smoke/i.test(notes)) {
            return {
                classificationCategory: 'Environmental Hazard',
                recommendedPathway: PATHWAYS.SPECIAL_HANDLING,
                recommendationTitle: 'Special Handling Required',
                recommendationReason: 'Item notes indicate hazardous or toxic chemical exposure requiring specialized environmental depollution.',
                safetyWarning: 'Handle with chemical-resistant gloves. Avoid inhaling fumes or touching residue. Deliver to an authorized hazardous waste facility.',
                classificationStatus: 'Special Handling Required'
            };
        }

        // ── RULE 3: WORKING ELECTRONICS ──
        if (condition === 'Working') {
            return {
                classificationCategory: category || 'General Electronics',
                recommendedPathway: PATHWAYS.REUSE,
                recommendationTitle: 'Direct Reuse & Life Extension',
                recommendationReason: 'Working electronics retain functional utility. Continued use, donation, or secondary reuse extends product lifecycle and preserves raw materials without energy-intensive reprocessing.',
                safetyWarning: null,
                classificationStatus: 'Classified'
            };
        }

        // ── RULE 4: REPAIRABLE ELECTRONICS & REFURBISHMENT ──
        if (condition === 'Repairable') {
            // Check if eligible for standardized refurbishment
            if (/refurbish|recondition|cosmetic only|minor scratch|data wipe/i.test(notes) &&
                (category === 'Computers and Laptops' || category === 'Mobile Phones')) {
                return {
                    classificationCategory: category,
                    recommendedPathway: PATHWAYS.REFURBISH,
                    recommendationTitle: 'Standardized Refurbishment',
                    recommendationReason: 'Eligible electronics may be inspected, wiped, and restored before reuse. Reconditioning provides reliable second-life deployment.',
                    safetyWarning: 'Ensure personal data is securely erased before transferring device.',
                    classificationStatus: 'Classified'
                };
            }

            return {
                classificationCategory: category || 'General Electronics',
                recommendedPathway: PATHWAYS.REPAIR,
                recommendationTitle: 'Qualified Technical Repair',
                recommendationReason: 'Consider assessment and repair by a qualified service provider. Targeted repair restores operational capacity, keeping components in circular service.',
                safetyWarning: 'Do not attempt dangerous high-voltage internal disassembly or uncertified electrical modifications personally.',
                classificationStatus: 'Classified'
            };
        }

        // ── RULE 5: DAMAGED OR NON-WORKING ELECTRONICS ──
        if (condition === 'Damaged / Non-working') {
            return {
                classificationCategory: category || 'General Electronics',
                recommendedPathway: PATHWAYS.AUTHORIZED_RECYCLING,
                recommendationTitle: 'Authorized Recycling & Material Recovery',
                recommendationReason: 'Damaged or inoperable electronics that cannot be reasonably reused or repaired should be sent through certified authorized recycling channels for safe depollution and secondary material recovery.',
                safetyWarning: 'Damaged electronics should not be discarded with ordinary household waste. Handle broken glass and exposed circuits with care.',
                classificationStatus: 'Classified'
            };
        }

        // ── RULE 6: UNKNOWN OR AMBIGUOUS CONDITION ──
        return {
            classificationCategory: category || 'General Electronics',
            recommendedPathway: PATHWAYS.MANUAL_REVIEW,
            recommendationTitle: 'Manual Triage & Technical Review',
            recommendationReason: 'Condition is reported as Unknown. Inspect the item’s condition through an appropriate qualified service or collection channel before determining its next step.',
            safetyWarning: 'Do not connect untested devices with unknown electrical integrity to power.',
            classificationStatus: 'Pending Review'
        };
    }

    // ── AUTOMATIC SYNCHRONIZATION ──
    /**
     * Process all stored records to ensure each has a deterministic classification
     */
    function syncClassifications() {
        if (!window.ECycleStorage) return;
        const records = window.ECycleStorage.getRecords();
        let updatedCount = 0;

        records.forEach(function (rec) {
            // If pathway is missing or unclassified, evaluate deterministically
            if (!rec.recommendedPathway || !rec.classification) {
                const res = classifyEWaste(rec);
                rec.recommendedPathway = res.recommendedPathway;
                rec.classification = res;
                rec.classifiedAt = rec.classifiedAt || new Date().toISOString();
                window.ECycleStorage.updateRecord(rec);
                updatedCount++;
            }
        });

        return updatedCount;
    }

    // ── UI CONTROLLER ──
    let lastActiveTriggerElement = null;

    function initSegregationUI() {
        const segContainer = document.getElementById('segregationContainer');
        if (!segContainer) return;

        // Auto-classify any pending records from storage
        syncClassifications();

        // Bind search & filter inputs
        const searchInput = document.getElementById('segSearch');
        const catFilter   = document.getElementById('segCategoryFilter');
        const condFilter  = document.getElementById('segConditionFilter');
        const pathFilter  = document.getElementById('segPathwayFilter');
        const statusFilter= document.getElementById('segStatusFilter');
        const resetBtn    = document.getElementById('segResetFiltersBtn');

        if (searchInput) searchInput.addEventListener('input', debounce(renderSegregationView, 200));
        if (catFilter) catFilter.addEventListener('change', renderSegregationView);
        if (condFilter) condFilter.addEventListener('change', renderSegregationView);
        if (pathFilter) pathFilter.addEventListener('change', renderSegregationView);
        if (statusFilter) statusFilter.addEventListener('change', renderSegregationView);

        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (searchInput) searchInput.value = '';
                if (catFilter) catFilter.value = '';
                if (condFilter) condFilter.value = '';
                if (pathFilter) pathFilter.value = '';
                if (statusFilter) statusFilter.value = '';
                renderSegregationView();
            });
        }

        // Setup Modal interactions
        setupModal();

        // Initial render
        renderSegregationView();
    }

    function renderSegregationView() {
        if (!window.ECycleStorage) return;

        const allRecords = window.ECycleStorage.getRecords();

        // 1. Update Metrics Cards
        updateSummaryMetrics(allRecords);

        // 2. Filter records
        const searchVal  = (document.getElementById('segSearch')?.value || '').trim().toLowerCase();
        const catVal     = document.getElementById('segCategoryFilter')?.value || '';
        const condVal    = document.getElementById('segConditionFilter')?.value || '';
        const pathVal    = document.getElementById('segPathwayFilter')?.value || '';
        const statusVal  = document.getElementById('segStatusFilter')?.value || '';

        const filtered = allRecords.filter(function (item) {
            const matchesSearch = !searchVal ||
                item.id.toLowerCase().includes(searchVal) ||
                item.itemName.toLowerCase().includes(searchVal);
            const matchesCat = !catVal || item.category === catVal;
            const matchesCond = !condVal || item.condition === condVal;
            const matchesPath = !pathVal || item.recommendedPathway === pathVal;
            const matchesStatus = !statusVal || (item.classification && item.classification.classificationStatus === statusVal);

            return matchesSearch && matchesCat && matchesCond && matchesPath && matchesStatus;
        });

        // Update count badge
        const countBadge = document.getElementById('segResultsCount');
        if (countBadge) {
            countBadge.textContent = filtered.length;
        }

        const container = document.getElementById('segregationContainer');
        if (!container) return;

        container.innerHTML = '';

        // Empty state: no records in storage at all
        if (allRecords.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-state';
            emptyEl.innerHTML = `
                <div class="empty-state-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                        <polyline points="2 17 12 22 22 17"/>
                        <polyline points="2 12 12 17 22 12"/>
                    </svg>
                </div>
                <h3>No E-Waste Items Available for Segregation</h3>
                <p>Register electronic devices in Module 1 to evaluate them through the smart segregation engine.</p>
                <a href="#register" class="btn btn-primary btn-sm" style="margin-top: 1rem;">Go to Registration Form</a>
            `;
            container.appendChild(emptyEl);
            return;
        }

        // Empty state: search/filters yield zero matches
        if (filtered.length === 0) {
            const noMatchEl = document.createElement('div');
            noMatchEl.className = 'empty-state';
            noMatchEl.innerHTML = `
                <div class="empty-state-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <h3>No Matching Records Found</h3>
                <p>Try adjusting your search terms or clearing the active filters.</p>
                <button type="button" class="btn btn-outline btn-sm" id="segInlineClearBtn" style="margin-top: 1rem;">Reset All Filters</button>
            `;
            container.appendChild(noMatchEl);
            const inlineBtn = document.getElementById('segInlineClearBtn');
            if (inlineBtn) {
                inlineBtn.addEventListener('click', function () {
                    const searchInput = document.getElementById('segSearch');
                    const catFilter   = document.getElementById('segCategoryFilter');
                    const condFilter  = document.getElementById('segConditionFilter');
                    const pathFilter  = document.getElementById('segPathwayFilter');
                    const statusFilter= document.getElementById('segStatusFilter');
                    if (searchInput) searchInput.value = '';
                    if (catFilter) catFilter.value = '';
                    if (condFilter) condFilter.value = '';
                    if (pathFilter) pathFilter.value = '';
                    if (statusFilter) statusFilter.value = '';
                    renderSegregationView();
                });
            }
            return;
        }

        // Build responsive segregation grid
        const grid = document.createElement('div');
        grid.className = 'segregation-grid';

        filtered.forEach(function (rec) {
            const classif = rec.classification || classifyEWaste(rec);
            const card = document.createElement('article');
            card.className = 'segregation-card';
            card.setAttribute('data-record-id', rec.id);

            const badgeData = getPathwayBadgeData(classif.recommendedPathway);

            card.innerHTML = `
                <div class="seg-card-header">
                    <span class="record-id-badge">${escapeHtml(rec.id)}</span>
                    <span class="badge ${badgeData.badgeClass}">${badgeData.iconSvg} ${escapeHtml(badgeData.label)}</span>
                </div>
                <h3 class="seg-card-title">${escapeHtml(rec.itemName)}</h3>
                <div class="seg-card-meta">
                    <span class="seg-meta-item"><strong>Category:</strong> ${escapeHtml(rec.category)}</span>
                    <span class="seg-meta-item"><strong>Condition:</strong> ${escapeHtml(rec.condition)}</span>
                    <span class="seg-meta-item"><strong>Quantity:</strong> ${rec.quantity} unit(s) &bull; ${rec.weightKg.toFixed(2)} kg</span>
                </div>
                <div class="seg-card-recommendation">
                    <div class="seg-rec-title">${escapeHtml(classif.recommendationTitle)}</div>
                    <p class="seg-rec-reason">${escapeHtml(classif.recommendationReason)}</p>
                </div>
                ${classif.safetyWarning ? `
                    <div class="seg-safety-tag">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Special Safety Caution
                    </div>
                ` : ''}
                <div class="seg-card-footer">
                    <button type="button" class="btn btn-outline btn-sm seg-details-btn" data-record-id="${escapeHtml(rec.id)}">
                        View Details
                    </button>
                </div>
            `;

            grid.appendChild(card);
        });

        container.appendChild(grid);

        // Bind Details Buttons
        grid.querySelectorAll('.seg-details-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-record-id');
                lastActiveTriggerElement = this;
                openModal(id);
            });
        });
    }

    function updateSummaryMetrics(records) {
        const totalEl = document.getElementById('metricTotal');
        const pendingEl = document.getElementById('metricPending');
        const reuseRepairEl = document.getElementById('metricReuseRepair');
        const recyclingEl = document.getElementById('metricRecycling');

        const total = records.length;
        let pending = 0;
        let reuseRepair = 0;
        let recycling = 0;

        records.forEach(function (rec) {
            const pathway = rec.recommendedPathway || (rec.classification ? rec.classification.recommendedPathway : null);
            if (!pathway || pathway === PATHWAYS.MANUAL_REVIEW) {
                pending++;
            } else if (pathway === PATHWAYS.REUSE || pathway === PATHWAYS.REPAIR || pathway === PATHWAYS.REFURBISH) {
                reuseRepair++;
            } else if (pathway === PATHWAYS.AUTHORIZED_RECYCLING || pathway === PATHWAYS.SPECIAL_HANDLING) {
                recycling++;
            }
        });

        if (totalEl) totalEl.textContent = String(total);
        if (pendingEl) pendingEl.textContent = String(pending);
        if (reuseRepairEl) reuseRepairEl.textContent = String(reuseRepair);
        if (recyclingEl) recyclingEl.textContent = String(recycling);
    }

    // ── MODAL MANAGEMENT ──
    function setupModal() {
        const modal = document.getElementById('segregationModal');
        const closeBtn = document.getElementById('modalCloseBtn');
        const okBtn = document.getElementById('modalOkBtn');

        if (!modal) return;

        function closeModal() {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (lastActiveTriggerElement) {
                lastActiveTriggerElement.focus();
            }
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (okBtn) okBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                closeModal();
            }
        });
    }

    function openModal(recordId) {
        const modal = document.getElementById('segregationModal');
        if (!modal || !window.ECycleStorage) return;

        const record = window.ECycleStorage.getRecordById(recordId);
        if (!record) return;

        const classif = record.classification || classifyEWaste(record);
        const badgeData = getPathwayBadgeData(classif.recommendedPathway);

        // Populate fields safely using textContent
        document.getElementById('modalId').textContent = record.id;
        document.getElementById('modalItemName').textContent = record.itemName;
        document.getElementById('modalCategory').textContent = record.category;
        document.getElementById('modalCondition').textContent = record.condition;
        document.getElementById('modalQtyWeight').textContent = `${record.quantity} unit(s) • ${record.weightKg.toFixed(2)} kg`;

        // Registration Date
        let dateStr = 'N/A';
        if (record.createdAt) {
            try {
                dateStr = new Date(record.createdAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric'
                });
            } catch (e) {
                dateStr = record.createdAt.substring(0, 10);
            }
        }
        document.getElementById('modalCreatedAt').textContent = dateStr;

        // Pathway badge
        const pathwayBadgeEl = document.getElementById('modalPathwayBadge');
        if (pathwayBadgeEl) {
            pathwayBadgeEl.className = `badge ${badgeData.badgeClass}`;
            pathwayBadgeEl.innerHTML = `${badgeData.iconSvg} ${escapeHtml(badgeData.label)}`;
        }

        // Recommendation details
        document.getElementById('modalRecTitle').textContent = classif.recommendationTitle;
        document.getElementById('modalRecReason').textContent = classif.recommendationReason;

        // Safety warning alert box
        const safetyBox = document.getElementById('modalSafetyBox');
        const safetyText = document.getElementById('modalSafetyText');
        if (classif.safetyWarning) {
            safetyText.textContent = classif.safetyWarning;
            safetyBox.style.display = 'flex';
        } else {
            safetyBox.style.display = 'none';
        }

        // Notes
        const notesBox = document.getElementById('modalNotesBox');
        const notesText = document.getElementById('modalNotesText');
        if (record.notes && record.notes.trim()) {
            notesText.textContent = record.notes;
            notesBox.style.display = 'block';
        } else {
            notesBox.style.display = 'none';
        }

        // Open modal
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Move focus to modal close button
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) closeBtn.focus();
    }

    // ── HELPER: BADGE FORMATTER ──
    function getPathwayBadgeData(pathway) {
        switch (pathway) {
            case PATHWAYS.REUSE:
                return {
                    label: 'Reuse',
                    badgeClass: 'badge-success',
                    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h14"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3"/></svg>'
                };
            case PATHWAYS.REPAIR:
                return {
                    label: 'Repair',
                    badgeClass: 'badge-info',
                    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
                };
            case PATHWAYS.REFURBISH:
                return {
                    label: 'Refurbish',
                    badgeClass: 'badge-purple',
                    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'
                };
            case PATHWAYS.AUTHORIZED_RECYCLING:
                return {
                    label: 'Recycle',
                    badgeClass: 'badge-warning',
                    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>'
                };
            case PATHWAYS.SPECIAL_HANDLING:
                return {
                    label: 'Special Handling',
                    badgeClass: 'badge-special',
                    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>'
                };
            case PATHWAYS.MANUAL_REVIEW:
            default:
                return {
                    label: 'Manual Review',
                    badgeClass: 'badge-review',
                    iconSvg: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
                };
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
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

    // Expose API
    window.classifyEWaste = classifyEWaste;
    window.ECycleSegregation = {
        classifyEWaste: classifyEWaste,
        syncClassifications: syncClassifications,
        renderSegregationView: renderSegregationView
    };

    // Auto-init on DOM load
    document.addEventListener('DOMContentLoaded', initSegregationUI);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initSegregationUI();
    }

})(window);
