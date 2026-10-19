/**
 * E-Cycle — storage.js
 * Centralized LocalStorage manager for E-Waste Collection Records.
 * Provides safe parsing, write error handling, and data integrity checks.
 */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'ecycle_collection_records';

    const StorageManager = {
        /**
         * Check if LocalStorage is available and writable
         * @returns {boolean}
         */
        isAvailable: function () {
            try {
                const testKey = '__ecycle_test__';
                window.localStorage.setItem(testKey, testKey);
                window.localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                return false;
            }
        },

        /**
         * Retrieve all collection records safely
         * @returns {Array<Object>}
         */
        getRecords: function () {
            if (!this.isAvailable()) {
                console.warn('E-Cycle: LocalStorage is not available. Using transient memory.');
                return window.__ecycle_memory_store || [];
            }
            try {
                const raw = window.localStorage.getItem(STORAGE_KEY);
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (err) {
                console.error('E-Cycle: Failed to parse collection records from storage:', err);
                return [];
            }
        },

        /**
         * Save a new collection record
         * @param {Object} record
         * @returns {{ success: boolean, record?: Object, error?: string }}
         */
        saveRecord: function (record) {
            if (!record || typeof record !== 'object') {
                return { success: false, error: 'Invalid record format' };
            }

            if (!record.id || !record.itemName) {
                return { success: false, error: 'Record missing required ID or item name' };
            }

            const records = this.getRecords();

            // Prevent duplicate ID collision
            const exists = records.some(function (r) {
                return r.id === record.id;
            });

            if (exists) {
                return { success: false, error: 'Duplicate collection ID detected' };
            }

            // Prepend new record so latest appears first
            records.unshift(record);

            if (!this.isAvailable()) {
                return {
                    success: false,
                    error: 'Browser storage is disabled or unavailable. Please enable LocalStorage to register e-waste items.'
                };
            }

            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                this.dispatchDataChange('create', record);
                return { success: true, record: record };
            } catch (err) {
                console.error('E-Cycle: Error writing to LocalStorage:', err);
                return {
                    success: false,
                    error: 'Storage limit exceeded or write failure. Please clear space or check browser settings.'
                };
            }
        },

        /**
         * Find a single record by collection ID
         * @param {string} id
         * @returns {Object|null}
         */
        getRecordById: function (id) {
            if (!id) return null;
            const records = this.getRecords();
            return records.find(function (r) {
                return r.id === id;
            }) || null;
        },

        /**
         * Update an existing collection record
         * @param {Object} updatedRecord
         * @returns {{ success: boolean, record?: Object, error?: string }}
         */
        updateRecord: function (updatedRecord) {
            if (!updatedRecord || !updatedRecord.id) {
                return { success: false, error: 'Record missing required ID' };
            }

            const records = this.getRecords();
            const index = records.findIndex(function (r) {
                return r.id === updatedRecord.id;
            });

            if (index === -1) {
                return { success: false, error: 'Record not found' };
            }

            records[index] = updatedRecord;

            if (!this.isAvailable()) {
                window.__ecycle_memory_store = records;
                this.dispatchDataChange('update', updatedRecord);
                return { success: true, record: updatedRecord };
            }

            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                this.dispatchDataChange('update', updatedRecord);
                return { success: true, record: updatedRecord };
            } catch (err) {
                console.error('E-Cycle: Error updating record in LocalStorage:', err);
                return {
                    success: false,
                    error: 'Storage limit exceeded or write failure.'
                };
            }
        },

        /**
         * Helper to clear records (used for testing or explicit user reset)
         */
        clearRecords: function () {
            if (this.isAvailable()) {
                window.localStorage.removeItem(STORAGE_KEY);
            }
            window.__ecycle_memory_store = [];
            this.dispatchDataChange('clear', null);
            return { success: true };
        },

        /**
         * Delete a record by ID
         * @param {string} id
         * @returns {{ success: boolean, error?: string }}
         */
        deleteRecord: function (id) {
            if (!id) return { success: false, error: 'No ID provided' };
            const records = this.getRecords();
            const index = records.findIndex(function (r) { return r.id === id; });
            if (index === -1) {
                return { success: false, error: 'Record not found' };
            }
            const deleted = records.splice(index, 1)[0];
            if (!this.isAvailable()) {
                window.__ecycle_memory_store = records;
                this.dispatchDataChange('delete', deleted);
                return { success: true, record: deleted };
            }
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                this.dispatchDataChange('delete', deleted);
                return { success: true, record: deleted };
            } catch (err) {
                console.error('E-Cycle: Error deleting record from storage:', err);
                return { success: false, error: 'Failed to delete record from storage' };
            }
        },

        // ──────────────────────────────────────────
        // ILLUSTRATIVE RATES CONFIGURATION
        // ──────────────────────────────────────────

        RATE_KEY: 'ecycle_rates',

        DEFAULT_RATES: {
            'Mobile Phones': 100,
            'Computers and Laptops': 80,
            'Computer Peripherals': 50,
            'Chargers and Cables': 30,
            'Batteries': 0, // Battery recovery economics depend on chemistry & require dedicated processing
            'Small Household Electronics': 40,
            'Circuit Boards and Components': 120,
            'Other Electronic Waste': 20
        },

        /**
         * Get illustrative rates (merges custom rates with defaults)
         * @returns {Object} Rates dictionary { [category]: rateInInrPerKg }
         */
        getRates: function () {
            const defaults = Object.assign({}, this.DEFAULT_RATES);
            if (!this.isAvailable()) {
                return Object.assign(defaults, window.__ecycle_rates_memory || {});
            }
            try {
                const raw = window.localStorage.getItem(this.RATE_KEY);
                if (!raw) return defaults;
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    // Only copy finite non-negative numbers
                    Object.keys(parsed).forEach(function (cat) {
                        const val = Number(parsed[cat]);
                        if (!isNaN(val) && isFinite(val) && val >= 0) {
                            defaults[cat] = val;
                        }
                    });
                }
                return defaults;
            } catch (e) {
                console.warn('E-Cycle: Could not load rates, using defaults:', e);
                return defaults;
            }
        },

        /**
         * Save custom illustrative rates
         * @param {Object} newRates
         * @returns {{ success: boolean, rates?: Object, error?: string }}
         */
        saveRates: function (newRates) {
            if (!newRates || typeof newRates !== 'object') {
                return { success: false, error: 'Invalid rate format' };
            }
            const cleanRates = {};
            for (const cat in newRates) {
                const val = Number(newRates[cat]);
                if (isNaN(val) || !isFinite(val) || val < 0) {
                    return { success: false, error: 'Rates must be valid, finite non-negative numbers.' };
                }
                cleanRates[cat] = Math.round(val * 100) / 100;
            }
            if (!this.isAvailable()) {
                window.__ecycle_rates_memory = cleanRates;
                this.dispatchDataChange('rates_updated', cleanRates);
                return { success: true, rates: cleanRates };
            }
            try {
                window.localStorage.setItem(this.RATE_KEY, JSON.stringify(cleanRates));
                this.dispatchDataChange('rates_updated', cleanRates);
                return { success: true, rates: cleanRates };
            } catch (err) {
                console.error('E-Cycle: Failed to persist rates:', err);
                return { success: false, error: 'Failed to save rates to storage.' };
            }
        },

        /**
         * Reset illustrative rates to default demonstration values
         */
        resetRates: function () {
            if (this.isAvailable()) {
                window.localStorage.removeItem(this.RATE_KEY);
            }
            window.__ecycle_rates_memory = null;
            const defaults = Object.assign({}, this.DEFAULT_RATES);
            this.dispatchDataChange('rates_updated', defaults);
            return { success: true, rates: defaults };
        },

        /**
         * Get illustrative rate for specific category
         * @param {string} category
         * @returns {number|null} Rate in INR or null if unconfigured
         */
        getRateForCategory: function (category) {
            if (!category) return null;
            const rates = this.getRates();
            return Object.prototype.hasOwnProperty.call(rates, category) ? rates[category] : null;
        },

        // ──────────────────────────────────────────
        // APPLICATION SYNCHRONIZATION EVENT SYSTEM
        // ──────────────────────────────────────────

        /**
         * Broadcast data modification event across modules
         * @param {string} action
         * @param {any} payload
         */
        dispatchDataChange: function (action, payload) {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                try {
                    const evt = new CustomEvent('ecycle:datachanged', {
                        detail: { action: action, payload: payload, timestamp: new Date().toISOString() }
                    });
                    window.dispatchEvent(evt);
                } catch (e) {
                    // Fallback for older environments
                }
            }
        },

        // ──────────────────────────────────────────
        // DATA EXPORT & VALIDATED IMPORT
        // ──────────────────────────────────────────

        /**
         * Export valid collection records as JSON string
         * @returns {string} JSON string
         */
        exportRecordsJSON: function () {
            const records = this.getRecords();
            const exportPayload = {
                appName: 'E-Cycle Smart E-Waste Platform',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                recordCount: records.length,
                records: records
            };
            return JSON.stringify(exportPayload, null, 2);
        },

        /**
         * Validate and import JSON records
         * @param {string|Object} input
         * @returns {{ success: boolean, importedCount: number, error?: string, rejectedCount?: number }}
         */
        importRecordsJSON: function (input) {
            let data = input;
            if (typeof input === 'string') {
                try {
                    data = JSON.parse(input);
                } catch (e) {
                    return { success: false, importedCount: 0, error: 'Malformed JSON file. Please provide valid JSON.' };
                }
            }
            if (!data || typeof data !== 'object') {
                return { success: false, importedCount: 0, error: 'Invalid file format: Root must be an object.' };
            }
            const itemsToImport = Array.isArray(data) ? data : data.records;
            if (!Array.isArray(itemsToImport)) {
                return { success: false, importedCount: 0, error: 'No valid records array found in imported data.' };
            }

            const currentRecords = this.getRecords();
            const existingIdMap = new Set(currentRecords.map(function (r) { return r.id; }));
            const seenInFile = new Set();
            const validNewRecords = [];
            let rejectedCount = 0;

            for (let i = 0; i < itemsToImport.length; i++) {
                const item = itemsToImport[i];
                if (!item || typeof item !== 'object') {
                    rejectedCount++;
                    continue;
                }
                // Validate required fields
                if (!item.id || typeof item.id !== 'string') {
                    rejectedCount++;
                    continue;
                }
                if (!item.itemName || typeof item.itemName !== 'string') {
                    rejectedCount++;
                    continue;
                }
                const weight = Number(item.weightKg);
                if (isNaN(weight) || weight <= 0) {
                    rejectedCount++;
                    continue;
                }
                // Check duplicate against existing records and file duplicates
                if (existingIdMap.has(item.id) || seenInFile.has(item.id)) {
                    rejectedCount++;
                    continue;
                }

                seenInFile.add(item.id);

                const normalizedRecord = {
                    id: String(item.id).trim(),
                    itemName: String(item.itemName).trim(),
                    category: String(item.category || 'Other Electronic Waste').trim(),
                    quantity: parseInt(item.quantity, 10) || 1,
                    weightKg: Math.round(weight * 100) / 100,
                    condition: String(item.condition || 'Unknown').trim(),
                    collectionPreference: String(item.collectionPreference || 'Drop-off at Local Center').trim(),
                    notes: String(item.notes || '').trim(),
                    createdAt: item.createdAt || new Date().toISOString(),
                    status: item.status || 'Registered',
                    recommendedPathway: item.recommendedPathway || null
                };

                // Classify if classification engine available
                if (window.classifyEWaste) {
                    const res = window.classifyEWaste(normalizedRecord);
                    normalizedRecord.recommendedPathway = res.recommendedPathway;
                    normalizedRecord.classification = res;
                    normalizedRecord.classifiedAt = new Date().toISOString();
                }

                validNewRecords.push(normalizedRecord);
            }

            if (validNewRecords.length === 0) {
                return {
                    success: false,
                    importedCount: 0,
                    rejectedCount: rejectedCount,
                    error: 'No valid records could be imported. Records may be duplicate or miss required fields.'
                };
            }

            // Merge new records at front
            const updated = validNewRecords.concat(currentRecords);
            try {
                if (this.isAvailable()) {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                } else {
                    window.__ecycle_memory_store = updated;
                }
                this.dispatchDataChange('import', { count: validNewRecords.length });
                return {
                    success: true,
                    importedCount: validNewRecords.length,
                    rejectedCount: rejectedCount
                };
            } catch (err) {
                console.error('E-Cycle: Error writing imported records:', err);
                return { success: false, importedCount: 0, error: 'Storage write failure during import.' };
            }
        },
        clearAll: function () {
            if (this.isAvailable()) {
                window.localStorage.removeItem(STORAGE_KEY);
            }
            window.__ecycle_memory_store = [];
        }
    };

    // Expose to window for application modules
    window.ECycleStorage = StorageManager;

})(window);
