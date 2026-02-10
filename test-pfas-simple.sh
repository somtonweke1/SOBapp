#!/bin/bash

echo "🧪 Testing PFAS API Endpoint at miar.live"
echo ""

response=$(curl -s -X POST https://miar.live/api/pfas-scan \
  -H "Content-Type: application/json" \
  -d '{
    "facilityName": "Test Facility",
    "email": "test@miar.live",
    "systemType": "Fixed Bed",
    "vesselDiameter": 2.5,
    "vesselHeight": 3.0,
    "flowRate": 100,
    "bedHeight": 2.0,
    "bedVolume": 10,
    "ebct": 15,
    "toc": 3.0,
    "sulfate": 50,
    "chloride": 30,
    "alkalinity": 100,
    "hardness": 150,
    "ph": 7.0,
    "temperature": 20,
    "pfasCompounds": {
      "PFOA": 25.0,
      "PFOS": 15.0,
      "PFNA": 5.0,
      "PFHxA": 8.0,
      "PFHxS": 12.0,
      "PFDA": 3.0,
      "PFBS": 10.0,
      "PFHpA": 4.0,
      "PFUnDA": 2.0,
      "PFDoA": 1.0
    },
    "totalPFAS": 85.0,
    "gacType": "Coconut Shell",
    "gacDensity": 450,
    "gacParticleSize": 1.5,
    "gacIodineNumber": 1000,
    "gacSurfaceArea": 1200,
    "gacCostPerKg": 3.5,
    "replacementCost": 15000,
    "laborCost": 5000,
    "disposalCost": 3000,
    "operatingDaysPerYear": 365,
    "operatingHoursPerDay": 24,
    "targetRemovalEfficiency": 95,
    "safetyFactor": 1.5
  }')

echo "Response:"
echo "$response" | jq . 2>/dev/null || echo "$response"
