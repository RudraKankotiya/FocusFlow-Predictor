"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Smartphone, Moon, Zap, Trophy, Target, AlertCircle, Loader2 } from "lucide-react"

type PredictResponse = {
  predicted_score: number;
  label: string;
  message: string;
};

interface OptimizeResult {
  phone: number
  sleep: number
  score: number
}

export function OptimizerTab() {
  const [maxPhoneHours, setMaxPhoneHours] = useState([4])
  const [targetSleepHours, setTargetSleepHours] = useState([8])
  const [results, setResults] = useState<OptimizeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOptimize = async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      // Generate DIVERSE combos within user limits with 0.25h steps
      const combinations: { phone: number; sleep: number }[] = []
      const phoneStep = 0.25
      const sleepStep = 0.25

      for (let p = 0.25; p <= maxPhoneHours[0]; p += phoneStep) {
        for (let s = 6.0; s <= targetSleepHours[0]; s += sleepStep) {
          combinations.push({
            phone: Math.round(p * 4) / 4,
            sleep: Math.round(s * 4) / 4
          })
        }
      }

      console.log(`🔍 Testing ${combinations.length} combinations...`)

      const allResults: OptimizeResult[] = []
      // Batch API calls (5 at a time) to avoid rate limits and browser throttling
      for (let i = 0; i < combinations.length; i += 5) {
        const batch = combinations.slice(i, i + 5)
        const batchPromises = batch.map(combo =>
          fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone_hours: combo.phone,
              sleep_hours: combo.sleep,
              notifications_per_day: null,
              work_hours_per_day: null,
              historical_mean: null,
            })
          }).then(async r => {
            if (!r.ok) throw new Error("API failed")
            return r.json()
          })
        )

        const batchResults = await Promise.allSettled(batchPromises)
        batchResults.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            allResults.push({
              phone: batch[idx].phone,
              sleep: batch[idx].sleep,
              score: result.value.predicted_score
            })
          }
        })
      }

      // Sort by score DESC + take top 5 UNIQUE combos
      const uniqueTop5 = allResults
        .sort((a, b) => b.score - a.score)
        .filter((item, index, self) =>
          index === self.findIndex(t =>
            t.phone === item.phone && t.sleep === item.sleep
          )
        )
        .slice(0, 5)

      setResults(uniqueTop5)
    } catch (err) {
      console.error("Optimization error:", err)
      setError("Unable to complete optimization. Check your backend connection.")
    } finally {
      setLoading(false)
    }
  }

  const bestResult = results.length > 0 ? results[0] : null

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text">
          Schedule Optimizer
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Find the perfect balance between screen time and sleep for maximum productivity
        </p>
      </div>

      {/* Input Sliders */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg gradient-primary">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              Max Phone Hours to Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Test up to</span>
              <span className="text-2xl font-bold gradient-text">{maxPhoneHours[0]}h</span>
            </div>
            <Slider
              value={maxPhoneHours}
              onValueChange={setMaxPhoneHours}
              min={2}
              max={6}
              step={0.5}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>2h</span>
              <span>6h</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg gradient-primary">
                <Moon className="w-5 h-5 text-white" />
              </div>
              Optimal Sleep Target
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Up to</span>
              <span className="text-2xl font-bold gradient-text">{targetSleepHours[0]}h</span>
            </div>
            <Slider
              value={targetSleepHours}
              onValueChange={setTargetSleepHours}
              min={6}
              max={9}
              step={0.5}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>6h</span>
              <span>9h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimize Button */}
      <div className="flex justify-center flex-col items-center gap-6">
        <Button
          onClick={handleOptimize}
          disabled={loading}
          size="lg"
          className="gradient-primary text-white px-8 py-6 text-lg font-semibold glow hover:opacity-90 transition-opacity min-w-[220px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Target className="w-5 h-5 mr-2" />
              Find Best Schedule
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="max-w-xl glass border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && bestResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Best Result Card */}
          <Card className="glass border-border overflow-hidden">
            <div className="gradient-primary p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-white animate-bounce" />
                <h3 className="text-2xl font-bold text-white">Optimal Schedule Found!</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                  <Moon className="w-5 h-5" />
                  <span className="text-lg font-medium">Sleep {bestResult.sleep.toFixed(1)}h</span>
                </div>
                <span className="text-white/40 text-2xl font-light">+</span>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                  <Smartphone className="w-5 h-5" />
                  <span className="text-lg font-medium">Phone {bestResult.phone.toFixed(1)}h</span>
                </div>
                <span className="text-white/40 text-2xl font-light">=</span>
                <Badge className="bg-white text-primary text-xl px-4 py-2 hover:bg-white shadow-lg border-none">
                  <Zap className="w-5 h-5 mr-2 fill-primary" />
                  {bestResult.score.toFixed(1)}/10
                </Badge>
              </div>
            </div>
          </Card>

          {/* Top 5 Results Table */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top 5 Recommendation Grid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-foreground">Rank</TableHead>
                      <TableHead className="text-foreground text-center">Phone Hours</TableHead>
                      <TableHead className="text-foreground text-center">Sleep Hours</TableHead>
                      <TableHead className="text-foreground text-right">Predicted Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow
                        key={idx}
                        className={`border-border ${idx === 0 ? "bg-emerald-500/10 hover:bg-emerald-500/15" : "hover:bg-secondary/30"}`}
                      >
                        <TableCell>
                          {idx === 0 ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <Trophy className="w-3 h-3 mr-1" />
                              Best
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-medium pl-3">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{result.phone.toFixed(1)}h</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Moon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{result.sleep.toFixed(1)}h</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold text-lg ${result.score >= 8 ? "text-emerald-400" :
                            result.score >= 6 ? "text-amber-400" : "text-red-400"
                            }`}>
                            {result.score.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">/10</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
