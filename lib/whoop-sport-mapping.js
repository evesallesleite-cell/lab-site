// WHOOP Sport ID to Sport Name mapping
// Based on official WHOOP API documentation

export const WHOOP_SPORTS = {
  "-1": "Activity",
  "0": "Running",
  "1": "Cycling",
  16: "Baseball",
  17: "Basketball",
  18: "Rowing",
  19: "Fencing",
  20: "Field Hockey",
  21: "Football",
  22: "Golf",
  24: "Ice Hockey",
  25: "Lacrosse",
  27: "Rugby",
  28: "Sailing",
  29: "Skiing",
  30: "Soccer",
  31: "Softball",
  32: "Squash",
  33: "Swimming",
  34: "Tennis",
  35: "Track & Field",
  36: "Volleyball",
  37: "Water Polo",
  38: "Wrestling",
  39: "Boxing",
  42: "Dance",
  43: "Pilates",
  44: "Yoga",
  45: "Weightlifting",
  47: "Cross Country Skiing",
  48: "Functional Fitness",
  49: "Duathlon",
  51: "Gymnastics",
  52: "Hiking/Rucking",
  53: "Horseback Riding",
  55: "Kayaking",
  56: "Martial Arts",
  57: "Mountain Biking",
  59: "Powerlifting",
  60: "Rock Climbing",
  61: "Paddleboarding",
  62: "Triathlon",
  63: "Walking",
  64: "Surfing",
  65: "Elliptical",
  66: "Stairmaster",
  70: "Meditation",
  71: "Other",
  73: "Diving",
  74: "Operations - Tactical",
  75: "Operations - Medical",
  76: "Operations - Flying",
  77: "Operations - Water",
  82: "Ultimate",
  83: "Climber",
  84: "Jumping Rope",
  85: "Australian Football",
  86: "Skateboarding",
  87: "Coaching",
  88: "Ice Bath",
  89: "Commuting",
  90: "Gaming",
  91: "Snowboarding",
  92: "Motocross",
  93: "Caddying",
  94: "Obstacle Course Racing",
  95: "Motor Racing",
  96: "HIIT",
  97: "Spin",
  98: "Jiu Jitsu",
  99: "Manual Labor",
  100: "Cricket",
  101: "Pickleball",
  102: "Inline Skating",
  103: "Box Fitness",
  104: "Spikeball",
  105: "Wheelchair Pushing",
  106: "Paddle Tennis",
  107: "Barre",
  108: "Stage Performance",
  109: "High Stress Work",
  110: "Parkour",
  111: "Gaelic Football",
  112: "Hurling/Camogie",
  113: "Circus Arts",
  121: "Massage Therapy",
  123: "Strength Trainer",
  125: "Watching Sports",
  126: "Assault Bike",
  127: "Kickboxing",
  128: "Stretching",
  230: "Table Tennis",
  231: "Badminton",
  232: "Netball",
  233: "Sauna",
  234: "Disc Golf",
  235: "Yard Work",
  236: "Air Compression",
  237: "Percussive Massage",
  238: "Paintball",
  239: "Ice Skating",
  240: "Handball",
  248: "F45 Training",
  249: "Padel",
  250: "Barry's",
  251: "Dedicated Parenting",
  252: "Stroller Walking",
  253: "Stroller Jogging",
  254: "Toddlerwearing",
  255: "Babywearing",
  258: "Barre3",
  259: "Hot Yoga",
  261: "Stadium Steps",
  262: "Polo",
  263: "Musical Performance",
  264: "Kite Boarding",
  266: "Dog Walking",
  267: "Water Skiing",
  268: "Wakeboarding",
  269: "Cooking",
  270: "Cleaning",
  272: "Public Speaking"
};

// Function to get sport name from sport ID
export const getSportName = (sportId) => {
  return WHOOP_SPORTS[sportId] || `Sport ID ${sportId}`;
};

// Function to get sport emoji/icon
export const getSportIcon = (sportId) => {
  const icons = {
    "-1": "🏃", // Activity
    "0": "🏃", // Running
    "1": "🚴", // Cycling
    "16": "⚾", // Baseball
    "17": "🏀", // Basketball
    "18": "🚣", // Rowing
    "21": "🏈", // Football
    "22": "⛳", // Golf
    "24": "🏒", // Ice Hockey
    "29": "⛷️", // Skiing
    "30": "⚽", // Soccer
    "33": "🏊", // Swimming
    "34": "🎾", // Tennis
    "39": "�", // Boxing
    "42": "💃", // Dance
    "43": "🧘", // Pilates
    "44": "🧘", // Yoga
    "45": "🏋️", // Weightlifting
    "48": "💪", // Functional Fitness
    "52": "🥾", // Hiking/Rucking
    "56": "🥋", // Martial Arts
    "57": "🚵", // Mountain Biking
    "60": "🧗", // Rock Climbing
    "62": "�‍♂️", // Triathlon
    "63": "🚶", // Walking
    "64": "🏄", // Surfing
    "65": "🏃‍♀️", // Elliptical
    "70": "🧘‍♂️", // Meditation
    "71": "❓", // Other
    "84": "🪢", // Jumping Rope
    "88": "🧊", // Ice Bath
    "89": "�", // Commuting
    "90": "🎮", // Gaming
    "91": "🏂", // Snowboarding
    "96": "⚡", // HIIT
    "97": "🚴‍♀️", // Spin
    "98": "🥋", // Jiu Jitsu
    "101": "🏓", // Pickleball
    "107": "🤸", // Barre
    "127": "🥊", // Kickboxing
    "128": "🤸‍♀️", // Stretching
    "230": "🏓", // Table Tennis
    "231": "�", // Badminton
    "233": "🧖", // Sauna
    "259": "🔥", // Hot Yoga
    "266": "🐕", // Dog Walking
    "269": "👨‍🍳", // Cooking
    "270": "🧹", // Cleaning
    "272": "🎤", // Public Speaking
  };
  
  return icons[sportId.toString()] || "🏃";
};

