import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Incident } from '../types.ts';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    } else {
      console.warn('Firebase test connection check (non-fatal):', error);
    }
    return false;
  }
}

// Immediately run connection check
testConnection();

export interface FirebaseInvestigation {
  id: string;
  incidentId: string;
  suspectMmsi?: string;
  suspectName?: string;
  status: string;
  dispatchedUnit?: string;
  notes?: string;
  createdAt: string;
}

export interface FirebaseHistoricalReplay {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  cursorDate?: string;
  playbackSpeed?: number;
  focusedIncidentId?: string;
  createdAt: string;
}

// Service helper methods for Maritime Sentinel
export const FirebaseService = {
  // Sync Investigation Case Dossier
  async saveInvestigation(investigation: FirebaseInvestigation): Promise<void> {
    const path = `investigations/${investigation.id}`;
    try {
      await setDoc(doc(db, 'investigations', investigation.id), investigation);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Save Historical Replay Session Range
  async saveHistoricalReplay(replay: FirebaseHistoricalReplay): Promise<void> {
    const path = `historicalReplays/${replay.id}`;
    try {
      await setDoc(doc(db, 'historicalReplays', replay.id), replay);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Subscribe to Historical Replays
  subscribeHistoricalReplays(
    onUpdate: (replays: FirebaseHistoricalReplay[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const path = 'historicalReplays';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(15));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as FirebaseHistoricalReplay);
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // Subscribe to Investigations
  subscribeInvestigations(
    onUpdate: (investigations: FirebaseInvestigation[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const path = 'investigations';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as FirebaseInvestigation);
        onUpdate(list);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // Save or update Incident
  async saveIncident(incident: Incident): Promise<void> {
    const path = `incidents/${incident.id}`;
    try {
      await setDoc(doc(db, 'incidents', incident.id), {
        id: incident.id,
        name: incident.name || 'Unnamed Oil Spill',
        lat: incident.lat,
        lon: incident.lon,
        detectedAt: incident.detectedAt,
        estimatedOriginAt: incident.estimatedOriginAt,
        severity: incident.severity,
        confidenceScore: incident.confidenceScore,
        areaKm2: incident.areaKm2,
        status: incident.status,
        oilType: incident.oilType || 'HEAVY FUEL/CRUDE',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
};
