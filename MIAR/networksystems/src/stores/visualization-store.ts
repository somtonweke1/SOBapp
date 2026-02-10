// Simplified visualization store without external dependencies
export interface VisualizationState {
  layout: 'force-directed' | 'hierarchical' | 'circular';
  nodeSize: number;
  edgeWidth: number;
  showLabels: boolean;
  colorScheme: 'centrality' | 'degree' | 'custom';
}

export const useVisualizationStore = () => {
  // This is a placeholder - in a real app, you'd use Zustand or another state manager
  return {
    layout: 'force-directed' as const,
    nodeSize: 20,
    edgeWidth: 2,
    showLabels: true,
    colorScheme: 'centrality' as const,
    setLayout: (layout: VisualizationState['layout']) => {},
    setNodeSize: (size: number) => {},
    setEdgeWidth: (width: number) => {},
    setShowLabels: (show: boolean) => {},
    setColorScheme: (scheme: VisualizationState['colorScheme']) => {},
  };
};