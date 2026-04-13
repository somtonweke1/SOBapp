/**
 * Seed Sample Spatial Data for Baltimore
 * Creates realistic 311 complaints and vacant properties to demonstrate GIS features
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Baltimore neighborhoods with different risk profiles
const BALTIMORE_AREAS = [
  // High-risk areas (West Baltimore, East Baltimore)
  { name: "Sandtown-Winchester", lat: 39.3086, lon: -76.6417, risk: "HIGH", complaints: 80, vacants: 15 },
  { name: "East Baltimore Midway", lat: 39.2969, lon: -76.5850, risk: "HIGH", complaints: 65, vacants: 12 },

  // Medium-risk areas
  { name: "Druid Heights", lat: 39.3108, lon: -76.6500, risk: "MEDIUM", complaints: 35, vacants: 6 },
  { name: "Greenmount West", lat: 39.3108, lon: -76.6158, risk: "MEDIUM", complaints: 28, vacants: 5 },
  { name: "Upton", lat: 39.3033, lon: -76.6336, risk: "MEDIUM", complaints: 30, vacants: 7 },

  // Lower-risk areas (Downtown, Harbor)
  { name: "Downtown", lat: 39.2904, lon: -76.6122, risk: "LOW", complaints: 8, vacants: 1 },
  { name: "Inner Harbor", lat: 39.2858, lon: -76.6097, risk: "LOW", complaints: 5, vacants: 0 },
  { name: "Federal Hill", lat: 39.2750, lon: -76.6081, risk: "LOW", complaints: 6, vacants: 1 },
  { name: "Fells Point", lat: 39.2828, lon: -76.5928, risk: "LOW", complaints: 10, vacants: 2 },
  { name: "Canton", lat: 39.2806, lon: -76.5792, risk: "LOW", complaints: 7, vacants: 1 },
];

// Service request types from Baltimore 311
const SERVICE_TYPES = [
  "SW-Dirty Street or Alley",
  "HCD-Illegal Dumping",
  "SW-Missed Collection",
  "TRM-Potholes",
  "BGE-Street Light Out",
  "SW-Dirty Alley",
  "HCD-Sanitation Property",
  "TRM-Sidewalk Repair",
  "SW-Clogged Storm Drain",
  "HCD-Rodent Abatement"
];

function randomDatePastYear() {
  const now = new Date();
  const pastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const randomTime = pastYear.getTime() + Math.random() * (now.getTime() - pastYear.getTime());
  return new Date(randomTime);
}

function randomOffset(base, range = 0.005) {
  return base + (Math.random() - 0.5) * range;
}

async function seedSpatialData() {
  console.log('=== Seeding Baltimore Spatial Data ===\n');

  try {
    await prisma.$connect();

    // Clear existing data
    console.log('Clearing existing spatial data...');
    await prisma.$executeRaw`DELETE FROM "ServiceRequest"`;
    await prisma.$executeRaw`DELETE FROM "VacantProperty"`;
    console.log('✓ Cleared\n');

    let totalComplaints = 0;
    let totalVacants = 0;

    // Generate data for each area
    for (const area of BALTIMORE_AREAS) {
      console.log(`Generating data for ${area.name} (${area.risk} risk)...`);

      // Generate 311 service requests
      for (let i = 0; i < area.complaints; i++) {
        const lat = randomOffset(area.lat);
        const lon = randomOffset(area.lon);
        const serviceType = SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)];
        const createdDate = randomDatePastYear();
        const status = Math.random() > 0.3 ? 'Closed' : 'Open';

        await prisma.$executeRaw`
          INSERT INTO "ServiceRequest" (
            id, service_request_num, service_name, description,
            address, status_description, latitude, longitude, geom, created_date
          ) VALUES (
            ${`sr-${area.name.toLowerCase().replace(/\s+/g, '-')}-${i}`},
            ${`${Date.now()}-${i}`},
            ${serviceType},
            ${`${serviceType} in ${area.name}`},
            ${`${Math.floor(Math.random() * 999) + 100} ${area.name} St`},
            ${status},
            ${lat},
            ${lon},
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
            ${createdDate}
          )
        `;
      }
      totalComplaints += area.complaints;

      // Generate vacant properties
      for (let i = 0; i < area.vacants; i++) {
        const lat = randomOffset(area.lat);
        const lon = randomOffset(area.lon);
        const noticeDate = randomDatePastYear();

        await prisma.$executeRaw`
          INSERT INTO "VacantProperty" (
            id, reference, address, neighborhood, latitude, longitude, geom, notice_date
          ) VALUES (
            ${`vac-${area.name.toLowerCase().replace(/\s+/g, '-')}-${i}`},
            ${`VAC-${Date.now()}-${i}`},
            ${`${Math.floor(Math.random() * 999) + 100} ${area.name} Ave`},
            ${area.name},
            ${lat},
            ${lon},
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
            ${noticeDate}
          )
        `;
      }
      totalVacants += area.vacants;

      console.log(`  ✓ ${area.complaints} complaints, ${area.vacants} vacant properties`);
    }

    console.log(`\n=== Seeding Complete ===`);
    console.log(`Total service requests: ${totalComplaints}`);
    console.log(`Total vacant properties: ${totalVacants}`);
    console.log(`\nGIS features now fully functional with realistic Baltimore data!`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedSpatialData();
