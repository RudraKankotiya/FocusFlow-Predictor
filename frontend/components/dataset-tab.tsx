"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Smartphone, Moon, Activity, Database } from "lucide-react"

interface DatasetStats {
  avgPhoneHours: number
  avgSleepHours: number
  avgProductivity: number
  totalRecords: number
}

interface Correlations {
  phoneVsScore: number
  sleepVsScore: number
  phoneVsSleep: number
}

interface DataRow {
  phone_hours: number
  sleep_hours: number
  productive_score: number
}

interface DatasetResponse {
  stats: DatasetStats
  correlations: Correlations
  data: DataRow[]
}

export function DatasetTab() {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getDataset" })
        })
        const data = await response.json()
        setDataset(data)
      } catch (error) {
        console.error("Error fetching dataset:", error)
      }
      setIsLoading(false)
    }
    fetchDataset()
  }, [])

  const getCorrelationColor = (value: number) => {
    if (value > 0.5) return "text-emerald-400"
    if (value > 0) return "text-amber-400"
    if (value > -0.5) return "text-orange-400"
    return "text-red-400"
  }

  const getCorrelationBg = (value: number) => {
    const intensity = Math.abs(value)
    if (value > 0) {
      return `rgba(52, 211, 153, ${intensity * 0.4})`
    }
    return `rgba(248, 113, 113, ${intensity * 0.4})`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!dataset) return null

  const metrics = [
    { 
      icon: Smartphone, 
      label: "Avg Phone Hours", 
      value: `${dataset.stats.avgPhoneHours}h`,
      color: "from-violet-500 to-purple-500"
    },
    { 
      icon: Moon, 
      label: "Avg Sleep", 
      value: `${dataset.stats.avgSleepHours}h`,
      color: "from-blue-500 to-cyan-500"
    },
    { 
      icon: Activity, 
      label: "Avg Productivity", 
      value: `${dataset.stats.avgProductivity}/10`,
      color: "from-emerald-500 to-teal-500"
    },
    { 
      icon: Database, 
      label: "Total Records", 
      value: dataset.stats.totalRecords.toString(),
      color: "from-pink-500 to-rose-500"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text">
          Dataset Insights
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Explore the underlying data powering our ML predictions
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color}`}>
                  <metric.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Correlation Heatmap */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Correlation Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            {/* Header row */}
            <div className="h-16"></div>
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground font-medium">Phone</div>
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground font-medium">Sleep</div>
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground font-medium">Score</div>
            
            {/* Phone row */}
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground font-medium">Phone</div>
            <div 
              className="h-16 rounded-lg flex items-center justify-center font-bold text-foreground"
              style={{ backgroundColor: getCorrelationBg(1) }}
            >
              1.00
            </div>
            <div 
              className={`h-16 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsSleep)}`}
              style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsSleep) }}
            >
              {dataset.correlations.phoneVsSleep}
            </div>
            <div 
              className={`h-16 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsScore)}`}
              style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsScore) }}
            >
              {dataset.correlations.phoneVsScore}
            </div>
            
            {/* Sleep row */}
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground font-medium">Sleep</div>
            <div 
              className={`h-16 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsSleep)}`}
              style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsSleep) }}
            >
              {dataset.correlations.phoneVsSleep}
            </div>
            <div 
              className="h-16 rounded-lg flex items-center justify-center font-bold text-foreground"
              style={{ backgroundColor: getCorrelationBg(1) }}
            >
              1.00
            </div>
            <div 
              className={`h-16 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.sleepVsScore)}`}
              style={{ backgroundColor: getCorrelationBg(dataset.correlations.sleepVsScore) }}
            >
              {dataset.correlations.sleepVsScore}
            </div>
            
            {/* Score row */}
            <div className="h-16 flex items-center justify-center text-sm text-muted-foreground font-medium">Score</div>
            <div 
              className={`h-16 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsScore)}`}
              style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsScore) }}
            >
              {dataset.correlations.phoneVsScore}
            </div>
            <div 
              className={`h-16 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.sleepVsScore)}`}
              style={{ backgroundColor: getCorrelationBg(dataset.correlations.sleepVsScore) }}
            >
              {dataset.correlations.sleepVsScore}
            </div>
            <div 
              className="h-16 rounded-lg flex items-center justify-center font-bold text-foreground"
              style={{ backgroundColor: getCorrelationBg(1) }}
            >
              1.00
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Green = positive correlation, Red = negative correlation
          </p>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Data Preview (First 10 Records)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-secondary/50">
                  <TableHead className="text-foreground">#</TableHead>
                  <TableHead className="text-foreground">Phone Hours</TableHead>
                  <TableHead className="text-foreground">Sleep Hours</TableHead>
                  <TableHead className="text-foreground">Productivity Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.data.map((row, idx) => (
                  <TableRow key={idx} className="border-border hover:bg-secondary/30">
                    <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="text-foreground">{row.phone_hours}h</TableCell>
                    <TableCell className="text-foreground">{row.sleep_hours}h</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        row.productive_score >= 7.5 ? "text-emerald-400" :
                        row.productive_score >= 5 ? "text-amber-400" : "text-red-400"
                      }`}>
                        {row.productive_score}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
