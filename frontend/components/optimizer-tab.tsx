"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Moon, Zap, Trophy, Target } from "lucide-react"

interface OptimizeResult {
  phoneHours: number
  sleepHours: number
  predictedScore: number
}

interface OptimizeResponse {
  top5: OptimizeResult[]
  best: OptimizeResult
}

export function OptimizerTab() {
  const [maxPhoneHours, setMaxPhoneHours] = useState([4])
  const [targetSleepHours, setTargetSleepHours] = useState([8])
  const [results, setResults] = useState<OptimizeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleOptimize = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize",
          maxPhoneHours: maxPhoneHours[0],
          targetSleepHours: targetSleepHours[0]
        })
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error("Optimization error:", error)
    }
    setIsLoading(false)
  }

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
              Target Sleep Hours
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
      <div className="flex justify-center">
        <Button
          onClick={handleOptimize}
          disabled={isLoading}
          size="lg"
          className="gradient-primary text-white px-8 py-6 text-lg font-semibold glow hover:opacity-90 transition-opacity"
        >
          <Target className="w-5 h-5 mr-2" />
          {isLoading ? "Optimizing..." : "Find Best Schedule"}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Best Result Card */}
          <Card className="glass border-border overflow-hidden">
            <div className="gradient-primary p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-8 h-8 text-white" />
                <h3 className="text-2xl font-bold text-white">Optimal Schedule Found!</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  <span className="text-lg">Sleep {results.best.sleepHours}h</span>
                </div>
                <span className="text-white/60">+</span>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  <span className="text-lg">Phone {results.best.phoneHours}h</span>
                </div>
                <span className="text-white/60">=</span>
                <Badge className="bg-white/20 text-white text-xl px-4 py-2 hover:bg-white/30">
                  <Zap className="w-5 h-5 mr-2" />
                  {results.best.predictedScore}/10
                </Badge>
              </div>
            </div>
          </Card>

          {/* Top 5 Results Table */}
          <Card className="glass border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top 5 Schedule Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-secondary/50">
                      <TableHead className="text-foreground">Rank</TableHead>
                      <TableHead className="text-foreground">Phone Hours</TableHead>
                      <TableHead className="text-foreground">Sleep Hours</TableHead>
                      <TableHead className="text-foreground">Predicted Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.top5.map((result, idx) => (
                      <TableRow 
                        key={idx} 
                        className={`border-border ${idx === 0 ? "bg-primary/10" : "hover:bg-secondary/30"}`}
                      >
                        <TableCell>
                          {idx === 0 ? (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <Trophy className="w-3 h-3 mr-1" />
                              1st
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-medium">{idx + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                            {result.phoneHours}h
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-muted-foreground" />
                            {result.sleepHours}h
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold text-lg ${
                            result.predictedScore >= 8 ? "text-emerald-400" :
                            result.predictedScore >= 6 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {result.predictedScore}
                          </span>
                          <span className="text-muted-foreground">/10</span>
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
