'use client';

import React from 'react';
import { BarChart3, Search, TrendingUp, FolderOpen, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <BarChart3 className="h-4 w-4 mr-3" />
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <Search className="h-4 w-4 mr-3" />
              Analysis
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <TrendingUp className="h-4 w-4 mr-3" />
              Visualizations
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <FolderOpen className="h-4 w-4 mr-3" />
              Data Sources
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}