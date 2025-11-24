// --- Constants & Config ---
const STORAGE_KEY = 'office_tracker_data_v2';
const WORKDAY_MS = 9 * 60 * 60 * 1000;
const CIRCUMFERENCE = 2 * Math.PI * 130; // r=130

// --- Initial State ---
const INITIAL_STATE = {
    isSetup: false,
    mode: 'MANUAL', // 'GPS' | 'MANUAL'
    officeLocation: null, // { name, latitude, longitude, radius }
    startTime: null,
    isActive: false,
    history: [
        { date: '2023-10-24', duration: 8.5 * 3600000 },
        { date: '2023-10-25', duration: 9.1 * 3600000 },
        { date: '2023-10-26', duration: 8.8 * 3600000 },
        { date: '2023-10-27', duration: 9.0 * 3600000 },
        { date: '2023-10-28', duration: 4.0 * 3600000 },
    ]
};

// --- App Context ---
let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || INITIAL_STATE;
let geoWatchId = null;
let timerInterval = null;
let currentGeo = { lat: null, lng: null, accuracy: null, dist: null };
let els = {}; // Elements cache

// --- Initialization ---
function init() {
    // Cache Elements safely inside init
    els = {
        screens: {
            setup: document.getElementById('setup-screen'),
            dashboard: document.getElementById('dashboard-screen'),
            settings: document.getElementById('settings-modal'),
        },
        setup: {
            status: document.getElementById('setup-gps-status'),
            btnSet: document.getElementById('btn-set-location'),
            btnSkip: document.getElementById('btn-skip-setup'),
        },
        dash: {
            modeIndicator: document.getElementById('mode-indicator'),
            modeText: document.getElementById('mode-text'),
            offlineIcon: document.getElementById('offline-indicator'),
            btnSettings: document.getElementById('btn-open-settings'),
            timer: document.getElementById('timer-display'),
            percentage: document.getElementById('percentage-display'),
            ring: document.getElementById('progress-ring-circle'),
            expectedEnd: document.getElementById('expected-end-display'),
            remaining: document.getElementById('remaining-display'),
            btnAction: document.getElementById('btn-main-action'),
            gpsWaitText: document.getElementById('gps-waiting-text'),
            chart: document.getElementById('history-chart'),
        },
        settings: {
            btnClose: document.getElementById('btn-close-settings'),
            btnModeGps: document.getElementById('btn-mode-gps'),
            btnModeManual: document.getElementById('btn-mode-manual'),
            officeInfo: document.getElementById('settings-office-info'),
            officeDetails: document.getElementById('settings-office-details'),
            btnToggleRadius: document.getElementById('btn-toggle-radius'),
            btnReset: document.getElementById('btn-reset-data'),
        }
    };

    // Ensure icons are loaded
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    setupEventListeners();
    
    // Check Notification Permission
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Network Status
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    // Start Loops
    startGeoWatch();
    startTimerLoop();

    // Initial Render
    render();
}

// --- Logic ---

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateState(updates) {
    state = { ...state, ...updates };
    persist();
    render();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// --- Geolocation ---
function startGeoWatch() {
    if (!navigator.geolocation) return;

    // Clear existing
    if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);

    geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            currentGeo.lat = latitude;
            currentGeo.lng = longitude;
            currentGeo.accuracy = accuracy;
            
            // Update Setup Screen Status if visible
            if (!state.isSetup) updateSetupUI();

            // Calculate distance if office is set
            if (state.officeLocation) {
                const dist = calculateDistance(latitude, longitude, state.officeLocation.latitude, state.officeLocation.longitude);
                currentGeo.dist = dist;

                // Auto Tracking Logic
                if (state.mode === 'GPS') {
                    const isInside = dist <= state.officeLocation.radius;
                    if (isInside && !state.isActive) {
                        startSession();
                        notify("Welcome to Office", "Tracking started automatically.");
                    }
                }
                
                // Update Settings UI if visible
                if(!els.screens.settings.classList.contains('hidden') && els.settings.officeDetails) {
                     els.settings.officeDetails.innerHTML = `Radius: ${state.officeLocation.radius}m <br/> Current Dist: ${Math.round(dist)}m`;
                }
            }
        },
        (err) => {
            console.error("GPS Error", err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
}

// --- Session Management ---
function startSession() {
    if (state.isActive) return;
    updateState({ isActive: true, startTime: Date.now() });
}

function stopSession() {
    if (!state.isActive) return;
    const elapsed = Date.now() - state.startTime;
    const session = {
        date: new Date().toISOString().split('T')[0],
        duration: elapsed
    };
    updateState({ 
        isActive: false, 
        startTime: null, 
        history: [...state.history, session] 
    });
}

function notify(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png' });
    }
}

