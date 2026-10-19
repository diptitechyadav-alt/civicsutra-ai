import {
  IssueCategory,
  LocationData,
  PriorityLevel,
  PriorityScoreBreakdown,
  Report,
  DuplicateCandidate
} from './types.js';

// Calculate Great Circle Distance in meters using Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Tokenize and clean text for semantic matching
function getTokens(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'it', 'this', 'that', 'there', 'near', 'very', 'here',
    'road', 'street', 'hai', 'mein', 'ko', 'par', 'se', 'bhi', 'aur'
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return new Set(words);
}

// Calculate Jaccard similarity between two texts
export function calculateTextSimilarity(text1: string, text2: string): number {
  const tokens1 = getTokens(text1);
  const tokens2 = getTokens(text2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersectionCount = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionCount > 0 ? (intersectionCount / unionCount) : 0;

  // Boost if key civic synonyms match (e.g. pothole / crater / cavity / gaddha)
  const synonyms: Array<Set<string>> = [
    new Set(['pothole', 'crater', 'cavity', 'gaddha', 'hole', 'broken', 'damaged']),
    new Set(['garbage', 'trash', 'waste', 'dump', 'kachra', 'smell', 'overflow']),
    new Set(['waterlogging', 'flooding', 'drain', 'overflow', 'water', 'paani']),
    new Set(['streetlight', 'dark', 'light', 'lamp', 'bulb', 'night', 'andhera']),
    new Set(['pipeline', 'leak', 'water', 'pipe', 'leakage', 'burst']),
  ];

  let synonymBonus = 0;
  for (const group of synonyms) {
    const has1 = [...tokens1].some((w) => group.has(w));
    const has2 = [...tokens2].some((w) => group.has(w));
    if (has1 && has2) synonymBonus = 0.25;
  }

  const score = Math.min(1.0, jaccard * 0.75 + synonymBonus);
  return Math.round(score * 100);
}

// Auto-categorize text based on civic keywords
export function predictCategoryFromText(text: string): {
  category: IssueCategory;
  confidence: number;
} {
  const lower = text.toLowerCase();
  const rules: { category: IssueCategory; keywords: string[] }[] = [
    { category: 'pothole', keywords: ['pothole', 'gaddha', 'crater', 'asphalt', 'road damage', 'road broken', 'tar', 'bump'] },
    { category: 'waterlogging', keywords: ['waterlogging', 'flooding', 'water log', 'stagnant water', 'submerged', 'water accumulated'] },
    { category: 'garbage', keywords: ['garbage', 'waste', 'trash', 'kachra', 'dump', 'overflowing bin', 'litter', 'filth'] },
    { category: 'drainage', keywords: ['drain', 'gutter', 'sewer', 'naali', 'clogged drain', 'sewage', 'choked'] },
    { category: 'streetlight', keywords: ['streetlight', 'street light', 'pole', 'darkness', 'lamp broken', 'andhera', 'light off'] },
    { category: 'water_supply', keywords: ['pipeline', 'pipe burst', 'drinking water', 'no water', 'supply leak', 'pipe leak'] },
    { category: 'traffic', keywords: ['traffic jam', 'obstruction', 'blocked road', 'fallen tree', 'vehicle stuck'] },
    { category: 'infrastructure', keywords: ['footpath', 'pavement', 'railing', 'manhole cover', 'bench', 'boundary wall'] },
  ];

  let bestCategory: IssueCategory = 'other';
  let maxMatches = 0;

  for (const rule of rules) {
    let matches = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = rule.category;
    }
  }

  const confidence = maxMatches > 0 ? Math.min(95, 60 + maxMatches * 15) : 35;
  return { category: bestCategory, confidence };
}

