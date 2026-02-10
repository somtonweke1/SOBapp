'use client';

import React, { useState, useEffect } from 'react';
import RealMarketDataService from '@/services/real-market-data-service';

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const testApis = async () => {
    setIsLoading(true);
    const marketService = RealMarketDataService.getInstance();

    try {
      const [commodities, health, stocks, crypto] = await Promise.all([
        marketService.getRealCommodityPrices(),
        marketService.checkAPIHealth(),
        marketService.getRealMiningStocks(),
        marketService.getCryptoPrices()
      ]);

      setTestResults({
        commodities,
        api_health: health,
        mining_stocks: stocks,
        crypto,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('API test failed:', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testApis();
    // Test every 2 minutes
    const interval = setInterval(testApis, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Real Market Data API Test</h2>
          <button
            onClick={testApis}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Refresh Test'}
          </button>
        </div>

        {testResults.error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {testResults.error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* API Health */}
            {testResults.api_health && (
              <div>
                <h3 className="text-lg font-semibold mb-3">API Health Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(testResults.api_health).map(([api, status]: [string, any]) => (
                    <div key={api} className="text-center p-3 rounded border">
                      <div className="font-medium">{api.replace('_', ' ')}</div>
                      <div className={`mt-1 ${status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                        {status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Commodity Prices */}
            {testResults.commodities && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Live Commodity Prices</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(testResults.commodities).map(([commodity, data]: [string, any]) => (
                    <div key={commodity} className="bg-gray-50 p-4 rounded">
                      <div className="font-medium capitalize">{commodity}</div>
                      <div className="text-xl font-bold">${data.current}</div>
                      <div className={`text-sm ${data.daily_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.daily_change >= 0 ? '+' : ''}{data.daily_change.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">{data.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mining Stocks */}
            {testResults.mining_stocks && Object.keys(testResults.mining_stocks).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Mining Company Stocks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(testResults.mining_stocks).map(([company, data]: [string, any]) => (
                    <div key={company} className="bg-gray-50 p-4 rounded">
                      <div className="font-medium">{company.replace('_', ' ')}</div>
                      <div className="text-lg font-bold">${data.current}</div>
                      <div className={`text-sm ${data.daily_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.daily_change >= 0 ? '+' : ''}{data.daily_change.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">{data.symbol}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crypto Prices */}
            {testResults.crypto && Object.keys(testResults.crypto).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Cryptocurrency Prices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(testResults.crypto).map(([crypto, data]: [string, any]) => (
                    <div key={crypto} className="bg-gray-50 p-4 rounded">
                      <div className="font-medium capitalize">{crypto}</div>
                      <div className="text-xl font-bold">${data.current.toLocaleString()}</div>
                      <div className={`text-sm ${data.daily_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.daily_change >= 0 ? '+' : ''}{data.daily_change.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">{data.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {testResults.timestamp && (
              <div className="text-sm text-gray-500 text-center">
                Last updated: {testResults.timestamp}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTest;