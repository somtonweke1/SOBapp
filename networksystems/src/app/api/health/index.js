/**
 * SOBapp - Health Check API for Vercel (Node.js)
 */

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const response = {
      status: "healthy",
      service: "SOBapp - Vercel Backend",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      environment: "production",
      endpoints: {
        centrality: "/api/centrality",
        analysis: "/api/analysis",
        health: "/api/health"
      },
      features: [
        "Centrality Analysis",
        "Network Metrics",
        "Community Detection",
        "Path Analysis"
      ]
    };

    res.status(200).json(response);
    return;
  }

  res.status(405).json({
    status: "error",
    message: "Method not allowed",
    timestamp: new Date().toISOString()
  });
}
