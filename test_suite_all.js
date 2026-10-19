/**
 * Comprehensive Automated Test Suite for E-Cycle Platform
 * Tests Steps 5, 6, 7, 8 & 9 End-to-End
 */

const fs = require('fs');
const path = require('path');

// ── Mock Browser Environment ──
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem: function (key, value) {
            store[key] = String(value);
        },
        removeItem: function (key) {
            delete store[key];
        },
        clear: function () {
            store = {};
        }
    };
})();

global.window = {
    localStorage: localStorageMock,
    addEventListener: () => {},
    dispatchEvent: () => {},
    matchMedia: () => ({ matches: false })
};

global.document = {
    _elements: {},
    addEventListener: () => {},
    createElement: function (tag) {
        return {
            tagName: tag.toUpperCase(),
            classList: {
                _classes: new Set(),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); }
            },
            setAttribute(k, v) { this[k] = v; },
            removeAttribute(k) { delete this[k]; },
            appendChild(child) { this.children = this.children || []; this.children.push(child); },
            children: [],
            querySelectorAll() { return []; },
            innerHTML: '',
            textContent: '',
            style: {}
        };
    },
    getElementById: function (id) {
        if (!this._elements[id]) {
            this._elements[id] = {
                id: id,
                innerHTML: '',
                textContent: '',
                value: '',
                style: {},
                children: [],
                classList: {
                    add() {},
                    remove() {},
                    contains() { return false; }
                },
                appendChild() {},
                setAttribute() {},
                removeAttribute() {},
                addEventListener() {}
            };
        }
        return this._elements[id];
    },
    querySelectorAll: function () {
        return [];
    }
};

global.CustomEvent = function (type, params) {
    this.type = type;
    this.detail = params ? params.detail : null;
};

// ── Load Core Modules ──
const storageCode = fs.readFileSync(path.join(__dirname, 'js', 'storage.js'), 'utf8');
const segregationCode = fs.readFileSync(path.join(__dirname, 'js', 'segregation.js'), 'utf8');
const circularCode = fs.readFileSync(path.join(__dirname, 'js', 'circular.js'), 'utf8');
const estimatorCode = fs.readFileSync(path.join(__dirname, 'js', 'estimator.js'), 'utf8');
const dashboardCode = fs.readFileSync(path.join(__dirname, 'js', 'dashboard.js'), 'utf8');

eval(storageCode);
eval(segregationCode);
eval(circularCode);
eval(estimatorCode);
eval(dashboardCode);

let passedCount = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedCount++;
        console.log(`  [PASS] Test ${totalTests}: ${message}`);
    } else {
        console.error(`  [FAIL] Test ${totalTests}: ${message}`);
        process.exitCode = 1;
    }
}

console.log('=====================================================');
console.log('E-CYCLE COMPREHENSIVE AUTOMATED VERIFICATION SUITE');
console.log('=====================================================\n');

// ──────────────────────────────────────────────────────────
// TEST BLOCK 1: STEP 5 — CIRCULAR ECONOMY WORKFLOW
// ──────────────────────────────────────────────────────────
console.log('--- TEST BLOCK 1: CIRCULAR ECONOMY WORKFLOW ---');

// Clean slate
window.localStorage.clear();

// Test 1: Empty state
assert(window.ECycleStorage.getRecords().length === 0, 'No collection records initially present.');

// Test 2: Working Laptop -> REUSE pathway
const workingLaptop = {
    id: 'EW-20261019-TEST01',
    itemName: 'Dell XPS 13',
    category: 'Computers and Laptops',
    quantity: 1,
    weightKg: 1.45,
    condition: 'Working',
    collectionPreference: 'Drop-off at Local Center',
    notes: 'Boots up perfectly, clean screen',
    createdAt: new Date().toISOString(),
    status: 'Registered'
};
const save1 = window.ECycleStorage.saveRecord(workingLaptop);
assert(save1.success, 'Working laptop registered successfully.');

const class1 = window.classifyEWaste(workingLaptop);
assert(class1.recommendedPathway === 'REUSE', 'Working laptop classified as REUSE pathway.');

// Test 3: Repairable Keyboard -> REPAIR pathway
const repairableKeyboard = {
    id: 'EW-20261019-TEST02',
    itemName: 'Mechanical Keyboard',
    category: 'Computer Peripherals',
    quantity: 1,
    weightKg: 1.20,
    condition: 'Repairable',
    collectionPreference: 'Drop-off at Local Center',
    notes: 'Sticky spacebar switch',
    createdAt: new Date().toISOString(),
    status: 'Registered'
};
window.ECycleStorage.saveRecord(repairableKeyboard);
const class2 = window.classifyEWaste(repairableKeyboard);
assert(class2.recommendedPathway === 'REPAIR', 'Repairable keyboard classified as REPAIR pathway.');

