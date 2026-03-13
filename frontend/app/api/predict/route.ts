import { NextResponse } from "next/server"

// Sample dataset for productivity predictions
const productivityData = [
  { phone_hours: 1.0, sleep_hours: 8.0, productive_score: 9.2 },
  { phone_hours: 2.0, sleep_hours: 7.5, productive_score: 8.5 },
  { phone_hours: 2.5, sleep_hours: 7.0, productive_score: 7.8 },
  { phone_hours: 3.0, sleep_hours: 6.5, productive_score: 6.5 },
  { phone_hours: 3.5, sleep_hours: 6.0, productive_score: 5.8 },
  { phone_hours: 4.0, sleep_hours: 5.5, productive_score: 4.5 },
  { phone_hours: 4.5, sleep_hours: 7.0, productive_score: 5.2 },
  { phone_hours: 5.0, sleep_hours: 8.0, productive_score: 5.8 },
  { phone_hours: 1.5, sleep_hours: 9.0, productive_score: 9.5 },
  { phone_hours: 2.0, sleep_hours: 8.5, productive_score: 9.0 },
  { phone_hours: 3.0, sleep_hours: 7.0, productive_score: 7.0 },
  { phone_hours: 0.5, sleep_hours: 7.5, productive_score: 9.0 },
  { phone_hours: 5.5, sleep_hours: 6.0, productive_score: 3.5 },
  { phone_hours: 6.0, sleep_hours: 5.0, productive_score: 2.5 },
  { phone_hours: 2.5, sleep_hours: 8.0, productive_score: 8.2 },
  { phone_hours: 1.0, sleep_hours: 6.5, productive_score: 7.5 },
  { phone_hours: 4.0, sleep_hours: 7.5, productive_score: 6.0 },
  { phone_hours: 3.5, sleep_hours: 8.5, productive_score: 7.2 },
  { phone_hours: 2.0, sleep_hours: 6.0, productive_score: 6.8 },
  { phone_hours: 6.5, sleep_hours: 7.0, productive_score: 4.0 },
  { phone_hours: 7.0, sleep_hours: 6.5, productive_score: 3.0 },
  { phone_hours: 1.5, sleep_hours: 7.0, productive_score: 8.0 },
  { phone_hours: 0.5, sleep_hours: 9.0, productive_score: 9.8 },
  { phone_hours: 5.0, sleep_hours: 5.5, productive_score: 3.8 },
  { phone_hours: 3.0, sleep_hours: 8.0, productive_score: 7.5 },
]

// ML prediction function using linear regression coefficients
function predictProductiveScore(phoneHours: number, sleepHours: number = 7.0): number {
  // Pre-trained coefficients (simplified linear regression)
  const intercept = 5.5
  const phoneCoeff = -0.95 // Negative impact of phone usage
  const sleepCoeff = 0.65 // Positive impact of sleep
  
  let score = intercept + (phoneCoeff * phoneHours) + (sleepCoeff * sleepHours)
  
  // Clamp between 0-10
  score = Math.max(0, Math.min(10, score))
  
  return Math.round(score * 10) / 10
}

// Generate productivity message based on score
function generateProductivityMessage(score: number): { label: string; message: string; status: "high" | "medium" | "low" } {
  if (score >= 7.5) {
    return {
      label: "High Productivity",
      message: "Excellent! You're set up for a highly productive day!",
      status: "high"
    }
  } else if (score >= 5.0) {
    return {
      label: "Moderate Productivity",
      message: "Decent productivity expected. Consider reducing screen time.",
      status: "medium"
    }
  } else {
    return {
      label: "Low Productivity",
      message: "Warning: Productivity may be impacted. Adjust your habits.",
      status: "low"
    }
  }
}

// Calculate correlation between two arrays
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100) / 100
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, phoneHours, sleepHours, maxPhoneHours, targetSleepHours } = body

  if (action === "predict") {
    const score = predictProductiveScore(phoneHours, sleepHours)
    const { label, message, status } = generateProductivityMessage(score)
    
    // Generate chart data for phone hours vs predicted score
    const chartData = []
    for (let ph = 0; ph <= 8; ph += 0.5) {
      chartData.push({
        phoneHours: ph,
        predictedScore: predictProductiveScore(ph, sleepHours)
      })
    }
    
    return NextResponse.json({
      score,
      label,
      message,
      status,
      chartData
    })
  }

  if (action === "getDataset") {
    const avgPhoneHours = Math.round(productivityData.reduce((sum, d) => sum + d.phone_hours, 0) / productivityData.length * 10) / 10
    const avgSleepHours = Math.round(productivityData.reduce((sum, d) => sum + d.sleep_hours, 0) / productivityData.length * 10) / 10
    const avgProductivity = Math.round(productivityData.reduce((sum, d) => sum + d.productive_score, 0) / productivityData.length * 10) / 10
    
    const phoneArray = productivityData.map(d => d.phone_hours)
    const sleepArray = productivityData.map(d => d.sleep_hours)
    const scoreArray = productivityData.map(d => d.productive_score)
    
    const correlations = {
      phoneVsScore: calculateCorrelation(phoneArray, scoreArray),
      sleepVsScore: calculateCorrelation(sleepArray, scoreArray),
      phoneVsSleep: calculateCorrelation(phoneArray, sleepArray)
    }
    
    return NextResponse.json({
      stats: {
        avgPhoneHours,
        avgSleepHours,
        avgProductivity,
        totalRecords: productivityData.length
      },
      correlations,
      data: productivityData.slice(0, 10)
    })
  }

  if (action === "optimize") {
    const results: Array<{ phoneHours: number; sleepHours: number; predictedScore: number }> = []
    
    // Generate combinations
    for (let ph = 0; ph <= maxPhoneHours; ph += 0.5) {
      for (let sh = 6; sh <= targetSleepHours; sh += 0.5) {
        results.push({
          phoneHours: ph,
          sleepHours: sh,
          predictedScore: predictProductiveScore(ph, sh)
        })
      }
    }
    
    // Sort by score and get top 5
    results.sort((a, b) => b.predictedScore - a.predictedScore)
    const top5 = results.slice(0, 5)
    
    return NextResponse.json({
      top5,
      best: top5[0]
    })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
