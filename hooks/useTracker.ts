import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, OfficeLocation, TrackerMode, GeoStatus, DailySession } from '../types';
import { calculateDistance, WORKDAY_MS } from '../utils';

const STORAGE_KEY = 'office_tracker_data_v2';

const INITIAL_STATE: AppState = {
  isSetup: false,
  mode: 'MANUAL',
  officeLocation: null,
  startTime: null,
  isActive: false,
  history: [
    { date: '2023-10-24', duration: 8.5 * 3600000 },
    { date: '2023-10-25', duration: 9.1 * 3600000 },
    { date: '2023-10-26', duration: 8.8 * 3600000 },
    { date: '2023-10-27', duration: 9.0 * 3600000 },
    { date: '2023-10-28', duration: 4.0 * 3600000 }, // Weekend/Half day
  ]
};

export const useTracker = () => {
  // --- State ---
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_STATE;
  });

  const [elapsed, setElapsed] = useState(0);
  
  const [geoStatus, setGeoStatus] = useState<GeoStatus>({
    hasPermission: false,
    currentLat: null,
    currentLng: null,
    distanceToOffice: null,
    accuracy: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // --- Timer Tick ---
  useEffect(() => {
    let interval: number | undefined;
    
    if (state.isActive && state.startTime) {
      // Immediate update
      setElapsed(Date.now() - state.startTime);
      
      interval = window.setInterval(() => {
        const now = Date.now();
        const currentElapsed = now - (state.startTime as number);
        setElapsed(currentElapsed);

        // Check for 9 hours completion
        if (currentElapsed >= WORKDAY_MS && currentElapsed < WORKDAY_MS + 1000) {
           sendNotification("Workday Complete!", "You have reached 9 hours.");
        }
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [state.isActive, state.startTime]);

  // --- Notification Helper ---
  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  // --- GPS Logic ---
  const startWatchingLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let dist = null;

        if (state.officeLocation) {
          dist = calculateDistance(
            latitude,
            longitude,
            state.officeLocation.latitude,
            state.officeLocation.longitude
          );

          // GPS Automation Logic
          if (state.mode === 'GPS') {
            const isInside = dist <= state.officeLocation.radius;
            
            if (isInside && !state.isActive) {
              // ENTERED OFFICE
              startTimer();
              sendNotification("Welcome to Office", "Timer started automatically.");
            } else if (!isInside && state.isActive) {
              // LEFT OFFICE - We don't auto-stop to avoid jitter/lunch breaks stopping it, 
              // but we alert the user.
              // Optional: You could auto-stop here if strict tracking is desired.
              // For this implementation, we will alert.
              // sendNotification("Left Office Area", "Timer is still running.");
            }
          }
        }

        setGeoStatus({
          hasPermission: true,
          currentLat: latitude,
          currentLng: longitude,
          distanceToOffice: dist,
          accuracy,
          error: null
        });
      },
      (err) => {
        setGeoStatus(prev => ({ ...prev, error: err.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000
      }
    );
  }, [state.mode, state.officeLocation, state.isActive]);

  // Start watching on mount or mode change
  useEffect(() => {
    requestNotificationPermission();
    startWatchingLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatchingLocation]);

  // --- Actions ---

  const setOfficeLocation = (location: OfficeLocation) => {
    setState(prev => ({ ...prev, officeLocation: location, isSetup: true }));
  };

  const setMode = (mode: TrackerMode) => {
    setState(prev => ({ ...prev, mode }));
  };

  const startTimer = () => {
    if (!state.isActive) {
      setState(prev => ({ ...prev, isActive: true, startTime: Date.now() }));
    }
  };

  const stopTimer = () => {
    if (state.isActive) {
      // Save to history
      const session: DailySession = {
        date: new Date().toISOString().split('T')[0],
        duration: elapsed
      };
      
      setState(prev => ({
        ...prev,
        isActive: false,
        startTime: null,
        history: [...prev.history, session]
      }));
      setElapsed(0);
    }
  };

  const resetData = () => {
    if(confirm("Are you sure you want to reset all data?")) {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    }
  };

  return {
    state,
    elapsed,
    geoStatus,
    actions: {
      setOfficeLocation,
      setMode,
      startTimer,
      stopTimer,
      resetData
    }
  };
};