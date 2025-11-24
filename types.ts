export type TrackerMode = 'GPS' | 'MANUAL';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OfficeLocation extends Coordinates {
  name: string;
  radius: number; // in meters
}

export interface DailySession {
  date: string;
  duration: number; // milliseconds
}

export interface AppState {
  isSetup: boolean;
  mode: TrackerMode;
  officeLocation: OfficeLocation | null;
  startTime: number | null; // Timestamp
  isActive: boolean;
  history: DailySession[];
}

export interface GeoStatus {
  hasPermission: boolean;
  currentLat: number | null;
  currentLng: number | null;
  distanceToOffice: number | null;
  accuracy: number | null;
  error: string | null;
}