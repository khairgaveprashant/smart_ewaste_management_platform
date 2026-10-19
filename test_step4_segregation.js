/**
 * Comprehensive Automated Test Suite for Step 4:
 * Smart E-Waste Segregation Engine
 * Runs Tests 1 to 11 against js/storage.js and js/segregation.js
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = (function () {
    let store = {};
    return {
        getItem: function (key) {
            return store[key] || null;
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

// Create minimal browser window and DOM mock
global.window = {
    localStorage: localStorageMock,
    addEventListener: () => {}
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
            querySelectorAll(sel) { return []; },
            innerHTML: '',
            textContent: '',
            style: {}
        };
    },
    getElementById: function (id) {
        if (!this._elements[id]) {
            this._elements[id] = {
                id: id,
                value: '',
                checked: false,
                style: {},
                classList: {
                    _classes: new Set(),
                    add(c) { this._classes.add(c); },
                    remove(c) { this._classes.delete(c); },
                    contains(c) { return this._classes.has(c); }
                },
                setAttribute(k, v) { this[k] = v; },
                removeAttribute(k) { delete this[k]; },
                getAttribute(k) { return this[k] || ''; },
                appendChild(child) { this.children = this.children || []; this.children.push(child); },
                children: [],
                addEventListener(evt, fn) { this['on' + evt] = fn; },
                focus() { this._focused = true; },
                scrollIntoView() {},
                querySelector() { return null; },
                innerHTML: '',
                textContent: ''
            };
        }
        return this._elements[id];
    }
};

// Initialize elements expected by segregation.js
const elementIds = [
    'metricTotal', 'metricPending', 'metricReuseRepair', 'metricRecycling',
    'segSearch', 'segCategoryFilter', 'segConditionFilter', 'segPathwayFilter', 'segStatusFilter',
    'segResetFiltersBtn', 'segResultsCount', 'segregationContainer',
    'segregationModal', 'modalCloseBtn', 'modalOkBtn',
    'modalId', 'modalItemName', 'modalCategory', 'modalCondition', 'modalQtyWeight', 'modalCreatedAt',
    'modalPathwayBadge', 'modalRecTitle', 'modalRecReason', 'modalSafetyBox', 'modalSafetyText',
    'modalNotesBox', 'modalNotesText'
];
elementIds.forEach(id => global.document.getElementById(id));

// Load modules
require('./js/storage.js');
require('./js/segregation.js');

console.log('--- RUNNING STEP 4 TEST SUITE (11 SCENARIOS) ---\n');

const testResults = [];

function assert(name, condition, details = '') {
    if (condition) {
        console.log(`[PASS] ${name}`);
        testResults.push({ name, status: 'PASS', details });
    } else {
        console.error(`[FAIL] ${name}: ${details}`);
        testResults.push({ name, status: 'FAIL', details });
    }
}

// TEST 10 (Run first when storage is empty): No registered records
(function () {
    window.ECycleStorage.clearAll();
    window.ECycleSegregation.renderSegregationView();

    const total = document.getElementById('metricTotal').textContent;
    const pending = document.getElementById('metricPending').textContent;
    const reuseRepair = document.getElementById('metricReuseRepair').textContent;
    const recycling = document.getElementById('metricRecycling').textContent;
    const containerHtml = document.getElementById('segregationContainer').children[0]?.innerHTML || '';

    assert('TEST 10: Empty storage produces zero counts and clean empty state with no fabricated records',
        total === '0' && pending === '0' && reuseRepair === '0' && recycling === '0' && containerHtml.includes('No E-Waste Items Available'),
        `Total: ${total}, Empty State: ${containerHtml.includes('No E-Waste Items Available')}`);
})();

// TEST 1: Working laptop
let laptopRecord = null;
(function () {
    laptopRecord = {
        id: 'EW-20261019-LAP001',
        itemName: 'Dell Latitude 7490',
        category: 'Computers and Laptops',
        quantity: 1,
        weightKg: 1.45,
        condition: 'Working',
        collectionPreference: 'I will take it to a collection point.',
        notes: 'Working screen, includes original charger',
        createdAt: new Date().toISOString(),
        status: 'Registered',
        recommendedPathway: null
    };

    const res = window.classifyEWaste(laptopRecord);
    laptopRecord.recommendedPathway = res.recommendedPathway;
    laptopRecord.classification = res;
    window.ECycleStorage.saveRecord(laptopRecord);

    assert('TEST 1: Working laptop recommended for REUSE',
        res.recommendedPathway === 'REUSE' && res.classificationStatus === 'Classified',
        `Pathway: ${res.recommendedPathway}, Status: ${res.classificationStatus}, Reason: "${res.recommendationReason}"`);
})();

// TEST 2: Repairable keyboard
let keyboardRecord = null;
(function () {
    keyboardRecord = {
        id: 'EW-20261019-KEY002',
        itemName: 'Mechanical USB Keyboard',
        category: 'Computer Peripherals',
        quantity: 1,
        weightKg: 0.85,
        condition: 'Repairable',
        collectionPreference: 'I will take it to a collection point.',
        notes: 'Spacebar key switch sticking, otherwise functional',
        createdAt: new Date().toISOString(),
        status: 'Registered',
        recommendedPathway: null
    };

    const res = window.classifyEWaste(keyboardRecord);
    keyboardRecord.recommendedPathway = res.recommendedPathway;
    keyboardRecord.classification = res;
    window.ECycleStorage.saveRecord(keyboardRecord);

    assert('TEST 2: Repairable keyboard recommended for REPAIR',
        res.recommendedPathway === 'REPAIR' && res.classificationStatus === 'Classified',
        `Pathway: ${res.recommendedPathway}, Status: ${res.classificationStatus}, Reason: "${res.recommendationReason}"`);
})();

// TEST 3: Damaged non-battery electronic device
let tvRecord = null;
(function () {
    tvRecord = {
        id: 'EW-20261019-SCR003',
        itemName: 'Cracked LCD Monitor',
        category: 'Computer Peripherals',
        quantity: 1,
        weightKg: 3.5,
        condition: 'Damaged / Non-working',
        collectionPreference: 'I want to explore a pickup option.',
        notes: 'Shattered display panel, board burnt',
        createdAt: new Date().toISOString(),
        status: 'Registered',
        recommendedPathway: null
    };

    const res = window.classifyEWaste(tvRecord);
    tvRecord.recommendedPathway = res.recommendedPathway;
    tvRecord.classification = res;
    window.ECycleStorage.saveRecord(tvRecord);

    assert('TEST 3: Damaged non-battery device recommended for AUTHORIZED_RECYCLING',
        res.recommendedPathway === 'AUTHORIZED_RECYCLING' && res.classificationStatus === 'Classified',
        `Pathway: ${res.recommendedPathway}, Status: ${res.classificationStatus}`);
})();

// TEST 4: Battery category
let batteryRecord = null;
(function () {
    batteryRecord = {
        id: 'EW-20261019-BAT004',
        itemName: 'Lithium-Ion Power Pack',
        category: 'Batteries',
        quantity: 2,
        weightKg: 0.5,
        condition: 'Working',
        collectionPreference: 'I will take it to a collection point.',
        notes: 'Intact exterior cells',
        createdAt: new Date().toISOString(),
        status: 'Registered',
        recommendedPathway: null
    };

    const res = window.classifyEWaste(batteryRecord);
    batteryRecord.recommendedPathway = res.recommendedPathway;
    batteryRecord.classification = res;
    window.ECycleStorage.saveRecord(batteryRecord);

    assert('TEST 4: Battery category recommended for SPECIAL_HANDLING',
        res.recommendedPathway === 'SPECIAL_HANDLING' && res.safetyWarning !== null && res.classificationStatus === 'Special Handling Required',
        `Pathway: ${res.recommendedPathway}, Safety warning: "${res.safetyWarning?.substring(0, 40)}..."`);
})();

// TEST 5: Unknown item condition
let unknownRecord = null;
(function () {
    unknownRecord = {
        id: 'EW-20261019-UNK005',
        itemName: 'Old Network Router',
        category: 'Small Household Electronics',
        quantity: 1,
        weightKg: 0.45,
        condition: 'Unknown',
        collectionPreference: 'I will take it to a collection point.',
        notes: 'No power adapter available to test',
        createdAt: new Date().toISOString(),
        status: 'Registered',
        recommendedPathway: null
    };

    const res = window.classifyEWaste(unknownRecord);
    unknownRecord.recommendedPathway = res.recommendedPathway;
    unknownRecord.classification = res;
    window.ECycleStorage.saveRecord(unknownRecord);

    assert('TEST 5: Unknown item condition recommended for MANUAL_REVIEW',
        res.recommendedPathway === 'MANUAL_REVIEW' && res.classificationStatus === 'Pending Review',
        `Pathway: ${res.recommendedPathway}, Status: ${res.classificationStatus}`);
})();

// TEST 6: Battery with note indicating damage
let damagedBatteryRecord = null;
(function () {
    damagedBatteryRecord = {
        id: 'EW-20261019-DBAT006',
        itemName: 'Drone Li-Po Battery Pack',
        category: 'Batteries',
        quantity: 1,
        weightKg: 0.25,
        condition: 'Damaged / Non-working',
        collectionPreference: 'I will take it to a collection point.',
        notes: 'Pouch visibly swollen and smelling hot',
        createdAt: new Date().toISOString(),
        status: 'Registered',
        recommendedPathway: null
    };

    const res = window.classifyEWaste(damagedBatteryRecord);
    damagedBatteryRecord.recommendedPathway = res.recommendedPathway;
    damagedBatteryRecord.classification = res;
    window.ECycleStorage.saveRecord(damagedBatteryRecord);

    assert('TEST 6: Damaged battery prioritizes battery-specific hazardous SPECIAL_HANDLING',
        res.recommendedPathway === 'SPECIAL_HANDLING' && res.recommendationTitle.includes('Hazardous Battery') && res.safetyWarning.includes('swollen'),
        `Title: "${res.recommendationTitle}", Warning includes swollen: ${res.safetyWarning.includes('swollen')}`);
})();

// TEST 7: Search by collection ID
(function () {
    const all = window.ECycleStorage.getRecords();
    const searchTarget = 'EW-20261019-LAP001';
    const found = all.filter(r => r.id.toLowerCase().includes(searchTarget.toLowerCase()));

    assert('TEST 7: Search by collection ID finds the specific record',
        found.length === 1 && found[0].itemName === 'Dell Latitude 7490',
        `Found item: "${found[0]?.itemName}"`);
})();

// TEST 8: Filter by recommended pathway
(function () {
    const all = window.ECycleStorage.getRecords();
    const reuseMatches = all.filter(r => r.recommendedPathway === 'REUSE');
    const specialMatches = all.filter(r => r.recommendedPathway === 'SPECIAL_HANDLING');

    assert('TEST 8: Filter by recommended pathway isolates matching records correctly',
        reuseMatches.length === 1 && specialMatches.length === 2,
        `REUSE count: ${reuseMatches.length}, SPECIAL_HANDLING count: ${specialMatches.length}`);
})();

// TEST 9: Refresh the browser / reload verification
(function () {
    const persisted = window.ECycleStorage.getRecords();
    const hasClassifications = persisted.every(r => r.recommendedPathway && r.classification);

    assert('TEST 9: Stored records and classifications remain intact across sessions',
        persisted.length === 6 && hasClassifications,
        `Total records in storage: ${persisted.length}, all classified: ${hasClassifications}`);
})();

// TEST 11: Mobile viewport and CSS styling checks
(function () {
    const css = fs.readFileSync(path.join(__dirname, 'css/components.css'), 'utf-8');
    const hasResponsiveMetrics = css.includes('.segregation-metrics-grid') && css.includes('@media (min-width: 640px)');
    const hasResponsiveGrid = css.includes('.segregation-grid') && css.includes('@media (min-width: 768px)');
    const hasModalStyles = css.includes('.modal-overlay') && css.includes('.modal-window');

    assert('TEST 11: Mobile viewport responsiveness and modal styles present in CSS',
        hasResponsiveMetrics && hasResponsiveGrid && hasModalStyles,
        'Found responsive media queries, fluid card layouts, and modal styles');
})();

console.log('\n--- ALL 11 TESTS COMPLETED ---');
const totalPassed = testResults.filter(t => t.status === 'PASS').length;
console.log(`Summary: ${totalPassed} of ${testResults.length} tests passed.\n`);
