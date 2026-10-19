/**
 * E-Cycle — dashboard.js
 * Live Analytics Dashboard.
 * Integrates collection records, rule-based classification, circular economy
 * metrics, and economic value estimates into responsive, real-time KPI cards
 * and distribution visualizations.
 */

(function (window) {
    'use strict';

    // Global Filter State
    let filterSearch = '';
    let filterCategory = '';
    let filterCondition = '';
    let filterPathway = '';

    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    });

    // ── INITIALIZATION ──
    function initDashboard() {
        populateDashboardFilters();
        renderDashboard();
        setupDashboardListeners();

        // Listen for storage changes across modules
        window.addEventListener('ecycle:datachanged', function () {
            populateDashboardFilters();
            renderDashboard();
        });
    }

    // ── POPULATE FILTERS ──
    function populateDashboardFilters() {
        const catSelect = document.getElementById('dashFilterCategory');
        if (!catSelect || !window.ECycleStorage) return;

        const records = window.ECycleStorage.getRecords();
        const categories = Array.from(new Set(records.map(function (r) { return r.category; }))).filter(Boolean);

        const currentVal = catSelect.value;
        catSelect.innerHTML = '<option value="">All Categories</option>';
        categories.sort().forEach(function (cat) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            if (cat === currentVal) opt.selected = true;
            catSelect.appendChild(opt);
        });
    }

    function getRecordPathway(rec) {
        if (!rec) return 'NOT_CLASSIFIED';
        if (rec.recommendedPathway) return String(rec.recommendedPathway).toUpperCase();
        if (rec.classification && rec.classification.recommendedPathway) return String(rec.classification.recommendedPathway).toUpperCase();
        if (typeof window !== 'undefined' && window.classifyEWaste) {
            const res = window.classifyEWaste(rec);
            if (res && res.recommendedPathway) return String(res.recommendedPathway).toUpperCase();
        }
        return 'NOT_CLASSIFIED';
    }

    // ── DATA COMPUTATION ──
    function computeDashboardData(allRecords) {
        // Apply Global Filters
        const filteredRecords = allRecords.filter(function (rec) {
            const term = filterSearch.toLowerCase();
            const matchesSearch = !term ||
                (rec.id && rec.id.toLowerCase().includes(term)) ||
                (rec.itemName && rec.itemName.toLowerCase().includes(term));
            const matchesCat = !filterCategory || rec.category === filterCategory;
            const matchesCond = !filterCondition || rec.condition === filterCondition;

            const pathway = getRecordPathway(rec);
            const matchesPathway = !filterPathway || pathway === filterPathway;

            return matchesSearch && matchesCat && matchesCond && matchesPathway;
        });

        // 1. Registered Items (unique records)
        const totalItemsCount = filteredRecords.length;

        // 2. Total Recorded Weight
        let totalValidWeight = 0;
        let invalidWeightCount = 0;

        filteredRecords.forEach(function (r) {
            const w = Number(r.weightKg);
            if (!isNaN(w) && isFinite(w) && w > 0) {
                totalValidWeight += w;
            } else {
                invalidWeightCount++;
            }
        });

        // 3. Awaiting Classification
        let awaitingClassificationCount = 0;
        let reuseRepairCount = 0;
        let recycleSpecialCount = 0;

        // Pathway breakdown map
        const pathwayMap = {
            REUSE: { count: 0, weight: 0, label: 'Reuse', class: 'pathway-reuse' },
            REPAIR: { count: 0, weight: 0, label: 'Repair', class: 'pathway-repair' },
            REFURBISH: { count: 0, weight: 0, label: 'Refurbish', class: 'pathway-refurbish' },
            AUTHORIZED_RECYCLING: { count: 0, weight: 0, label: 'Recycle', class: 'pathway-recycling' },
            SPECIAL_HANDLING: { count: 0, weight: 0, label: 'Special Handling', class: 'pathway-hazard' },
            MANUAL_REVIEW: { count: 0, weight: 0, label: 'Manual Review', class: 'pathway-review' },
            NOT_CLASSIFIED: { count: 0, weight: 0, label: 'Not Classified', class: 'pathway-unclassified' }
        };

        // Category breakdown map
        const categoryMap = {};

        // Status breakdown map
        const statusMap = {};

        filteredRecords.forEach(function (rec) {
            const pathway = getRecordPathway(rec);
            const w = Number(rec.weightKg) || 0;

            if (pathway === 'NOT_CLASSIFIED') {
                awaitingClassificationCount++;
            }

            if (pathway === 'REUSE' || pathway === 'REPAIR') {
                reuseRepairCount++;
            }

            if (pathway === 'AUTHORIZED_RECYCLING' || pathway === 'SPECIAL_HANDLING') {
                recycleSpecialCount++;
            }

            if (pathwayMap[pathway]) {
                pathwayMap[pathway].count += 1;
                pathwayMap[pathway].weight += w;
            } else {
                pathwayMap.MANUAL_REVIEW.count += 1;
                pathwayMap.MANUAL_REVIEW.weight += w;
            }

            // Category aggregation
            const cat = rec.category || 'Other Electronic Waste';
            if (!categoryMap[cat]) {
                categoryMap[cat] = { category: cat, count: 0, weight: 0 };
            }
            categoryMap[cat].count += 1;
            categoryMap[cat].weight += w;

            // Status aggregation
            const status = rec.status || 'Registered';
            statusMap[status] = (statusMap[status] || 0) + 1;
        });

        // 6. Estimated Gross Recovery Value (reusing Step 6 rate model)
        const rates = window.ECycleStorage ? window.ECycleStorage.getRates() : {};
        let estimatedGrossValue = 0;
        let rateExcludedCount = 0;
        const categoryValueMap = {};

        filteredRecords.forEach(function (rec) {
            const w = Number(rec.weightKg);
            if (isNaN(w) || w <= 0) return;
            const cat = rec.category || 'Other Electronic Waste';
            const rate = Object.prototype.hasOwnProperty.call(rates, cat) ? Number(rates[cat]) : null;

            if (rate !== null && !isNaN(rate) && isFinite(rate) && rate >= 0) {
                const itemVal = Math.round(w * rate * 100) / 100;
                estimatedGrossValue += itemVal;
                categoryValueMap[cat] = (categoryValueMap[cat] || 0) + itemVal;
            } else {
                rateExcludedCount++;
            }
        });

        return {
            totalItemsCount: totalItemsCount,
            totalAllRecords: allRecords.length,
            totalValidWeight: Math.round(totalValidWeight * 100) / 100,
            invalidWeightCount: invalidWeightCount,
            awaitingClassificationCount: awaitingClassificationCount,
            reuseRepairCount: reuseRepairCount,
            recycleSpecialCount: recycleSpecialCount,
            estimatedGrossValue: Math.round(estimatedGrossValue * 100) / 100,
            pathwayMap: pathwayMap,
            categoryMap: categoryMap,
            statusMap: statusMap,
            categoryValueMap: categoryValueMap,
            rateExcludedCount: rateExcludedCount,
            filteredRecords: filteredRecords
        };
    }

    // ── MAIN RENDER ──
    function renderDashboard() {
        if (!window.ECycleStorage) return;

        const allRecords = window.ECycleStorage.getRecords();
        const data = computeDashboardData(allRecords);

        const isFiltered = Boolean(filterSearch || filterCategory || filterCondition || filterPathway);
        const filterBadge = document.getElementById('dashFilterActiveNotice');
        if (filterBadge) {
            filterBadge.style.display = isFiltered ? 'inline-block' : 'none';
        }

        const matchCountEl = document.getElementById('dashFilteredCount');
        if (matchCountEl) {
            matchCountEl.textContent = `${data.totalItemsCount} of ${data.totalAllRecords} records matching`;
        }

        // Render 6 KPI Cards
        setSafeText('dashKpiRegistered', String(data.totalItemsCount));
        setSafeText('dashKpiWeight', `${data.totalValidWeight.toFixed(2)} kg`);
        setSafeText('dashKpiAwaiting', String(data.awaitingClassificationCount));
        setSafeText('dashKpiReuseRepair', String(data.reuseRepairCount));
        setSafeText('dashKpiRecycleSpecial', String(data.recycleSpecialCount));
        setSafeText('dashKpiEstimatedValue', currencyFormatter.format(data.estimatedGrossValue));

        // Subtitles / meta on KPI cards
        setSafeText('dashKpiWeightSub', data.invalidWeightCount > 0 ? `(${data.invalidWeightCount} record(s) with invalid weight excluded)` : 'Valid registered weight');
        setSafeText('dashKpiValueSub', data.rateExcludedCount > 0 ? `(${data.rateExcludedCount} record(s) excluded due to unconfigured rates)` : 'Gross educational estimate');

        // Render Category Distribution Chart & Table
        renderCategoryDistribution(data.categoryMap, data.totalItemsCount);

        // Render Pathway Distribution Chart & Table
        renderPathwayDistribution(data.pathwayMap, data.totalItemsCount);

        // Render Collection Status Distribution
        renderStatusDistribution(data.statusMap, data.totalItemsCount);

        // Render Economic Value By Category
        renderValueDistribution(data.categoryValueMap, data.estimatedGrossValue);

        // Render Recent Registrations
        renderRecentRegistrations(allRecords);
    }

    // ── CATEGORY DISTRIBUTION ──
    function renderCategoryDistribution(catMap, totalCount) {
        const container = document.getElementById('dashCatDistributionChart');
        const textSummary = document.getElementById('dashCatSummaryText');
        if (!container) return;

        container.innerHTML = '';

        const categories = Object.keys(catMap).map(function (k) { return catMap[k]; });
        categories.sort(function (a, b) { return b.count - a.count; });

        if (categories.length === 0 || totalCount === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: var(--space-4);"><p class="text-muted">No category data in current filter.</p></div>';
            if (textSummary) textSummary.textContent = 'No records matching current criteria.';
            return;
        }

        const maxCount = Math.max.apply(null, categories.map(function (c) { return c.count; })) || 1;

        categories.forEach(function (c) {
            const pct = ((c.count / totalCount) * 100).toFixed(1);
            const barWidth = Math.max(5, Math.round((c.count / maxCount) * 100));

            const row = document.createElement('div');
            row.className = 'dash-bar-row';
            row.innerHTML = `
                <div class="dash-bar-label-group">
                    <span class="dash-bar-name">${escapeHTML(c.category)}</span>
                    <span class="dash-bar-stat"><strong>${c.count}</strong> items (${pct}%) • ${c.weight.toFixed(1)} kg</span>
                </div>
                <div class="dash-bar-track">
                    <div class="dash-bar-fill cat-fill" style="width: ${barWidth}%;"></div>
                </div>
            `;
            container.appendChild(row);
        });

        if (textSummary) {
            const top = categories[0];
            textSummary.textContent = `Largest recorded category is ${top.category} representing ${((top.count / totalCount) * 100).toFixed(1)}% of selected records (${top.count} items, ${top.weight.toFixed(1)} kg).`;
        }
    }

    // ── PATHWAY DISTRIBUTION ──
    function renderPathwayDistribution(pathwayMap, totalCount) {
        const container = document.getElementById('dashPathwayDistributionChart');
        const textSummary = document.getElementById('dashPathwaySummaryText');
        if (!container) return;

        container.innerHTML = '';

        const pathways = Object.keys(pathwayMap).map(function (k) { return pathwayMap[k]; });
        const activePathways = pathways.filter(function (p) { return p.count > 0; });

        if (activePathways.length === 0 || totalCount === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: var(--space-4);"><p class="text-muted">No pathway data in current filter.</p></div>';
            if (textSummary) textSummary.textContent = 'No classification records available in this selection.';
            return;
        }

        const maxCount = Math.max.apply(null, activePathways.map(function (p) { return p.count; })) || 1;

        activePathways.forEach(function (p) {
            const pct = ((p.count / totalCount) * 100).toFixed(1);
            const barWidth = Math.max(5, Math.round((p.count / maxCount) * 100));

            const row = document.createElement('div');
            row.className = 'dash-bar-row';
            row.innerHTML = `
                <div class="dash-bar-label-group">
                    <span class="dash-bar-name"><span class="pathway-indicator ${p.class}"></span> ${escapeHTML(p.label)}</span>
                    <span class="dash-bar-stat"><strong>${p.count}</strong> items (${pct}%) • ${p.weight.toFixed(1)} kg</span>
                </div>
                <div class="dash-bar-track">
                    <div class="dash-bar-fill ${p.class}" style="width: ${barWidth}%;"></div>
                </div>
            `;
            container.appendChild(row);
        });

        if (textSummary) {
            const reuseTotal = (pathwayMap.REUSE.count + pathwayMap.REPAIR.count + pathwayMap.REFURBISH.count);
            const reusePct = totalCount > 0 ? ((reuseTotal / totalCount) * 100).toFixed(1) : '0';
            textSummary.textContent = `${reuseTotal} of ${totalCount} records (${reusePct}%) have been recommended for direct life extension (Reuse, Repair, or Refurbishment). Figures represent algorithmic triage, not confirmed physical outcomes.`;
        }
    }

    // ── STATUS DISTRIBUTION ──
    function renderStatusDistribution(statusMap, totalCount) {
        const container = document.getElementById('dashStatusOverview');
        if (!container) return;

        container.innerHTML = '';

        const statuses = Object.keys(statusMap);
        if (statuses.length === 0 || totalCount === 0) {
            container.innerHTML = '<p class="text-muted" style="padding: var(--space-2);">No collection status records.</p>';
            return;
        }

        statuses.forEach(function (st) {
            const cnt = statusMap[st];
            const pct = ((cnt / totalCount) * 100).toFixed(1);

            const div = document.createElement('div');
            div.className = 'dash-status-item';
            div.innerHTML = `
                <div class="dash-status-header">
                    <span class="badge badge-success"><span class="status-dot active"></span> ${escapeHTML(st)}</span>
                    <span class="dash-status-count"><strong>${cnt}</strong> (${pct}%)</span>
                </div>
                <p class="dash-status-desc">
                    ${st === 'Registered' 
                        ? 'Item has been logged into the E-Cycle browser store. Physical collection has not yet occurred.' 
                        : 'Current system recorded status.'}
                </p>
            `;
            container.appendChild(div);
        });
    }

    // ── VALUE DISTRIBUTION BY CATEGORY ──
    function renderValueDistribution(valMap, totalVal) {
        const container = document.getElementById('dashValueDistributionChart');
        if (!container) return;

        container.innerHTML = '';

        const entries = Object.keys(valMap).map(function (k) {
            return { category: k, value: valMap[k] };
        }).filter(function (e) { return e.value > 0; });

        entries.sort(function (a, b) { return b.value - a.value; });

        if (entries.length === 0 || totalVal === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: var(--space-4);"><p class="text-muted">No estimated recovery value in current filter.</p></div>';
            return;
        }

        const maxVal = Math.max.apply(null, entries.map(function (e) { return e.value; })) || 1;

        entries.forEach(function (e) {
            const pct = ((e.value / totalVal) * 100).toFixed(1);
            const barWidth = Math.max(5, Math.round((e.value / maxVal) * 100));

            const row = document.createElement('div');
            row.className = 'dash-bar-row';
            row.innerHTML = `
                <div class="dash-bar-label-group">
                    <span class="dash-bar-name">${escapeHTML(e.category)}</span>
                    <span class="dash-bar-stat"><strong>${currencyFormatter.format(e.value)}</strong> (${pct}%)</span>
                </div>
                <div class="dash-bar-track">
                    <div class="dash-bar-fill value-fill" style="width: ${barWidth}%;"></div>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // ── RECENT REGISTRATIONS ──
    function renderRecentRegistrations(allRecords) {
        const tbody = document.getElementById('dashRecentRegistrationsTbody');
        const emptyState = document.getElementById('dashRecentEmpty');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!allRecords || allRecords.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Sort descending by createdAt
        const sorted = allRecords.slice().sort(function (a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        // Show latest 5
        const recent = sorted.slice(0, 5);

        recent.forEach(function (rec) {
            const tr = document.createElement('tr');
            const pathway = (rec.recommendedPathway || (rec.classification && rec.classification.recommendedPathway) || 'Unclassified').toUpperCase();
            const dateStr = rec.createdAt ? formatDate(rec.createdAt) : 'Recently';

            tr.innerHTML = `
                <td><span class="record-id-badge">${escapeHTML(rec.id)}</span></td>
                <td><strong>${escapeHTML(rec.itemName)}</strong></td>
                <td>${escapeHTML(rec.category)}</td>
                <td>${Number(rec.weightKg).toFixed(2)} kg</td>
                <td>${dateStr}</td>
                <td><span class="badge badge-success">${escapeHTML(rec.status || 'Registered')}</span></td>
                <td><span class="pathway-pill pathway-${pathway.toLowerCase().replace(/_/g, '-')}">${escapeHTML(pathway.replace(/_/g, ' '))}</span></td>
            `;

            tbody.appendChild(tr);
        });
    }

    // ── LISTENERS ──
    function setupDashboardListeners() {
        const searchInput = document.getElementById('dashFilterSearch');
        const catSelect = document.getElementById('dashFilterCategory');
        const condSelect = document.getElementById('dashFilterCondition');
        const pathSelect = document.getElementById('dashFilterPathway');
        const clearBtn = document.getElementById('dashClearFiltersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(function () {
                filterSearch = this.value.trim();
                renderDashboard();
            }, 200));
        }

        if (catSelect) {
            catSelect.addEventListener('change', function () {
                filterCategory = this.value;
                renderDashboard();
            });
        }

        if (condSelect) {
            condSelect.addEventListener('change', function () {
                filterCondition = this.value;
                renderDashboard();
            });
        }

        if (pathSelect) {
            pathSelect.addEventListener('change', function () {
                filterPathway = this.value;
                renderDashboard();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                filterSearch = '';
                filterCategory = '';
                filterCondition = '';
                filterPathway = '';
                if (searchInput) searchInput.value = '';
                if (catSelect) catSelect.value = '';
                if (condSelect) condSelect.value = '';
                if (pathSelect) pathSelect.value = '';
                renderDashboard();
            });
        }
    }

    // ── HELPERS ──
    function setSafeText(elemId, text) {
        const el = document.getElementById(elemId);
        if (el) el.textContent = text || '-';
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
    window.ECycleDashboard = {
        init: initDashboard,
        refresh: renderDashboard,
        computeData: computeDashboardData
    };

    // Auto-init on DOM load
    document.addEventListener('DOMContentLoaded', initDashboard);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initDashboard();
    }

})(window);