// --- Timer Loop ---
function startTimerLoop() {
    setInterval(() => {
        if (state.isActive && state.startTime) {
            const elapsed = Date.now() - state.startTime;
            updateTimerUI(elapsed);
            
            // Check completion
            if (elapsed >= WORKDAY_MS && elapsed < WORKDAY_MS + 1000) {
                notify("Workday Complete!", "You have reached 9 hours.");
            }
        } else {
            updateTimerUI(0);
        }
    }, 1000);
}

// --- UI Rendering ---

function updateTimerUI(elapsed) {
    if (!els.dash.timer) return; // Safety check

    const percentage = Math.min((elapsed / WORKDAY_MS) * 100, 100);
    const remaining = Math.max(0, WORKDAY_MS - elapsed);
    
    els.dash.timer.textContent = formatTime(elapsed);
    els.dash.percentage.textContent = `${Math.round(percentage)}% Done`;
    
    // Update Ring
    const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
    els.dash.ring.style.strokeDashoffset = offset;
    els.dash.ring.style.stroke = percentage >= 100 ? '#10b981' : '#6366f1'; 

    // Text Stats
    const totalSeconds = Math.floor(remaining / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    els.dash.remaining.textContent = `${h}h ${m}m`;

    if (state.isActive && state.startTime) {
        const endDate = new Date(state.startTime + WORKDAY_MS);
        els.dash.expectedEnd.textContent = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        els.dash.expectedEnd.textContent = '--:--';
    }
}

function updateSetupUI() {
    if (currentGeo.lat && els.setup.status) {
        els.setup.status.className = "text-emerald-600 font-medium flex items-center";
        els.setup.status.innerHTML = `<i data-lucide="navigation" class="w-4 h-4 mr-2"></i> Signal Acquired (${Math.round(currentGeo.accuracy)}m)`;
        els.setup.btnSet.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    }
}

function renderChart() {
    if (!els.dash.chart) return;
    
    const data = state.history.slice(-7);
    if(data.length === 0) return;

    els.dash.chart.innerHTML = '';
    
    data.forEach(d => {
        const hours = d.duration / 3600000;
        const hSafe = Math.min(hours, 12); 
        const heightPct = (hSafe / 9) * 60; 
        const isGoal = hours >= 9;
        const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
        
        const barContainer = document.createElement('div');
        barContainer.className = "flex flex-col items-center flex-1";
        
        const bar = document.createElement('div');
        bar.className = `w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${isGoal ? 'bg-emerald-500' : 'bg-indigo-400'}`;
        bar.style.height = `${Math.max(5, heightPct)}%`;
        bar.style.minHeight = '4px';
        
        const label = document.createElement('div');
        label.className = "text-[10px] text-slate-400 mt-1";
        label.textContent = day[0];

        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        els.dash.chart.appendChild(barContainer);
    });
}

function render() {
    if (!els.screens.setup) return; // Safety

    // Screen Visibility
    if (!state.isSetup) {
        els.screens.setup.classList.remove('hidden');
        els.screens.dashboard.classList.add('hidden');
        return;
    }
    
    els.screens.setup.classList.add('hidden');
    els.screens.dashboard.classList.remove('hidden');

    // Mode Indicators
    const isGPS = state.mode === 'GPS';
    els.dash.modeIndicator.className = `w-2 h-2 rounded-full mr-2 ${isGPS ? 'bg-indigo-500' : 'bg-amber-500'}`;
    els.dash.modeText.textContent = isGPS ? 'GPS AUTO' : 'MANUAL MODE';
    
    // Main Action Button
    const btn = els.dash.btnAction;
    
    if (state.isActive) {
        btn.className = "w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 active:scale-95 transition-transform flex items-center justify-center";
        btn.innerHTML = `<i data-lucide="power" class="w-5 h-5 mr-2"></i> Stop Session`;
        btn.onclick = stopSession;
        els.dash.gpsWaitText.classList.add('hidden');
    } else {
        if (isGPS) {
             btn.className = "w-full bg-indigo-50 text-indigo-400 py-4 rounded-2xl font-bold text-lg shadow-none cursor-not-allowed flex items-center justify-center border border-indigo-100";
             btn.innerHTML = `Auto-Waiting for GPS...`;
             btn.onclick = null;
             els.dash.gpsWaitText.classList.remove('hidden');
             els.dash.gpsWaitText.textContent = `Move within ${state.officeLocation ? state.officeLocation.radius : 'area'}m of office to start.`;
        } else {
             btn.className = "w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-transform flex items-center justify-center hover:bg-indigo-700";
             btn.innerHTML = `<i data-lucide="clock" class="w-5 h-5 mr-2"></i> Start Manual Session`;
             btn.onclick = startSession;
             els.dash.gpsWaitText.classList.add('hidden');
        }
    }
    
    // Settings Logic
    const settingsBtns = {
        gps: els.settings.btnModeGps,
        manual: els.settings.btnModeManual
    };
    
    if (isGPS) {
        settingsBtns.gps.className = "py-2 rounded-md text-sm font-medium transition-all bg-white shadow text-indigo-600";
        settingsBtns.manual.className = "py-2 rounded-md text-sm font-medium transition-all text-slate-500";
        els.settings.officeInfo.classList.remove('hidden');
    } else {
        settingsBtns.gps.className = "py-2 rounded-md text-sm font-medium transition-all text-slate-500";
        settingsBtns.manual.className = "py-2 rounded-md text-sm font-medium transition-all bg-white shadow text-indigo-600";
        els.settings.officeInfo.classList.add('hidden');
    }

    renderChart();
    if (window.lucide) window.lucide.createIcons();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Setup Screen
    if (els.setup.btnSet) {
        els.setup.btnSet.onclick = () => {
            if (currentGeo.lat) {
                updateState({
                    isSetup: true,
                    mode: 'GPS',
                    officeLocation: {
                        name: 'My Office',
                        latitude: currentGeo.lat,
                        longitude: currentGeo.lng,
                        radius: 100
                    }
                });
            }
        };
    }
    if (els.setup.btnSkip) els.setup.btnSkip.onclick = () => updateState({ isSetup: true, mode: 'MANUAL', officeLocation: null });

    // Dashboard
    if (els.dash.btnSettings) els.dash.btnSettings.onclick = () => els.screens.settings.classList.remove('hidden');

    // Settings
    if (els.settings.btnClose) els.settings.btnClose.onclick = () => els.screens.settings.classList.add('hidden');
    if (els.settings.btnModeGps) els.settings.btnModeGps.onclick = () => updateState({ mode: 'GPS' });
    if (els.settings.btnModeManual) els.settings.btnModeManual.onclick = () => updateState({ mode: 'MANUAL' });
    
    if (els.settings.btnToggleRadius) {
        els.settings.btnToggleRadius.onclick = () => {
            if (!state.officeLocation) return;
            const newR = state.officeLocation.radius === 100 ? 500 : 100;
            updateState({ officeLocation: { ...state.officeLocation, radius: newR } });
        };
    }

    if (els.settings.btnReset) {
        els.settings.btnReset.onclick = () => {
            if(confirm("Reset all data? This cannot be undone.")) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
            }
        };
    }
}

function updateNetworkStatus() {
    if (!els.dash.offlineIcon) return;
    if (navigator.onLine) {
        els.dash.offlineIcon.classList.add('hidden');
    } else {
        els.dash.offlineIcon.classList.remove('hidden');
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
