import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Mining-specific Types
export interface MiningSite {
  id: string;
  name: string;
  type: 'active_mine' | 'aml_site' | 'processing_facility' | 'lab' | 'storage';
  location: {
    country: string;
    coordinates: { lat: number; lng: number };
  };
  status: 'operational' | 'development' | 'maintenance' | 'inactive';
  capacity?: number;
  resources?: string[];
  equipment?: Equipment[];
  metadata?: Record<string, any>;
}

export interface Equipment {
  id: string;
  type: 'spectrometer' | 'crusher' | 'separator' | 'reactor' | 'analyzer';
  model: string;
  status: 'online' | 'offline' | 'maintenance';
  lastMaintenance?: string;
  capabilities: string[];
}

export interface ResourceFlow {
  source: string;
  target: string;
  resourceType: 'ore' | 'tailings' | 'data' | 'materials' | 'energy';
  quantity?: number;
  efficiency?: number;
  cost?: number;
  metadata?: Record<string, any>;
}

export interface MiningNetwork {
  id: string;
  name: string;
  description?: string;
  sites: MiningSite[];
  flows: ResourceFlow[];
  region: string;
  operationType: 'extraction' | 'reprocessing' | 'research' | 'integrated';
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialsAnalysis {
  sampleId: string;
  composition: Record<string, number>;
  extractionYield: Record<string, number>;
  processingConditions: {
    temperature?: number;
    pressure?: number;
    reagents?: string[];
    duration?: number;
  };
  recommendations: string[];
}

export interface LabResult {
  experimentId: string;
  algorithm: string;
  results: MaterialsAnalysis[];
  statistics?: Record<string, any>;
  computationTime?: number;
  aiPredictions?: {
    nextExperiments: any[];
    expectedYield: number;
    confidence: number;
  };
}

export interface MiningState {
  // Networks
  networks: MiningNetwork[];
  currentNetwork: MiningNetwork | null;
  
  // Analysis Results
  labResults: Record<string, LabResult>;
  currentResults: LabResult | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentNetwork: (network: MiningNetwork | null) => void;
  addNetwork: (network: MiningNetwork) => void;
  updateNetwork: (id: string, updates: Partial<MiningNetwork>) => void;
  deleteNetwork: (id: string) => void;
  
  // Lab Actions
  runTailingsAnalysis: (network: MiningNetwork, sampleData: any, options?: any) => Promise<LabResult>;
  runExtractionOptimization: (network: MiningNetwork, target: string[], options?: any) => Promise<LabResult>;
  runMaterialsDiscovery: (network: MiningNetwork, specifications: any, options?: any) => Promise<LabResult>;
  
  // Database Actions
  saveNetwork: (network: MiningNetwork) => Promise<string>;
  loadNetworks: (region?: string) => Promise<MiningNetwork[]>;
  saveLabResults: (networkId: string, results: LabResult) => Promise<string>;
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useMiningStore = create<MiningState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        networks: [],
        currentNetwork: null,
        labResults: {},
        currentResults: null,
        loading: false,
        error: null,

        // Network Actions
        setCurrentNetwork: (network) => set({ currentNetwork: network }),
        
        addNetwork: (network) => set((state) => ({
          networks: [...state.networks, network]
        })),
        
        updateNetwork: (id, updates) => set((state) => ({
          networks: state.networks.map(network => 
            network.id === id ? { ...network, ...updates, updatedAt: new Date().toISOString() } : network
          ),
          currentNetwork: state.currentNetwork?.id === id 
            ? { ...state.currentNetwork, ...updates, updatedAt: new Date().toISOString() }
            : state.currentNetwork
        })),
        
        deleteNetwork: (id) => set((state) => {
          const newLabResults = { ...state.labResults };
          delete newLabResults[id];
          
          return {
            networks: state.networks.filter(network => network.id !== id),
            currentNetwork: state.currentNetwork?.id === id ? null : state.currentNetwork,
            labResults: newLabResults
          };
        }),

        // Lab Analysis Actions
        runTailingsAnalysis: async (network, sampleData, options = {}) => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/mining/tailings-analysis', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                network,
                sampleData,
                analysis: 'tailings_reprocessing',
                options
              }),
            });

            if (!response.ok) {
              throw new Error(`Tailings analysis failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Analysis failed');
            }

            const labResult: LabResult = {
              experimentId: `tailings-${Date.now()}`,
              algorithm: 'tailings_optimization',
              results: result.results.analysis,
              statistics: result.metadata.statistics,
              computationTime: result.metadata.computationTime,
              aiPredictions: result.results.predictions
            };

            // Update store
            set((state) => ({
              labResults: {
                ...state.labResults,
                [network.id]: labResult
              },
              currentResults: labResult,
              loading: false
            }));

            return labResult;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        runExtractionOptimization: async (network, target, options = {}) => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/mining/extraction-optimization', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                network,
                targetMinerals: target,
                analysis: 'extraction_optimization',
                options
              }),
            });

            if (!response.ok) {
              throw new Error(`Extraction optimization failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Optimization failed');
            }

            const labResult: LabResult = {
              experimentId: `extraction-${Date.now()}`,
              algorithm: 'extraction_optimization',
              results: result.results.optimizedProcesses,
              statistics: result.metadata.statistics,
              computationTime: result.metadata.computationTime,
              aiPredictions: result.results.predictions
            };

            // Update store
            set((state) => ({
              labResults: {
                ...state.labResults,
                [network.id]: labResult
              },
              currentResults: labResult,
              loading: false
            }));

            return labResult;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        runMaterialsDiscovery: async (network, specifications, options = {}) => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/mining/materials-discovery', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                network,
                specifications,
                analysis: 'materials_discovery',
                options
              }),
            });

            if (!response.ok) {
              throw new Error(`Materials discovery failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Discovery failed');
            }

            const labResult: LabResult = {
              experimentId: `discovery-${Date.now()}`,
              algorithm: 'ai_materials_discovery',
              results: result.results.candidateMaterials,
              statistics: result.metadata.statistics,
              computationTime: result.metadata.computationTime,
              aiPredictions: result.results.synthesisRecommendations
            };

            // Update store
            set((state) => ({
              labResults: {
                ...state.labResults,
                [network.id]: labResult
              },
              currentResults: labResult,
              loading: false
            }));

            return labResult;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // Database Actions
        saveNetwork: async (network) => {
          try {
            const response = await fetch('/api/mining/database', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'mining_network',
                ...network
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save mining network: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to save network');
            }

            // Update local state
            get().addNetwork(result.network);
            
            return result.network.id;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage });
            throw error;
          }
        },

        loadNetworks: async (region) => {
          set({ loading: true, error: null });
          
          try {
            const url = region ? `/api/mining/database?type=networks&region=${region}` : '/api/mining/database?type=networks';
            const response = await fetch(url);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
              set({ networks: result.networks || [], loading: false });
              return result.networks || [];
            } else {
              throw new Error(result.error || 'Failed to load networks');
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        saveLabResults: async (networkId, results) => {
          try {
            const response = await fetch('/api/mining/database', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'lab_results',
                networkId,
                ...results
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save lab results: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to save results');
            }

            return result.results.id;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage });
            throw error;
          }
        },

        // Utility Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'mining-store',
        partialize: (state) => ({
          networks: state.networks,
          currentNetwork: state.currentNetwork,
          labResults: state.labResults
        }),
      }
    ),
    {
      name: 'mining-store',
    }
  )
);