// Test 4: Damaged Device -> AUTHORIZED_RECYCLING pathway
const damagedDevice = {
    id: 'EW-20261019-TEST03',
    itemName: 'Shattered CRT Monitor',
    category: 'Computer Peripherals',
    quantity: 1,
    weightKg: 8.50,
    condition: 'Damaged / Non-working',
    collectionPreference: 'Home / Business Pickup',
    notes: 'Cracked tube and casing',
    createdAt: new Date().toISOString(),
    status: 'Registered'
};
window.ECycleStorage.saveRecord(damagedDevice);
const class3 = window.classifyEWaste(damagedDevice);
assert(class3.recommendedPathway === 'AUTHORIZED_RECYCLING', 'Damaged electronic classified as AUTHORIZED_RECYCLING.');

// Test 5: Swollen Battery -> SPECIAL_HANDLING pathway (Priority safety)
const swollenBattery = {
    id: 'EW-20261019-TEST04',
    itemName: 'Li-Ion Battery Pack',
    category: 'Batteries',
    quantity: 2,
    weightKg: 0.60,
    condition: 'Damaged / Non-working',
    collectionPreference: 'Drop-off at Local Center',
    notes: 'Swollen pouch cell, warm to touch',
    createdAt: new Date().toISOString(),
    status: 'Registered'
};
window.ECycleStorage.saveRecord(swollenBattery);
const class4 = window.classifyEWaste(swollenBattery);
assert(class4.recommendedPathway === 'SPECIAL_HANDLING', 'Swollen battery immediately classified as SPECIAL_HANDLING.');
assert(class4.safetyWarning && class4.safetyWarning.includes('Never dismantle'), 'Battery safety warning explicitly instructs not to dismantle.');

// Test 6: Unknown Condition -> MANUAL_REVIEW
const unknownDevice = {
    id: 'EW-20261019-TEST05',
    itemName: 'Old Audio Receiver',
    category: 'Small Household Electronics',
    quantity: 1,
    weightKg: 4.10,
    condition: 'Unknown',
    collectionPreference: 'Drop-off at Local Center',
    notes: 'Untested estate equipment',
    createdAt: new Date().toISOString(),
    status: 'Registered'
};
window.ECycleStorage.saveRecord(unknownDevice);
const class5 = window.classifyEWaste(unknownDevice);
assert(class5.recommendedPathway === 'MANUAL_REVIEW', 'Unknown condition equipment classified as MANUAL_REVIEW.');

// ──────────────────────────────────────────────────────────
// TEST BLOCK 2: STEP 6 — ECONOMIC VALUE ESTIMATOR
// ──────────────────────────────────────────────────────────
console.log('\n--- TEST BLOCK 2: ECONOMIC VALUE ESTIMATOR ---');

const currentRates = window.ECycleStorage.getRates();
assert(currentRates['Computers and Laptops'] === 80, 'Default laptop illustrative rate is ₹80/kg.');
assert(currentRates['Computer Peripherals'] === 50, 'Default peripheral rate is ₹50/kg.');
assert(currentRates['Batteries'] === 0, 'Default battery educational rate is ₹0/kg (dedicated recovery stream).');

// Test 7: Item valuation calculation (2 kg laptop @ ₹80/kg = ₹160)
const testLaptop2Kg = { category: 'Computers and Laptops', weightKg: 2.00 };
const est1 = window.ECycleEstimator.evaluateItemEstimate(testLaptop2Kg, currentRates);
assert(est1.isEligible && est1.value === 160.00, `2.00 kg laptop @ ₹80/kg evaluates to ₹160.00 (got: ${est1.value})`);

// Test 8: Item valuation calculation (1.5 kg peripheral @ ₹50/kg = ₹75)
const testPeripheral15Kg = { category: 'Computer Peripherals', weightKg: 1.50 };
const est2 = window.ECycleEstimator.evaluateItemEstimate(testPeripheral15Kg, currentRates);
assert(est2.isEligible && est2.value === 75.00, `1.50 kg peripheral @ ₹50/kg evaluates to ₹75.00 (got: ${est2.value})`);

// Test 9: Rate configuration change (change laptop to ₹100/kg -> ₹200)
const updatedRates = Object.assign({}, currentRates, { 'Computers and Laptops': 100 });
const saveRateRes = window.ECycleStorage.saveRates(updatedRates);
assert(saveRateRes.success, 'Successfully persisted updated rates.');

const estUpdated = window.ECycleEstimator.evaluateItemEstimate(testLaptop2Kg, window.ECycleStorage.getRates());
assert(estUpdated.value === 200.00, `Laptop valuation updated to ₹200.00 after rate change to ₹100/kg (got: ${estUpdated.value})`);

// Reset rates back to defaults
window.ECycleStorage.resetRates();
assert(window.ECycleStorage.getRates()['Computers and Laptops'] === 80, 'Reset rates restored demonstration default of ₹80/kg.');

// Test 10: Reject invalid/negative rate
const negRateRes = window.ECycleStorage.saveRates({ 'Computers and Laptops': -25 });
assert(!negRateRes.success, 'Negative rate was correctly rejected.');

