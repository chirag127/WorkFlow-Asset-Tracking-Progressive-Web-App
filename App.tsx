import React, { useState, useEffect } from 'react';
import { useTracker } from './hooks/useTracker';
import { ProgressRing } from './components/ProgressRing';
import { HistoryChart } from './components/HistoryChart';
import { formatTime, WORKDAY_MS, getExpectedEndTime } from './utils';
import { MapPin, Clock, Navigation, AlertCircle, Settings, Power, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const { state, elapsed, geoStatus, actions } = useTracker();
  const [showSettings, setShowSettings] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const percentage = Math.min((elapsed / WORKDAY_MS) * 100, 100);
  const remainingMs = Math.max(0, WORKDAY_MS - elapsed);

  // --- Setup Screen ---
  if (!state.isSetup && !showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-violet-600 flex flex-col items-center justify-center p-6 text-white">
        <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-indigo-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Set Office Location</h1>
            <p className="text-slate-500 mt-2 text-sm">To enable GPS tracking, we need your office coordinates.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Current Status</p>
              {geoStatus.currentLat ? (
                 <div className="text-emerald-600 font-medium flex items-center">
                    <Navigation className="w-4 h-4 mr-2" />
                    Signal Acquired ({geoStatus.accuracy?.toFixed(0)}m accuracy)
                 </div>
              ) : (
                <div className="text-amber-500 flex items-center animate-pulse">
                   <AlertCircle className="w-4 h-4 mr-2" />
                   Acquiring GPS...
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (geoStatus.currentLat && geoStatus.currentLng) {
                  actions.setOfficeLocation({
                    name: 'My Office',
                    latitude: geoStatus.currentLat,
                    longitude: geoStatus.currentLng,
                    radius: 100 // Default 100m
                  });
                } else {
                  alert("Waiting for GPS signal...");
                }
              }}
              disabled={!geoStatus.currentLat}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Set Current Location as Office
            </button>
            
            <button 
              onClick={() => actions.setOfficeLocation({ name: 'Manual', latitude: 0, longitude: 0, radius: 0 })}
              className="w-full text-slate-500 py-2 text-sm hover:text-indigo-600"
            >
              Skip (Manual Mode Only)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Dashboard ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative max-w-md mx-auto shadow-2xl overflow-hidden">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-6 flex flex-col animate-in fade-in duration-200">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-800">Close</button>
           </div>
           
           <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tracking Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => actions.setMode('GPS')}
                    className={`py-2 rounded-md text-sm font-medium transition-all ${state.mode === 'GPS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                  >
                    GPS Auto
                  </button>
                  <button 
                    onClick={() => actions.setMode('MANUAL')}
                    className={`py-2 rounded-md text-sm font-medium transition-all ${state.mode === 'MANUAL' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {state.mode === 'GPS' && state.officeLocation && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h3 className="font-semibold text-indigo-900 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" /> Office Zone
                  </h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    Radius: {state.officeLocation.radius}m <br/>
                    Current Dist: {geoStatus.distanceToOffice ? Math.round(geoStatus.distanceToOffice) : '?'}m
                  </p>
                  <button onClick={() => actions.setOfficeLocation({...state.officeLocation!, radius: state.officeLocation!.radius === 100 ? 500 : 100})} className="text-xs text-indigo-600 font-bold mt-2 underline">
                    Toggle Radius (100m/500m)
                  </button>
                </div>
              )}

              <button onClick={actions.resetData} className="w-full border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-50">
                Reset All Data
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 pt-6 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">OfficeTrack</h1>
          <div className="flex items-center text-xs font-medium text-slate-500 mt-1">
             <span className={`w-2 h-2 rounded-full mr-2 ${state.mode === 'GPS' ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
             {state.mode} MODE
             {isOffline && <WifiOff className="w-3 h-3 ml-2 text-slate-400" />}
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:text-indigo-600">
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Timer */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-2">
        <div className="relative mb-8">
           <ProgressRing percentage={percentage} />
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-slate-400 font-medium text-sm uppercase tracking-widest mb-1">Elapsed</span>
              <span className="text-5xl font-black text-slate-800 tracking-tighter tabular-nums">
                {formatTime(elapsed)}
              </span>
              <span className="text-indigo-500 font-semibold mt-2">
                {Math.round(percentage)}% Done
              </span>
           </div>
        </div>

        {/* Status Card */}
        <div className="w-full bg-white rounded-2xl p-5 shadow-lg border border-slate-100 mb-6 grid grid-cols-2 gap-4">
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Expected End</p>
              <p className="text-lg font-bold text-slate-700">
                {state.isActive && state.startTime 
                  ? getExpectedEndTime(state.startTime, WORKDAY_MS) 
                  : '--:--'}
              </p>
           </div>
           <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase">Remaining</p>
              <p className="text-lg font-bold text-slate-700 tabular-nums">
                 {formatTime(remainingMs)}
              </p>
           </div>
        </div>

        {/* Controls */}
        <div className="w-full">
           {state.isActive ? (
             <button 
               onClick={actions.stopTimer}
               className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 active:scale-95 transition-transform flex items-center justify-center"
             >
               <Power className="w-5 h-5 mr-2" /> Stop Session
             </button>
           ) : (
             <button 
               onClick={actions.startTimer}
               className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-transform flex items-center justify-center ${
                 state.mode === 'GPS' 
                 ? 'bg-indigo-100 text-indigo-600 cursor-not-allowed opacity-70' 
                 : 'bg-indigo-600 text-white hover:bg-indigo-700'
               }`}
               disabled={state.mode === 'GPS'}
             >
               {state.mode === 'GPS' ? (
                 <>Auto-Waiting for GPS...</>
               ) : (
                 <><Clock className="w-5 h-5 mr-2" /> Start Manual Session</>
               )}
             </button>
           )}
           
           {state.mode === 'GPS' && !state.isActive && (
             <p className="text-xs text-center text-slate-400 mt-3">
               Move within {state.officeLocation?.radius}m of office to start.
             </p>
           )}
        </div>
      </main>

      {/* History Section */}
      <section className="px-6 pb-8 bg-slate-50">
        <HistoryChart data={state.history} />
      </section>

    </div>
  );
};

export default App;
