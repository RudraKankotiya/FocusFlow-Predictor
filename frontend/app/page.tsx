"use client"

import { useState } from "react"
import { PredictTab } from "@/components/predict-tab"
import { DatasetTab } from "@/components/dataset-tab"
import { OptimizerTab } from "@/components/optimizer-tab"
import { Sparkles, BarChart3, Settings2 } from "lucide-react"

const tabs = [
  { id: "predict", label: "Predict Today", icon: Sparkles },
  { id: "dataset", label: "Dataset Insights", icon: BarChart3 },
  { id: "optimizer", label: "Schedule Optimizer", icon: Settings2 },
]

export default function FocusFlowDashboard() {
  const [activeTab, setActiveTab] = useState("predict")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">FocusFlow</h1>
            </div>

            {/* Tab Navigation */}
            <nav className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === tab.id 
                      ? "gradient-primary text-white shadow-lg" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === "predict" && <PredictTab />}
        {activeTab === "dataset" && <DatasetTab />}
        {activeTab === "optimizer" && <OptimizerTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FocusFlow Predictor - ML-powered productivity insights</p>
        </div>
      </footer>
    </div>
  )
}
