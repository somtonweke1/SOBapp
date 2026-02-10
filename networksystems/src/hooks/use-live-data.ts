import { useState, useEffect, useCallback } from 'react';
import LiveDataService from '@/services/live-data-service';

interface LiveDataState {
  data: any;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useLiveData(dataType: string, autoUpdate: boolean = true) {
  const [state, setState] = useState<LiveDataState>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const liveDataService = LiveDataService.getInstance();

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let data;
      switch (dataType) {
        case 'commodities':
          data = await liveDataService.getCommodityPrices();
          break;
        case 'mining_ops':
          data = await liveDataService.getMiningOperationsData();
          break;
        case 'shipping':
          data = await liveDataService.getShippingData();
          break;
        case 'market_intel':
          data = await liveDataService.getMarketIntelligence();
          break;
        case 'financial':
          data = await liveDataService.getFinancialData();
          break;
        case 'portfolio':
          data = await liveDataService.getPortfolioUpdates();
          break;
        case 'all':
          data = await liveDataService.getAllLiveData();
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      setState({
        data,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: null
      });
    }
  }, [dataType, liveDataService]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-update setup
  useEffect(() => {
    if (!autoUpdate) return;

    const handleUpdate = (newData: any) => {
      setState(prev => ({
        ...prev,
        data: newData,
        lastUpdated: new Date(),
        error: null
      }));
    };

    liveDataService.connectRealTimeUpdates(dataType, handleUpdate);

    return () => {
      liveDataService.disconnectRealTimeUpdates(dataType);
    };
  }, [dataType, autoUpdate, liveDataService]);

  return {
    ...state,
    refetch: fetchData
  };
}

// Specialized hooks for different data types
export function useCommodityPrices(autoUpdate: boolean = true) {
  return useLiveData('commodities', autoUpdate);
}

export function useMiningOperations(autoUpdate: boolean = true) {
  return useLiveData('mining_ops', autoUpdate);
}

export function useShippingData(autoUpdate: boolean = true) {
  return useLiveData('shipping', autoUpdate);
}

export function useMarketIntelligence(autoUpdate: boolean = true) {
  return useLiveData('market_intel', autoUpdate);
}

export function useFinancialData(autoUpdate: boolean = true) {
  return useLiveData('financial', autoUpdate);
}

export function usePortfolioData(autoUpdate: boolean = true) {
  return useLiveData('portfolio', autoUpdate);
}

export function useAllLiveData(autoUpdate: boolean = true) {
  return useLiveData('all', autoUpdate);
}