// Test 11: Unconfigured category rate
const unconfiguredItem = { category: 'Solar Panels', weightKg: 15.00 };
const estUnconfig = window.ECycleEstimator.evaluateItemEstimate(unconfiguredItem, window.ECycleStorage.getRates());
assert(!estUnconfig.isEligible && estUnconfig.statusText === 'Rate Not Configured', 'Unconfigured category is flagged and excluded from estimate.');

// Test 12: Invalid weight handling
const invalidWeightItem = { category: 'Computers and Laptops', weightKg: -5.00 };
const estInvWeight = window.ECycleEstimator.evaluateItemEstimate(invalidWeightItem, window.ECycleStorage.getRates());
assert(!estInvWeight.isEligible && estInvWeight.statusText === 'Invalid Weight', 'Negative or invalid weight is flagged and excluded.');

// ──────────────────────────────────────────────────────────
// TEST BLOCK 3: STEP 7 — LIVE ANALYTICS DASHBOARD
// ──────────────────────────────────────────────────────────
console.log('\n--- TEST BLOCK 3: LIVE ANALYTICS DASHBOARD ---');

const allStored = window.ECycleStorage.getRecords();
const dashData = window.ECycleDashboard.computeData(allStored);

// Test 13: Registered items KPI
assert(dashData.totalItemsCount === 5, `Registered items count matches 5 unique records (got: ${dashData.totalItemsCount})`);

// Test 14: Weight total without double-counting quantity
// Weights: 1.45 + 1.20 + 8.50 + 0.60 + 4.10 = 15.85 kg
assert(dashData.totalValidWeight === 15.85, `Total valid weight correctly sums to 15.85 kg without quantity multiplication (got: ${dashData.totalValidWeight})`);

// Test 15: Reuse & Repair recommendations count
// workingLaptop (REUSE) + repairableKeyboard (REPAIR) = 2
assert(dashData.reuseRepairCount === 2, `Reuse & Repair KPI equals 2 (got: ${dashData.reuseRepairCount})`);

// Test 16: Recycling & Special Handling count
// damagedDevice (AUTHORIZED_RECYCLING) + swollenBattery (SPECIAL_HANDLING) = 2
assert(dashData.recycleSpecialCount === 2, `Recycling & Hazard KPI equals 2 (got: ${dashData.recycleSpecialCount})`);

// Test 17: Category distribution accuracy
assert(dashData.categoryMap['Computer Peripherals'].count === 2, 'Computer Peripherals category count equals 2 records.');

// Test 18: Pathway distribution accuracy
assert(dashData.pathwayMap.REUSE.count === 1, 'Pathway map reflects 1 REUSE recommendation.');
assert(dashData.pathwayMap.SPECIAL_HANDLING.count === 1, 'Pathway map reflects 1 SPECIAL_HANDLING recommendation.');

// ──────────────────────────────────────────────────────────
// TEST BLOCK 4: STEP 8 — DATA MANAGEMENT, SYNC & EXPORT
// ──────────────────────────────────────────────────────────
console.log('\n--- TEST BLOCK 4: DATA MANAGEMENT & EXPORT/IMPORT ---');

// Test 19: Export records to JSON
const exportJson = window.ECycleStorage.exportRecordsJSON();
const parsedExport = JSON.parse(exportJson);
assert(parsedExport.appName && parsedExport.recordCount === 5 && parsedExport.records.length === 5, 'Data export generated valid schema with all 5 records.');

// Test 20: Import rejection of duplicate collection IDs
const duplicateImportPayload = {
    records: [
        { id: 'EW-20261019-TEST01', itemName: 'Duplicate Laptop', category: 'Computers and Laptops', weightKg: 2 }
    ]
};
const importDupRes = window.ECycleStorage.importRecordsJSON(duplicateImportPayload);
assert(!importDupRes.success && importDupRes.importedCount === 0, 'Import safely rejected record with duplicate collection ID.');

// Test 21: Import valid new record
const validNewPayload = {
    records: [
        {
            id: 'EW-20261019-IMPORT01',
            itemName: 'Imported Tablet',
            category: 'Mobile Phones',
            quantity: 1,
            weightKg: 0.45,
            condition: 'Working'
        }
    ]
};
const importSuccessRes = window.ECycleStorage.importRecordsJSON(validNewPayload);
assert(importSuccessRes.success && importSuccessRes.importedCount === 1, 'Import successfully parsed and merged valid new record.');
assert(window.ECycleStorage.getRecords().length === 6, 'Total stored records updated to 6 after import.');

// Test 22: Safe delete record with ID
const delRes = window.ECycleStorage.deleteRecord('EW-20261019-IMPORT01');
assert(delRes.success, 'Successfully deleted record by ID.');
assert(window.ECycleStorage.getRecords().length === 5, 'Records count returned to 5 after deletion.');

// Test 23: Malformed JSON rejection
const malformedRes = window.ECycleStorage.importRecordsJSON('{{invalid_json}}');
assert(!malformedRes.success, 'Malformed JSON string caught and rejected gracefully without crashing.');

console.log('\n=====================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedCount} | FAILED: ${totalTests - passedCount}`);
console.log('=====================================================');