// Calculate Transparent Multi-Factor Priority Score
export function calculatePriorityScore(
  category: IssueCategory,
  corroborationCount: number,
  createdAt: string,
  landmark?: string
): PriorityScoreBreakdown {
  // 1. Volume Factor (0 to 30 pts)
  // More citizens corroborating the same issue increases urgency
  let volumeFactor = Math.min(30, 8 + (corroborationCount - 1) * 7);

  // 2. Severity Factor (0 to 30 pts)
  let severityFactor = 15;
  switch (category) {
    case 'pothole':
      severityFactor = 26; // High accident hazard for 2-wheelers
      break;
    case 'waterlogging':
      severityFactor = 28; // Dengue / monsoon vehicle stall hazard
      break;
    case 'drainage':
      severityFactor = 22;
      break;
    case 'water_supply':
      severityFactor = 24; // Public health & resource wastage
      break;
    case 'garbage':
      severityFactor = 20; // Sanitation vector
      break;
    case 'streetlight':
      severityFactor = 18; // Night safety & crime deterrent
      break;
    case 'traffic':
      severityFactor = 22;
      break;
    case 'infrastructure':
      severityFactor = 16;
      break;
    default:
      severityFactor = 14;
  }

  // 3. Proximity to Vulnerable Public Facilities (0 to 25 pts)
  let vulnerabilityFactor = 10;
  const lmark = (landmark || '').toLowerCase();
  if (
    lmark.includes('school') ||
    lmark.includes('hospital') ||
    lmark.includes('clinic') ||
    lmark.includes('metro') ||
    lmark.includes('bus') ||
    lmark.includes('station')
  ) {
    vulnerabilityFactor = 24;
  } else if (lmark.includes('market') || lmark.includes('bazaar') || lmark.includes('mandir')) {
    vulnerabilityFactor = 18;
  }

  // 4. Age / Staleness Factor (0 to 15 pts)
  const daysPending = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const stalenessFactor = Math.min(15, Math.round(daysPending * 2.5));

  const totalScore = Math.min(100, volumeFactor + severityFactor + vulnerabilityFactor + stalenessFactor);

  let level: PriorityLevel = 'LOW';
  if (totalScore >= 80) level = 'CRITICAL';
  else if (totalScore >= 65) level = 'HIGH';
  else if (totalScore >= 45) level = 'MEDIUM';

  const reasoning = `Calculated score ${totalScore}/100: Volume corroboration (${volumeFactor}/30 pts), Hazard severity (${severityFactor}/30 pts), Facility sensitivity (${vulnerabilityFactor}/25 pts), Pending staleness (${stalenessFactor}/15 pts).`;

  return {
    totalScore,
    level,
    volumeFactor,
    severityFactor,
    vulnerabilityFactor,
    stalenessFactor,
    reasoning,
  };
}

// Evaluate duplicate candidate between new report and existing reports
export function evaluateDuplicateCandidate(
  target: Report,
  candidate: Report
): DuplicateCandidate | null {
  if (target.id === candidate.id) return null;

  // Spatial distance in meters
  const distance = calculateDistanceMeters(
    target.location.latitude,
    target.location.longitude,
    candidate.location.latitude,
    candidate.location.longitude
  );

  // If reports are over 350 meters apart, they are unlikely to be identical local problems
  if (distance > 350) return null;

  // Category match
  const categoryMatch = target.category === candidate.category;

  // Semantic similarity between descriptions and titles
  const textSimTitle = calculateTextSimilarity(target.title, candidate.title);
  const textSimDesc = calculateTextSimilarity(target.description, candidate.description);
  const semanticSimilarity = Math.max(textSimTitle, textSimDesc);

  // Simulated image match score (evidence feature heuristic)
  const imageSimilarity = (target.photos.length > 0 && candidate.photos.length > 0) ? 75 : 40;

  // Spatial closeness score (100 if <= 20m, 50 at 150m, 0 at 350m)
  const spatialScore = Math.max(0, Math.round(100 - (distance / 350) * 100));

  // Weighted overall AI confidence
  // 40% spatial + 35% semantic + 15% category + 10% image
  let overall =
    spatialScore * 0.4 +
    semanticSimilarity * 0.35 +
    (categoryMatch ? 15 : 0) +
    imageSimilarity * 0.1;

  overall = Math.round(Math.min(98, Math.max(15, overall)));

  // If confidence meets threshold or distance is very small with matching category
  if (overall < 45 && !(distance <= 80 && categoryMatch)) {
    return null;
  }

  const explanation = `${distance}m geographic separation; ${semanticSimilarity}% text overlap; ${
    categoryMatch ? 'identical category (' + target.category + ')' : 'different categories'
  }. Human verification recommended before grouping.`;

  return {
    reportId: target.id,
    matchingReportId: candidate.id,
    overallConfidence: overall,
    distanceMeters: distance,
    semanticSimilarity,
    categoryMatch,
    imageSimilarity,
    explanation,
    status: 'PENDING_REVIEW',
  };
}
