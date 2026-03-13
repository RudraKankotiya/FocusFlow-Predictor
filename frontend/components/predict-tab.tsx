"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Smartphone, Moon, Rocket, TrendingUp, TrendingDown, Minus, AlertCircle, Loader2 } from "lucide-react"

type PredictResponse = {
  predicted_score: number;
  label: string;
  message: string;
};

export function PredictTab() {
  const [phoneHours, setPhoneHours] = useState([2.5])
  const [sleepHours, setSleepHours] = useState([7.0])
  const [predictedScore, setPredictedScore] = useState<number | null>(null)
  const [label, setLabel] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("https://web-production-098d6.up.railway.app/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_hours: phoneHours[0],
          sleep_hours: sleepHours[0],
          notifications_per_day: null,
          work_hours_per_day: null,
          historical_mean: null
        })
      })

      if (!response.ok) {
        throw new Error("Failed to get prediction from the server.")
      }

      const data: PredictResponse = await response.json()
      setPredictedScore(data.predicted_score)
      setLabel(data.label)
      setMessage(data.message)
    } catch (error) {
      console.error("Prediction error:", error)
      setError("Unable to connect to the prediction server. Please make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const getBadgeColor = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes("high") || l.includes("decent")) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    }
    if (l.includes("below")) {
      return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    }
    if (l.includes("very low")) {
      return "bg-red-500/20 text-red-400 border-red-500/30"
    }
    return "bg-muted text-muted-foreground"
  }

  const getStatusIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes("high") || l.includes("decent")) return <TrendingUp className="w-4 h-4" />
    if (l.includes("below")) return <Minus className="w-4 h-4" />
    if (l.includes("very low")) return <TrendingDown className="w-4 h-4" />
    return null
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold gradient-text">
          Predict Your Productivity
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Discover how your sleep and screen time impact your daily performance
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
              Phone Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Daily screen time</span>
              <span className="text-2xl font-bold gradient-text">{phoneHours[0]}h</span>
            </div>
            <Slider
              value={phoneHours}
              onValueChange={setPhoneHours}
              min={0}
              max={8}
              step={0.25}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0h</span>
              <span>8h</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-lg gradient-primary">
                <Moon className="w-5 h-5 text-white" />
              </div>
              Sleep Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Hours of sleep</span>
              <span className="text-2xl font-bold gradient-text">{sleepHours[0]}h</span>
            </div>
            <Slider
              value={sleepHours}
              onValueChange={setSleepHours}
              min={4}
              max={10}
              step={0.25}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>4h</span>
              <span>10h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predict Button */}
      <div className="flex justify-center flex-col items-center gap-6">
        <Button
          onClick={handlePredict}
          disabled={loading}
          size="lg"
          className="gradient-primary text-white px-8 py-6 text-lg font-semibold glow hover:opacity-90 transition-opacity min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Predicting...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              Predict Productivity
            </>
          )}
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="max-w-xl glass border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Results */}
      {predictedScore !== null && label && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="glass border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground mb-2">Predicted Score</p>
                  <div className="text-6xl font-bold gradient-text">
                    {predictedScore.toFixed(1)}
                    <span className="text-2xl text-muted-foreground">/10</span>
                  </div>
                </div>
                <div className="flex flex-col items-center md:items-end gap-3">
                  <Badge className={`${getBadgeColor(label)} text-base px-4 py-2 flex items-center gap-2 border`}>
                    {getStatusIcon(label)}
                    {label}
                  </Badge>
                  <p className="text-muted-foreground text-center md:text-right max-w-xs">
                    {message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
