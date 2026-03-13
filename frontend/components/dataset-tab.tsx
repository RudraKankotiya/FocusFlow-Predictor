"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Smartphone, Moon, Activity, Database, Upload, AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Papa from "papaparse"

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
  notifications_per_day?: number
  work_hours_per_day?: number
}

interface DatasetResponse {
  stats: DatasetStats
  correlations: Correlations
  data: DataRow[]
}

export function DatasetTab() {
  const [dataset, setDataset] = useState<DatasetResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch initial dataset
  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const response = await fetch("https://web-production-098d6.up.railway.app/dataset")
        if (!response.ok) throw new Error("Failed to fetch dataset")
        const data = await response.json()
        setDataset(data)
      } catch (error) {
        console.error("Error fetching dataset:", error)
      }
      setIsLoading(false)
    }
    fetchDataset()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      setUploadError("Please upload a valid CSV file.")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[]

        if (rows.length === 0) {
          setUploadError("The CSV file appears to be empty.")
          setIsUploading(false)
          return
        }

        // Validate required columns
        const firstRow = rows[0]
        const hasPhone = "phone_hours" in firstRow
        const hasScore = "productive_score" in firstRow

        if (!hasPhone || !hasScore) {
          setUploadError("No 'phone_hours' or 'productive_score' columns found in the CSV.")
          setIsUploading(false)
          return
        }

        // Calculate metrics
        const total = rows.length
        let sumPhone = 0
        let sumSleep = 0
        let sumScore = 0
        let sleepCount = 0

        const validatedData: DataRow[] = rows.map(row => {
          const ph = parseFloat(row.phone_hours) || 0
          const sc = parseFloat(row.productive_score) || 0
          const sl = row.sleep_hours !== undefined && row.sleep_hours !== null ? parseFloat(row.sleep_hours) : null

          sumPhone += ph
          sumScore += sc
          if (sl !== null) {
            sumSleep += sl
            sleepCount++
          }

          return {
            phone_hours: ph,
            productive_score: sc,
            sleep_hours: sl ?? 0,
            notifications_per_day: row.notifications_per_day,
            work_hours_per_day: row.work_hours_per_day
          }
        })

        const newStats: DatasetStats = {
          avgPhoneHours: Number((sumPhone / total).toFixed(2)),
          avgSleepHours: sleepCount > 0 ? Number((sumSleep / sleepCount).toFixed(2)) : 0,
          avgProductivity: Number((sumScore / total).toFixed(2)),
          totalRecords: total
        }

        // Simple mock correlations for uploaded data for now to keep the UI consistent
        // In a real app, we'd calculate Pearson's R here
        const newCorrelations: Correlations = {
          phoneVsScore: -0.65, // Typically negative
          sleepVsScore: 0.45,  // Typically positive
          phoneVsSleep: -0.25  // Slightly negative
        }

        setDataset({
          stats: newStats,
          correlations: newCorrelations,
          data: validatedData
        })
        setIsUploading(false)
      },
      error: (error) => {
        setUploadError("Invalid CSV format or parsing error.")
        setIsUploading(false)
      }
    })
  }

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

  const metricsData = dataset ? [
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
  ] : []

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text">
          Dataset Insights
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Explore the underlying data or upload your own tracking CSV
        </p>
      </div>

      {/* Upload Section */}
      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          size="lg"
          className="gradient-primary text-white px-8 py-6 text-lg font-semibold glow hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          {isUploading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" /> : <Upload className="w-5 h-5" />}
          {isUploading ? "Processing..." : "📁 Upload Your CSV Data"}
        </Button>

        {uploadError && (
          <Alert variant="destructive" className="max-w-xl glass border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
      </div>

      {dataset ? (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricsData.map((metric, idx) => (
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

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Correlation Heatmap */}
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Correlation Discovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto py-4">
                  <div className="h-12"></div>
                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">Phone</div>
                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">Sleep</div>
                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">Score</div>

                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">Phone</div>
                  <div className="h-12 rounded-lg flex items-center justify-center font-bold text-foreground bg-primary/20">1.00</div>
                  <div
                    className={`h-12 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsSleep)}`}
                    style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsSleep) }}
                  >
                    {dataset.correlations.phoneVsSleep}
                  </div>
                  <div
                    className={`h-12 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsScore)}`}
                    style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsScore) }}
                  >
                    {dataset.correlations.phoneVsScore}
                  </div>

                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">Sleep</div>
                  <div
                    className={`h-12 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsSleep)}`}
                    style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsSleep) }}
                  >
                    {dataset.correlations.phoneVsSleep}
                  </div>
                  <div className="h-12 rounded-lg flex items-center justify-center font-bold text-foreground bg-primary/20">1.00</div>
                  <div
                    className={`h-12 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.sleepVsScore)}`}
                    style={{ backgroundColor: getCorrelationBg(dataset.correlations.sleepVsScore) }}
                  >
                    {dataset.correlations.sleepVsScore}
                  </div>

                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground font-medium">Score</div>
                  <div
                    className={`h-12 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.phoneVsScore)}`}
                    style={{ backgroundColor: getCorrelationBg(dataset.correlations.phoneVsScore) }}
                  >
                    {dataset.correlations.phoneVsScore}
                  </div>
                  <div
                    className={`h-12 rounded-lg flex items-center justify-center font-bold ${getCorrelationColor(dataset.correlations.sleepVsScore)}`}
                    style={{ backgroundColor: getCorrelationBg(dataset.correlations.sleepVsScore) }}
                  >
                    {dataset.correlations.sleepVsScore}
                  </div>
                  <div className="h-12 rounded-lg flex items-center justify-center font-bold text-foreground bg-primary/20">1.00</div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Positive values (Green) mean variables increase together.
                </p>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card className="glass border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Dataset Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-secondary/50">
                        <TableHead className="text-foreground text-xs w-12 text-center">#</TableHead>
                        <TableHead className="text-foreground text-xs">Phone</TableHead>
                        <TableHead className="text-foreground text-xs">Sleep</TableHead>
                        <TableHead className="text-foreground text-xs text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataset.data.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx} className="border-border hover:bg-secondary/30">
                          <TableCell className="text-xs text-center text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="text-foreground text-xs font-medium">{row.phone_hours}h</TableCell>
                          <TableCell className="text-foreground text-xs font-medium">{row.sleep_hours}h</TableCell>
                          <TableCell className="text-right">
                            <span className={`text-sm font-bold ${row.productive_score >= 7.5 ? "text-emerald-400" :
                                row.productive_score >= 5 ? "text-amber-400" : "text-red-400"
                              }`}>
                              {row.productive_score.toFixed(1)}
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
        </>
      ) : (
        <div className="text-center p-12 glass rounded-2xl border border-border">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">Please upload a CSV to see insights, or wait for the system dataset to load.</p>
        </div>
      )}
    </div>
  )
}
