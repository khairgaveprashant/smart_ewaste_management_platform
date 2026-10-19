/**
 * E-Cycle — collection.js
 * Handles E-Waste Collection Registration, form validation, ID generation,
 * LocalStorage persistence, success states, and records list filtering.
 */

(function () {
    'use strict';

    // ── DOM References ──
    const form             = document.getElementById('collectionForm');
    const submitBtn        = document.getElementById('submitBtn');
    const resetBtn         = document.getElementById('resetBtn');
    const successPanel     = document.getElementById('successPanel');
    const formCard         = document.getElementById('formCard');
    const safetyNotice     = document.getElementById('safetyNotice');
    const notesInput       = document.getElementById('notes');
    const charCount        = document.getElementById('charCount');
    const categorySelect   = document.getElementById('category');
    const conditionSelect  = document.getElementById('condition');

    // Records List DOM
    const recordsContainer = document.getElementById('recordsContainer');
    const recordSearch     = document.getElementById('recordSearch');
    const categoryFilter   = document.getElementById('categoryFilter');
    const statusFilter     = document.getElementById('statusFilter');
    const resetFiltersBtn  = document.getElementById('resetFiltersBtn');
    const recordsCountSpan = document.getElementById('recordsCount');

    // Success Panel Action Buttons
    const btnRegisterAnother = document.getElementById('btnRegisterAnother');
    const btnViewRecord      = document.getElementById('btnViewRecord');
    const btnViewAllRecords  = document.getElementById('btnViewAllRecords');

    let currentSubmittedId = null;

    // ── Unique Collection ID Generator ──
    function generateCollectionId() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;

        const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let id = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 50) {
            attempts++;
            let rand = '';
            for (let i = 0; i < 6; i++) {
                rand += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            id = `EW-${dateStr}-${rand}`;
            if (!window.ECycleStorage || !window.ECycleStorage.getRecordById(id)) {
                isUnique = true;
            }
        }
        return id;
    }

    // ── Character Count for Notes ──
    if (notesInput && charCount) {
        notesInput.addEventListener('input', function () {
            const max = parseInt(notesInput.getAttribute('maxlength') || '400', 10);
            const remaining = max - notesInput.value.length;
            charCount.textContent = remaining;
            if (remaining < 20) {
                charCount.style.color = 'var(--color-error)';
            } else {
                charCount.style.color = 'var(--color-text-muted)';
            }
        });
    }

    // ── Dynamic Battery / Damaged Safety Notice ──
    function checkSafetyNotice() {
        if (!safetyNotice) return;
        const cat = categorySelect ? categorySelect.value : '';
        const cond = conditionSelect ? conditionSelect.value : '';

        const isBattery = cat === 'Batteries';
        const isDamaged = cond === 'Damaged / Non-working';

        if (isBattery || isDamaged) {
            safetyNotice.classList.remove('sr-only');
            safetyNotice.style.display = 'flex';
            if (isBattery && isDamaged) {
                safetyNotice.querySelector('.safety-notice-text').textContent =
                    'Safety Alert: Damaged batteries present serious chemical and thermal runaway risks. Keep in a cool, non-combustible container, tape exposed terminals, and do not dismantle. Transport directly to an authorized e-waste drop-off location.';
            } else if (isBattery) {
                safetyNotice.querySelector('.safety-notice-text').textContent =
                    'Safety Notice: Batteries require specialized recycling channels to prevent leakage and fire hazard. Store safely in a dry location and deliver intact to a designated collection point.';
            } else {
                safetyNotice.querySelector('.safety-notice-text').textContent =
                    'Caution: Damaged or cracked electronics may expose broken glass, lithium pouches, or internal wiring. Handle with care and keep separated from household waste.';
            }
        } else {
            safetyNotice.style.display = 'none';
        }
    }

    if (categorySelect) categorySelect.addEventListener('change', checkSafetyNotice);
    if (conditionSelect) conditionSelect.addEventListener('change', checkSafetyNotice);

    // ── Validation Helpers ──
    function setFieldError(fieldId, errorMsg) {
        const input = document.getElementById(fieldId);
        const errEl = document.getElementById(`err-${fieldId}`);
        if (input) {
            input.classList.add('has-error');
            input.setAttribute('aria-invalid', 'true');
        }
        if (errEl) {
            errEl.textContent = errorMsg;
            errEl.style.display = 'block';
        }
    }

    function clearFieldError(fieldId) {
        const input = document.getElementById(fieldId);
        const errEl = document.getElementById(`err-${fieldId}`);
        if (input) {
            input.classList.remove('has-error');
            input.removeAttribute('aria-invalid');
        }
        if (errEl) {
            errEl.textContent = '';
            errEl.style.display = 'none';
        }
    }

    function clearAllErrors() {
        ['itemName', 'category', 'quantity', 'weightKg', 'condition', 'collectionPreference', 'privacyConfirm'].forEach(clearFieldError);
    }

    // Live error clearing on input
    ['itemName', 'quantity', 'weightKg'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () {
                clearFieldError(id);
            });
        }
    });

    ['category', 'condition', 'collectionPreference', 'privacyConfirm'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function () {
                clearFieldError(id);
            });
        }
    });

    // ── Form Submission Handler ──
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            clearAllErrors();

            let isValid = true;
            let firstInvalidInput = null;

            function markInvalid(fieldId, msg) {
                isValid = false;
                setFieldError(fieldId, msg);
                if (!firstInvalidInput) {
                    firstInvalidInput = document.getElementById(fieldId);
                }
            }

            // A. Item Name
            const itemNameVal = document.getElementById('itemName').value.trim();
            if (!itemNameVal) {
                markInvalid('itemName', 'Please enter an item name (e.g., Old laptop, Mobile phone).');
            } else if (itemNameVal.length < 2) {
                markInvalid('itemName', 'Item name must be at least 2 characters long.');
            } else if (itemNameVal.length > 80) {
                markInvalid('itemName', 'Item name cannot exceed 80 characters.');
            }

            // B. E-Waste Category
            const categoryVal = document.getElementById('category').value;
            if (!categoryVal) {
                markInvalid('category', 'Please select an e-waste category.');
            }

            // C. Quantity
            const quantityVal = document.getElementById('quantity').value.trim();
            const quantityNum = parseInt(quantityVal, 10);
            if (!quantityVal || isNaN(quantityNum)) {
                markInvalid('quantity', 'Please specify a valid item quantity.');
            } else if (quantityNum < 1) {
                markInvalid('quantity', 'Quantity must be at least 1.');
            } else if (quantityNum > 100) {
                markInvalid('quantity', 'Quantity cannot exceed 100 items per registration.');
            }

            // D. Weight
            const weightVal = document.getElementById('weightKg').value.trim();
            const weightNum = parseFloat(weightVal);
            if (!weightVal || isNaN(weightNum)) {
                markInvalid('weightKg', 'Please enter the total estimated weight in kilograms.');
            } else if (weightNum <= 0) {
                markInvalid('weightKg', 'Weight must be greater than 0 kg.');
            } else if (weightNum > 500) {
                markInvalid('weightKg', 'Weight cannot exceed 500 kg for standard collection.');
            }

            // E. Item Condition
            const conditionVal = document.getElementById('condition').value;
            if (!conditionVal) {
                markInvalid('condition', 'Please specify the current condition of the item.');
            }

            // F. Collection Preference
            const prefVal = document.getElementById('collectionPreference').value;
            if (!prefVal) {
                markInvalid('collectionPreference', 'Please select your collection preference.');
            }

            // H. Privacy Confirmation
            const privacyChecked = document.getElementById('privacyConfirm').checked;
            if (!privacyChecked) {
                markInvalid('privacyConfirm', 'Please confirm that the item details provided are accurate.');
            }

            if (!isValid) {
                if (firstInvalidInput) {
                    firstInvalidInput.focus();
                }
                return;
            }

            // Prevent rapid double submission
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registering...';
            }

            // Generate unique collection ID
            const newId = generateCollectionId();
            const notesVal = (document.getElementById('notes').value || '').trim();

            const record = {
                id: newId,
                itemName: itemNameVal,
                category: categoryVal,
                quantity: quantityNum,
                weightKg: Math.round(weightNum * 100) / 100,
                condition: conditionVal,
                collectionPreference: prefVal,
                notes: notesVal,
                createdAt: new Date().toISOString(),
                status: 'Registered',
                recommendedPathway: null
            };

            // Save to LocalStorage
            const saveResult = window.ECycleStorage.saveRecord(record);

            if (!saveResult.success) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register Item';
                }
                const formAlert = document.getElementById('formGlobalError');
                if (formAlert) {
                    formAlert.textContent = saveResult.error || 'Failed to save record. Storage unavailable.';
                    formAlert.style.display = 'block';
                }
                return;
            }

            currentSubmittedId = newId;

            // Success Transition
            displaySuccessState(record);
            renderRecordsList();
            if (window.ECycleSegregation) {
                window.ECycleSegregation.syncClassifications();
                window.ECycleSegregation.renderSegregationView();
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register Item';
            }
        });
    }

    // ── Form Reset Handler ──
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            clearAllErrors();
            if (safetyNotice) safetyNotice.style.display = 'none';
            if (charCount) charCount.textContent = '400';
            const formAlert = document.getElementById('formGlobalError');
            if (formAlert) formAlert.style.display = 'none';
        });
    }

    // ── Display Success Panel ──
    function displaySuccessState(record) {
        if (!successPanel || !formCard) return;

        // Populate fields safely using textContent
        document.getElementById('resId').textContent = record.id;
        document.getElementById('resItemName').textContent = record.itemName;
        document.getElementById('resCategory').textContent = record.category;
        document.getElementById('resQuantityWeight').textContent = `${record.quantity} unit(s) • ${record.weightKg.toFixed(2)} kg`;
        document.getElementById('resCondition').textContent = record.condition;
        document.getElementById('resPreference').textContent = record.collectionPreference;

        const safetyAlertBox = document.getElementById('resSafetyAlert');
        if (safetyAlertBox) {
            if (record.category === 'Batteries' || record.condition === 'Damaged / Non-working') {
                safetyAlertBox.style.display = 'block';
            } else {
                safetyAlertBox.style.display = 'none';
            }
        }

        formCard.style.display = 'none';
        successPanel.style.display = 'block';
        successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── Success Panel Button Handlers ──
    if (btnRegisterAnother) {
        btnRegisterAnother.addEventListener('click', function () {
            if (form) form.reset();
            clearAllErrors();
            if (safetyNotice) safetyNotice.style.display = 'none';
            if (charCount) charCount.textContent = '400';

            successPanel.style.display = 'none';
            formCard.style.display = 'block';
            document.getElementById('itemName').focus();
        });
    }

    if (btnViewRecord) {
        btnViewRecord.addEventListener('click', function () {
            const recordsSection = document.getElementById('records-section');
            if (recordsSection) {
                recordsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (currentSubmittedId) {
                highlightRecord(currentSubmittedId);
            }
        });
    }

    if (btnViewAllRecords) {
        btnViewAllRecords.addEventListener('click', function () {
            const recordsSection = document.getElementById('records-section');
            if (recordsSection) {
                recordsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    function highlightRecord(id) {
        setTimeout(function () {
            const row = document.querySelector(`[data-record-id="${id}"]`);
            if (row) {
                row.classList.add('record-highlight');
                setTimeout(function () {
                    row.classList.remove('record-highlight');
                }, 3000);
            }
        }, 400);
    }

    // ── Render Collection Records List ──
    function renderRecordsList() {
        if (!recordsContainer) return;

        const allRecords = window.ECycleStorage.getRecords();
        const searchTerm = recordSearch ? recordSearch.value.trim().toLowerCase() : '';
        const selectedCat = categoryFilter ? categoryFilter.value : '';
        const selectedStatus = statusFilter ? statusFilter.value : '';

        // Filter records
        const filtered = allRecords.filter(function (rec) {
            const matchesSearch = !searchTerm ||
                rec.id.toLowerCase().includes(searchTerm) ||
                rec.itemName.toLowerCase().includes(searchTerm);
            const matchesCat = !selectedCat || rec.category === selectedCat;
            const matchesStatus = !selectedStatus || rec.status === selectedStatus;
            return matchesSearch && matchesCat && matchesStatus;
        });

        if (recordsCountSpan) {
            recordsCountSpan.textContent = filtered.length;
        }

        // Empty State
        if (allRecords.length === 0) {
            recordsContainer.innerHTML = '';
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = `
                <div class="empty-state-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        <line x1="9" y1="14" x2="15" y2="14"/>
                    </svg>
                </div>
                <h3>No Collection Records Registered Yet</h3>
                <p>Use the registration form above to submit your first electronic item.</p>
                <a href="#register" class="btn btn-primary btn-sm" style="margin-top: 1rem;">Register First Item</a>
            `;
            recordsContainer.appendChild(emptyDiv);
            return;
        }

        if (filtered.length === 0) {
            recordsContainer.innerHTML = '';
            const noMatchDiv = document.createElement('div');
            noMatchDiv.className = 'empty-state';
            noMatchDiv.innerHTML = `
                <div class="empty-state-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </div>
                <h3>No Matching Records</h3>
                <p>No e-waste items match your current search or filter criteria.</p>
                <button type="button" class="btn btn-outline btn-sm" id="clearFiltersInline" style="margin-top: 1rem;">Clear Filters</button>
            `;
            recordsContainer.appendChild(noMatchDiv);
            const clearInline = document.getElementById('clearFiltersInline');
            if (clearInline) {
                clearInline.addEventListener('click', function () {
                    if (recordSearch) recordSearch.value = '';
                    if (categoryFilter) categoryFilter.value = '';
                    if (statusFilter) statusFilter.value = '';
                    renderRecordsList();
                });
            }
            return;
        }

        // Build Table for Desktop & Cards for Mobile
        recordsContainer.innerHTML = '';

        // Table Element
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'records-table-container';

        const table = document.createElement('table');
        table.className = 'records-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th scope="col">Collection ID</th>
                <th scope="col">Item Name</th>
                <th scope="col">Category</th>
                <th scope="col">Qty &bull; Weight</th>
                <th scope="col">Condition</th>
                <th scope="col">Date Registered</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        filtered.forEach(function (item) {
            const tr = document.createElement('tr');
            tr.setAttribute('data-record-id', item.id);

            // Format date nicely
            let dateFormatted = 'N/A';
            if (item.createdAt) {
                try {
                    const d = new Date(item.createdAt);
                    dateFormatted = d.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                } catch (e) {
                    dateFormatted = item.createdAt.substring(0, 10);
                }
            }

            // Condition badge styling
            let condBadgeClass = 'badge-info';
            if (item.condition === 'Working') condBadgeClass = 'badge-success';
            else if (item.condition === 'Repairable') condBadgeClass = 'badge-warning';
            else if (item.condition === 'Damaged / Non-working') condBadgeClass = 'badge-error';

            tr.innerHTML = `
                <td>
                    <span class="record-id-badge">${escapeHtml(item.id)}</span>
                </td>
                <td>
                    <strong>${escapeHtml(item.itemName)}</strong>
                    ${item.notes ? `<div class="record-table-notes">${escapeHtml(item.notes)}</div>` : ''}
                </td>
                <td>${escapeHtml(item.category)}</td>
                <td>${item.quantity} unit(s)<br><span class="record-sub">${item.weightKg.toFixed(2)} kg</span></td>
                <td><span class="badge ${condBadgeClass}">${escapeHtml(item.condition)}</span></td>
                <td><span class="record-date">${dateFormatted}</span></td>
                <td><span class="badge badge-success"><span class="status-dot active"></span> ${escapeHtml(item.status)}</span></td>
                <td>
                    <button type="button" class="btn btn-outline btn-xs btn-delete-record" data-id="${escapeHtml(item.id)}" title="Delete record">Delete</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        tableWrapper.appendChild(table);

        // Mobile Cards Container (Visible on < 768px via CSS)
        const mobileCardsDiv = document.createElement('div');
        mobileCardsDiv.className = 'records-mobile-cards';

        filtered.forEach(function (item) {
            const card = document.createElement('div');
            card.className = 'mobile-record-card';
            card.setAttribute('data-record-id', item.id);

            let condBadgeClass = 'badge-info';
            if (item.condition === 'Working') condBadgeClass = 'badge-success';
            else if (item.condition === 'Repairable') condBadgeClass = 'badge-warning';
            else if (item.condition === 'Damaged / Non-working') condBadgeClass = 'badge-error';

            card.innerHTML = `
                <div class="mobile-record-header">
                    <span class="record-id-badge">${escapeHtml(item.id)}</span>
                    <span class="badge badge-success">${escapeHtml(item.status)}</span>
                </div>
                <h4 class="mobile-record-title">${escapeHtml(item.itemName)}</h4>
                <div class="mobile-record-detail">
                    <span>Category:</span> <strong>${escapeHtml(item.category)}</strong>
                </div>
                <div class="mobile-record-detail">
                    <span>Quantity & Weight:</span> <strong>${item.quantity} unit(s) • ${item.weightKg.toFixed(2)} kg</strong>
                </div>
                <div class="mobile-record-detail">
                    <span>Condition:</span> <span class="badge ${condBadgeClass}">${escapeHtml(item.condition)}</span>
                </div>
                ${item.notes ? `<div class="mobile-record-notes">"${escapeHtml(item.notes)}"</div>` : ''}
                <div class="mobile-record-footer">
                    <span>Preference: ${escapeHtml(item.collectionPreference)}</span>
                    <button type="button" class="btn btn-outline btn-xs btn-delete-record" data-id="${escapeHtml(item.id)}">Delete</button>
                </div>
            `;
            mobileCardsDiv.appendChild(card);
        });

        recordsContainer.appendChild(tableWrapper);
        recordsContainer.appendChild(mobileCardsDiv);
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

    // ── Search & Filter Listeners ──
    if (recordSearch) {
        recordSearch.addEventListener('input', debounce(renderRecordsList, 200));
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', renderRecordsList);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', renderRecordsList);
    }
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function () {
            if (recordSearch) recordSearch.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (statusFilter) statusFilter.value = '';
            renderRecordsList();
        });
    }

    // ── Delete Record Delegation ──
    if (recordsContainer) {
        recordsContainer.addEventListener('click', function (e) {
            const delBtn = e.target.closest('.btn-delete-record');
            if (delBtn && window.ECycleStorage) {
                const id = delBtn.getAttribute('data-id');
                if (id && confirm('Are you sure you want to delete collection record ' + id + '? This will permanently remove it from your browser store.')) {
                    window.ECycleStorage.deleteRecord(id);
                    renderRecordsList();
                }
            }
        });
    }

    // ── Export and Import Listeners ──
    const exportBtn = document.getElementById('exportRecordsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            if (!window.ECycleStorage) return;
            const jsonStr = window.ECycleStorage.exportRecordsJSON();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `ecycle-records-${today}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    const importBtn = document.getElementById('importRecordsBtn');
    const importInput = document.getElementById('importRecordsInput');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', function () {
            importInput.click();
        });
        importInput.addEventListener('change', function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file || !window.ECycleStorage) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                const res = window.ECycleStorage.importRecordsJSON(evt.target.result);
                if (res.success) {
                    alert(`Successfully imported ${res.importedCount} record(s).${res.rejectedCount ? ` (${res.rejectedCount} duplicates or invalid records skipped)` : ''}`);
                    renderRecordsList();
                } else {
                    alert(res.error || 'Failed to import records.');
                }
                importInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    // ── Data Sync Listener ──
    window.addEventListener('ecycle:datachanged', function () {
        renderRecordsList();
    });

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

    // Initial render on page load
    document.addEventListener('DOMContentLoaded', function () {
        renderRecordsList();
    });

    // In case DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        renderRecordsList();
    }

})();
