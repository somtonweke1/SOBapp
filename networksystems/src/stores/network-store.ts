import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Network Types
export interface Node {
  id: string;
  label: string;
  group?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface Edge {
  source: string;
  target: string;
  weight?: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface Network {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  directed?: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

export interface CentralityResult {
  nodeId: string;
  value: number;
  normalizedValue: number;
  rank?: number;
  percentile?: number;
  hubValue?: number;
  authorityValue?: number;
}

export interface AnalysisResult {
  algorithm: string;
  centrality?: CentralityResult[];
  communities?: any[];
  statistics?: Record<string, any>;
  computationTime?: number;
}

export interface NetworkState {
  // Networks
  networks: Network[];
  currentNetwork: Network | null;
  
  // Analysis Results
  analysisResults: Record<string, AnalysisResult | Record<string, AnalysisResult>>;
  currentAnalysis: AnalysisResult | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentNetwork: (network: Network | null) => void;
  addNetwork: (network: Network) => void;
  updateNetwork: (id: string, updates: Partial<Network>) => void;
  deleteNetwork: (id: string) => void;
  
  // Analysis Actions
  runCentralityAnalysis: (network: Network, algorithm: string, options?: any) => Promise<AnalysisResult>;
  runNetworkAnalysis: (network: Network, analysisType: string, algorithm?: string, options?: any) => Promise<AnalysisResult>;
  runCompleteAnalysis: (network: Network, options?: any) => Promise<Record<string, AnalysisResult>>;
  
  // Database Actions
  saveNetwork: (network: Network) => Promise<string>;
  loadNetworks: (userId?: string) => Promise<Network[]>;
  saveAnalysis: (networkId: string, analysis: AnalysisResult) => Promise<string>;
  
  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useNetworkStore = create<NetworkState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        networks: [],
        currentNetwork: null,
        analysisResults: {},
        currentAnalysis: null,
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
          const newAnalysisResults = { ...state.analysisResults };
          delete newAnalysisResults[id];
          
          return {
            networks: state.networks.filter(network => network.id !== id),
            currentNetwork: state.currentNetwork?.id === id ? null : state.currentNetwork,
            analysisResults: newAnalysisResults
          };
        }),

        // Analysis Actions
        runCentralityAnalysis: async (network, algorithm, options = {}) => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/centrality', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                network,
                algorithm,
                options
              }),
            });

            if (!response.ok) {
              throw new Error(`Centrality analysis failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Analysis failed');
            }

            const analysisResult: AnalysisResult = {
              algorithm,
              centrality: result.results.centrality,
              statistics: result.metadata.statistics,
              computationTime: result.metadata.computationTime
            };

            // Update store
            set((state) => ({
              analysisResults: {
                ...state.analysisResults,
                [network.id]: analysisResult
              },
              currentAnalysis: analysisResult,
              loading: false
            }));

            return analysisResult;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        runNetworkAnalysis: async (network, analysisType, algorithm = 'default', options = {}) => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/analysis', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                network,
                analysis: analysisType,
                algorithm,
                options
              }),
            });

            if (!response.ok) {
              throw new Error(`Network analysis failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Analysis failed');
            }

            const analysisResult: AnalysisResult = {
              algorithm,
              ...result.results,
              statistics: result.metadata.statistics,
              computationTime: result.metadata.computationTime
            };

            // Update store
            set((state) => ({
              analysisResults: {
                ...state.analysisResults,
                [network.id]: analysisResult
              },
              currentAnalysis: analysisResult,
              loading: false
            }));

            return analysisResult;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        runCompleteAnalysis: async (network, options = {}) => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/integration', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                workflow: 'complete_analysis',
                network,
                options
              }),
            });

            if (!response.ok) {
              throw new Error(`Complete analysis failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Analysis failed');
            }

            const analysisResults: Record<string, AnalysisResult> = {};
            
            // Process results from complete analysis
            if (result.results.summary) {
              Object.keys(result.results.summary.centralitySummary || {}).forEach(algorithm => {
                analysisResults[algorithm] = {
                  algorithm,
                  statistics: result.results.summary.centralitySummary[algorithm],
                  computationTime: result.results.summary.centralitySummary[algorithm]?.computationTime || 0
                };
              });
            }

            // Update store
            set((state) => ({
              analysisResults: {
                ...state.analysisResults,
                [network.id]: analysisResults
              },
              loading: false
            }));

            return analysisResults;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, loading: false });
            throw error;
          }
        },

        // Database Actions
        saveNetwork: async (network) => {
          try {
            const response = await fetch('/api/database', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'network',
                ...network
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save network: ${response.status}`);
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

        loadNetworks: async (userId) => {
          set({ loading: true, error: null });
          
          try {
            const url = userId ? `/api/database?type=networks&userId=${userId}` : '/api/database?type=networks';
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

        saveAnalysis: async (networkId, analysis) => {
          try {
            const response = await fetch('/api/database', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'analysis',
                networkId,
                ...analysis
              }),
            });

            if (!response.ok) {
              throw new Error(`Failed to save analysis: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to save analysis');
            }

            return result.analysis.id;
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
        name: 'network-store',
        partialize: (state) => ({
          networks: state.networks,
          currentNetwork: state.currentNetwork,
          analysisResults: state.analysisResults
        }),
      }
    ),
    {
      name: 'network-store',
    }
  )
);