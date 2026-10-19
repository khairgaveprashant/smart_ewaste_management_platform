/**
 * E-Cycle — estimator.js
 * E-Waste Economic Value Estimator.
 * Calculates potential gross recovery value using recorded weights and
 * configurable illustrative rates (₹/kg).
 * Transparent educational modeling — not verified market quotes.
 */

(function (window) {
    'use strict';

    // State
    let activeFilterCategory = '';
    let activeFilterStatus = '';
    let activeSearchTerm = '';

    const currencyFormatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    });

    // ── INITIALIZATION ──
    function initEstimatorModule() {
        renderEstimatorView();
        setupEstimatorEvents();

        // Listen for storage changes
        window.addEventListener('ecycle:datachanged', function () {
            renderEstimatorView();
        });
    }

    // ── CORE CALCULATION LOGIC ──
    /**
     * Calculate item estimate
     * @param {Object} record
     * @param {Object} rates
     * @returns {Object} Evaluation details
     */
    function evaluateItemEstimate(record, rates) {
        const weight = Number(record.weightKg);

        if (isNaN(weight) || weight <= 0 || !isFinite(weight)) {
            return {
                isEligible: false,
                reason: 'Invalid or missing weight',
                rate: null,
                value: 0,
                statusText: 'Invalid Weight'
            };
        }

        const category = record.category || 'Other Electronic Waste';
        const hasRate = Object.prototype.hasOwnProperty.call(rates, category);
        const rate = hasRate ? Number(rates[category]) : null;

        if (rate === null || isNaN(rate) || !isFinite(rate) || rate < 0) {
            return {
                isEligible: false,
                reason: 'Rate not configured for category',
                rate: null,
                value: 0,
                statusText: 'Rate Not Configured'
            };
        }

        const value = Math.round(weight * rate * 100) / 100;
        return {
            isEligible: true,
            reason: 'Calculated successfully',
            rate: rate,
            value: value,
            statusText: 'Calculated'
        };
    }

    /**
     * Compute entire dataset calculations
     */
    function computeEstimates(records, rates, filteredRecords) {
        const targetRecords = filteredRecords || records;
        let totalWeight = 0;
        let totalValue = 0;
        let eligibleCount = 0;
        const categoriesSet = new Set();
        const categoryMap = {};

        // Initialize category map from known rates
        for (const cat in rates) {
            categoryMap[cat] = {
                category: cat,
                count: 0,
                weightKg: 0,
                rate: rates[cat],
                value: 0
            };
        }

        const evaluatedItems = targetRecords.map(function (rec) {
            const result = evaluateItemEstimate(rec, rates);
            if (result.isEligible) {
                totalWeight += Number(rec.weightKg);
                totalValue += result.value;
                eligibleCount++;
                categoriesSet.add(rec.category);

                if (!categoryMap[rec.category]) {
                    categoryMap[rec.category] = {
                        category: rec.category,
                        count: 0,
                        weightKg: 0,
                        rate: result.rate,
                        value: 0
                    };
                }

                categoryMap[rec.category].count += 1;
                categoryMap[rec.category].weightKg += Number(rec.weightKg);
                categoryMap[rec.category].value += result.value;
            }

            return {
                record: rec,
                calculation: result
            };
        });

        // Convert category breakdown to array, sort descending by value
        const categoryBreakdown = Object.keys(categoryMap)
            .map(function (k) { return categoryMap[k]; })
            .filter(function (c) { return c.count > 0; })
            .sort(function (a, b) { return b.value - a.value; });

        return {
            totalWeight: Math.round(totalWeight * 100) / 100,
            totalValue: Math.round(totalValue * 100) / 100,
            eligibleCount: eligibleCount,
            totalRecords: targetRecords.length,
            categoriesAssessed: categoriesSet.size,
            items: evaluatedItems,
            categoryBreakdown: categoryBreakdown
        };
    }

    // ── MAIN RENDER ──
    function renderEstimatorView() {
        if (!window.ECycleStorage) return;

        const allRecords = window.ECycleStorage.getRecords();
        const rates = window.ECycleStorage.getRates();

        // Apply filters
        const filteredRecords = allRecords.filter(function (rec) {
            const matchesCat = !activeFilterCategory || rec.category === activeFilterCategory;
            const matchesStatus = !activeFilterStatus || rec.status === activeFilterStatus;
            const term = activeSearchTerm.toLowerCase();
            const matchesSearch = !term ||
                (rec.id && rec.id.toLowerCase().includes(term)) ||
                (rec.itemName && rec.itemName.toLowerCase().includes(term));
            return matchesCat && matchesStatus && matchesSearch;
        });

        const data = computeEstimates(allRecords, rates, filteredRecords);

        // Update Summary Cards
        setSafeText('estTotalWeight', `${data.totalWeight.toFixed(2)} kg`);
        setSafeText('estTotalValue', currencyFormatter.format(data.totalValue));
        setSafeText('estEligibleRecords', `${data.eligibleCount} of ${data.totalRecords}`);
        setSafeText('estCategoriesAssessed', String(data.categoriesAssessed));

        // Filter info caption
        const isFiltered = Boolean(activeFilterCategory || activeFilterStatus || activeSearchTerm);
        const filterNotice = document.getElementById('estFilterNotice');
        if (filterNotice) {
            filterNotice.style.display = isFiltered ? 'inline-block' : 'none';
        }

        // Render Item-Level Table
        renderItemsTable(data.items);

        // Render Category Breakdown & Horizontal Bars
        renderCategoryBreakdown(data.categoryBreakdown, data.totalValue);

        // Populate Category Filter Dropdown
        populateCategoryFilterOptions(allRecords);

        // Populate Rate Configuration Inputs
        renderRateConfigInputs(rates);
    }

    // ── ITEM-LEVEL VALUE TABLE ──
    function renderItemsTable(items) {
        const tbody = document.getElementById('estItemsTbody');
        const emptyState = document.getElementById('estItemsEmpty');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!items || items.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        items.forEach(function (entry) {
            const rec = entry.record;
            const calc = entry.calculation;

            const tr = document.createElement('tr');

            let statusBadge = '<span class="badge badge-success"><span class="status-dot active"></span> Calculated</span>';
            let valueDisplay = currencyFormatter.format(calc.value);
            let rateDisplay = calc.rate !== null ? `₹${calc.rate}/kg` : '<span class="text-muted">Unconfigured</span>';

            if (!calc.isEligible) {
                if (calc.statusText === 'Rate Not Configured') {
                    statusBadge = '<span class="badge badge-warning">Rate Needed</span>';
                    valueDisplay = '<span class="text-muted">—</span>';
                } else {
                    statusBadge = '<span class="badge badge-error">Invalid Data</span>';
                    valueDisplay = '<span class="text-muted">—</span>';
                }
            }

            tr.innerHTML = `
                <td><span class="record-id-badge">${escapeHTML(rec.id)}</span></td>
                <td>
                    <strong>${escapeHTML(rec.itemName)}</strong>
                    <div style="font-size: var(--fs-xs); color: var(--color-text-muted);">${escapeHTML(rec.category)}</div>
                </td>
                <td>${Number(rec.weightKg).toFixed(2)} kg</td>
                <td>${rateDisplay}</td>
                <td><strong>${valueDisplay}</strong></td>
                <td>${statusBadge}</td>
            `;

            tbody.appendChild(tr);
        });
    }

    // ── CATEGORY BREAKDOWN & BARS ──
    function renderCategoryBreakdown(categories, totalValue) {
        const container = document.getElementById('estCategoryChartContainer');
        const tableBody = document.getElementById('estCategoryTbody');
        if (!container || !tableBody) return;

        container.innerHTML = '';
        tableBody.innerHTML = '';

        if (!categories || categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding: var(--space-6);">
                    <p class="text-muted">No eligible records assessed in current selection.</p>
                </div>
            `;
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: var(--space-4);">No category data available</td></tr>';
            return;
        }

        const maxCatValue = Math.max.apply(null, categories.map(function (c) { return c.value; })) || 1;

        categories.forEach(function (cat) {
            const pctOfTotal = totalValue > 0 ? ((cat.value / totalValue) * 100).toFixed(1) : '0.0';
            const barWidth = Math.max(4, Math.round((cat.value / maxCatValue) * 100));

            // Bar item in horizontal chart
            const barItem = document.createElement('div');
            barItem.className = 'cat-bar-item';
            barItem.innerHTML = `
                <div class="cat-bar-header">
                    <span class="cat-bar-name">${escapeHTML(cat.category)}</span>
                    <span class="cat-bar-value">${currencyFormatter.format(cat.value)} <span class="cat-bar-pct">(${pctOfTotal}%)</span></span>
                </div>
                <div class="cat-bar-track" role="progressbar" aria-valuenow="${pctOfTotal}" aria-valuemin="0" aria-valuemax="100">
                    <div class="cat-bar-fill" style="width: ${barWidth}%;"></div>
                </div>
                <div class="cat-bar-meta">
                    <span>${cat.count} record(s)</span>
                    <span>${cat.weightKg.toFixed(2)} kg @ ₹${cat.rate}/kg</span>
                </div>
            `;
            container.appendChild(barItem);

            // Row in table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHTML(cat.category)}</strong></td>
                <td>${cat.count} item(s)</td>
                <td>${cat.weightKg.toFixed(2)} kg</td>
                <td>₹${cat.rate}/kg</td>
                <td><strong>${currencyFormatter.format(cat.value)}</strong></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // ── RATE CONFIGURATION MODAL / SECTION ──
    function renderRateConfigInputs(rates) {
        const container = document.getElementById('rateConfigInputsContainer');
        if (!container) return;

        container.innerHTML = '';

        for (const cat in rates) {
            const row = document.createElement('div');
            row.className = 'rate-config-row';
            const isBattery = cat === 'Batteries';

            row.innerHTML = `
                <div class="rate-config-cat">
                    <label for="rateInput_${encodeId(cat)}">${escapeHTML(cat)}</label>
                    ${isBattery ? `<span class="rate-cat-note">Dedicated recovery stream (default ₹0/kg)</span>` : ''}
                </div>
                <div class="rate-config-input-wrap">
                    <span class="rate-currency-prefix">₹</span>
                    <input type="number" 
                           id="rateInput_${encodeId(cat)}" 
                           class="form-control rate-numeric-input" 
                           data-category="${escapeHTML(cat)}" 
                           value="${rates[cat]}" 
                           min="0" 
                           step="1" 
                           required>
                    <span class="rate-unit-suffix">/ kg</span>
                </div>
            `;
            container.appendChild(row);
        }
    }

    // ── POPULATE CATEGORY FILTER ──
    function populateCategoryFilterOptions(records) {
        const select = document.getElementById('estCategoryFilter');
        if (!select) return;

        const currentVal = select.value;
        const categories = Array.from(new Set(records.map(function (r) { return r.category; }))).filter(Boolean);

        // Keep 'All' option
        select.innerHTML = '<option value="">All Categories</option>';
        categories.sort().forEach(function (cat) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            if (cat === currentVal) opt.selected = true;
            select.appendChild(opt);
        });
    }

    // ── EVENT LISTENERS ──
    function setupEstimatorEvents() {
        // Search & Filters
        const searchInput = document.getElementById('estSearchInput');
        const catFilter = document.getElementById('estCategoryFilter');
        const statusFilter = document.getElementById('estStatusFilter');
        const clearBtn = document.getElementById('estClearFiltersBtn');

        if (searchInput) {
            searchInput.addEventListener('input', debounce(function () {
                activeSearchTerm = this.value.trim();
                renderEstimatorView();
            }, 200));
        }

        if (catFilter) {
            catFilter.addEventListener('change', function () {
                activeFilterCategory = this.value;
                renderEstimatorView();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', function () {
                activeFilterStatus = this.value;
                renderEstimatorView();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                activeSearchTerm = '';
                activeFilterCategory = '';
                activeFilterStatus = '';
                if (searchInput) searchInput.value = '';
                if (catFilter) catFilter.value = '';
                if (statusFilter) statusFilter.value = '';
                renderEstimatorView();
            });
        }

        // Rate Configuration Save & Reset
        const saveRatesBtn = document.getElementById('saveRatesBtn');
        const resetRatesBtn = document.getElementById('resetRatesBtn');
        const rateAlert = document.getElementById('rateConfigAlert');

        if (saveRatesBtn) {
            saveRatesBtn.addEventListener('click', function () {
                const inputs = document.querySelectorAll('.rate-numeric-input');
                const newRates = {};
                let hasError = false;

                inputs.forEach(function (input) {
                    const cat = input.getAttribute('data-category');
                    const val = Number(input.value);

                    if (isNaN(val) || !isFinite(val) || val < 0) {
                        hasError = true;
                        input.classList.add('has-error');
                    } else {
                        input.classList.remove('has-error');
                        newRates[cat] = val;
                    }
                });

                if (hasError) {
                    showRateAlert('Please enter valid, non-negative numbers for all category rates.', 'error');
                    return;
                }

                const result = window.ECycleStorage.saveRates(newRates);
                if (result.success) {
                    showRateAlert('Illustrative rates successfully updated and saved.', 'success');
                    renderEstimatorView();
                } else {
                    showRateAlert(result.error || 'Failed to save rates.', 'error');
                }
            });
        }

        if (resetRatesBtn) {
            resetRatesBtn.addEventListener('click', function () {
                window.ECycleStorage.resetRates();
                showRateAlert('Illustrative rates reset to demonstration defaults.', 'info');
                renderEstimatorView();
            });
        }
    }

    // ── HELPERS ──
    function showRateAlert(msg, type) {
        const el = document.getElementById('rateConfigAlert');
        if (!el) return;
        el.textContent = msg;
        el.className = 'alert ' + (type === 'error' ? 'alert-danger' : (type === 'info' ? 'alert-info' : 'alert-success'));
        el.style.display = 'block';
        setTimeout(function () {
            el.style.display = 'none';
        }, 5000);
    }

    function encodeId(str) {
        return String(str).replace(/[^a-zA-Z0-9]/g, '_');
    }

    function setSafeText(elemId, text) {
        const el = document.getElementById(elemId);
        if (el) el.textContent = text || '-';
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
    window.ECycleEstimator = {
        init: initEstimatorModule,
        refresh: renderEstimatorView,
        computeEstimates: computeEstimates,
        evaluateItemEstimate: evaluateItemEstimate,
        formatCurrency: function (num) { return currencyFormatter.format(num); }
    };

    // Auto-init on DOM load
    document.addEventListener('DOMContentLoaded', initEstimatorModule);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initEstimatorModule();
    }

})(window);