// Function to analyze WHOOP activities from strain records
export const analyzeWhoopActivities = (strainRecords, year = null) => {
  const activityStats = {};
  const dayOfWeekStats = {}; // Track patterns by day of week
  const weeklyPatterns = {}; // Track patterns by activity and day
  let processedRecords = 0;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  strainRecords.forEach((record, index) => {
    // Skip if no sport_id (but allow sport_id 0)
    if (record.sport_id === null || record.sport_id === undefined) {
      return;
    }
    
    const start = new Date(record.start);
    
    // Filter by year if specified
    if (year && start.getFullYear() !== year) {
      return;
    }
    
    processedRecords++;
    
    const sportId = record.sport_id.toString();
    const sportName = getSportName(sportId);
    const strain = record.score?.strain || 0;
    const end = new Date(record.end);
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayName = dayNames[dayOfWeek];
    
    // Track overall day patterns
    if (!dayOfWeekStats[dayName]) {
      dayOfWeekStats[dayName] = { count: 0, activities: {} };
    }
    dayOfWeekStats[dayName].count += 1;
    
    // Track activity-specific day patterns
    if (!dayOfWeekStats[dayName].activities[sportName]) {
      dayOfWeekStats[dayName].activities[sportName] = 0;
    }
    dayOfWeekStats[dayName].activities[sportName] += 1;
    
    if (!activityStats[sportName]) {
      activityStats[sportName] = {
        count: 0,
        totalStrain: 0,
        totalDurationHours: 0,
        averageStrain: 0,
        sportIcon: getSportIcon(sportId),
        sportId: sportId,
        dayPattern: {} // Track which days this activity happens
      };
    }
    
    // Track day pattern for this activity
    if (!activityStats[sportName].dayPattern[dayName]) {
      activityStats[sportName].dayPattern[dayName] = 0;
    }
    activityStats[sportName].dayPattern[dayName] += 1;
    
    activityStats[sportName].count += 1;
    activityStats[sportName].totalStrain += strain;
    activityStats[sportName].totalDurationHours += durationHours;
  });
  
  // Calculate averages and sort
  const activities = Object.entries(activityStats).map(([sportName, stats]) => ({
    sportName,
    ...stats,
    averageStrain: (stats.totalStrain / stats.count).toFixed(2),
    totalDurationHours: stats.totalDurationHours.toFixed(1),
    totalStrain: stats.totalStrain.toFixed(1)
  }));
  
  // Analyze day-of-week patterns
  const dayAnalysis = Object.entries(dayOfWeekStats).map(([day, stats]) => ({
    day,
    totalWorkouts: stats.count,
    activities: Object.entries(stats.activities).map(([sport, count]) => ({
      sport, count
    })).sort((a, b) => b.count - a.count)
  })).sort((a, b) => b.totalWorkouts - a.totalWorkouts);

  return {
    byFrequency: activities.sort((a, b) => b.count - a.count),
    byTotalStrain: activities.sort((a, b) => b.totalStrain - a.totalStrain),
    byDuration: activities.sort((a, b) => b.totalDurationHours - a.totalDurationHours),
    dayPatterns: dayAnalysis,
    summary: {
      totalWorkouts: processedRecords,
      uniqueSports: activities.length,
      mostFrequent: activities.reduce((max, curr) => curr.count > max.count ? curr : max, { count: 0 }),
      highestStrain: activities.reduce((max, curr) => parseFloat(curr.totalStrain) > parseFloat(max.totalStrain) ? curr : max, { totalStrain: 0 }),
      longestDuration: activities.reduce((max, curr) => parseFloat(curr.totalDurationHours) > parseFloat(max.totalDurationHours) ? curr : max, { totalDurationHours: 0 }),
      busiestDay: dayAnalysis[0]?.day || 'N/A',
      busiestDayWorkouts: dayAnalysis[0]?.totalWorkouts || 0
    }
  };
};
