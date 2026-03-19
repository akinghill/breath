import { useReducer, useEffect, useState, useRef } from 'react'
import { Settings, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { playChime } from '@/lib/audio'
import { WeeklyHabitTracker } from '@/components/WeeklyHabitTracker'
import { FeedbackForm } from '@/components/FeedbackForm'
import { SettingsOptions } from '@/components/SettingsOptions'

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'inhale' | 'hold' | 'exhale'
type Status = 'idle' | 'running' | 'paused'

export type AppSettings = {
  baseTime: number
  maxRounds: number
}

type State = {
  status: Status
  phase: Phase
  timeLeft: number
  sets: number
}

type Action =
  | { type: 'start'; settings: AppSettings }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'tick'; settings: AppSettings }

// ── Breathing logic ──────────────────────────────────────────────────────────

function getPhaseDuration(phase: Phase, baseTime: number): number {
  if (phase === 'inhale') return baseTime
  if (phase === 'hold') return baseTime * 4
  return baseTime * 2
}

function nextPhase(phase: Phase): Phase {
  if (phase === 'inhale') return 'hold'
  if (phase === 'hold') return 'exhale'
  return 'inhale'
}

const initialState: State = { status: 'idle', phase: 'inhale', timeLeft: 0, sets: 0 }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { status: 'running', phase: 'inhale', timeLeft: getPhaseDuration('inhale', action.settings.baseTime), sets: 0 }
    case 'pause':
      return { ...state, status: 'paused' }
    case 'resume':
      return { ...state, status: 'running' }
    case 'stop':
      return initialState
    case 'tick': {
      if (state.status !== 'running') return state
      if (state.timeLeft > 1) return { ...state, timeLeft: state.timeLeft - 1 }
      const next = nextPhase(state.phase)
      const newSets = state.phase === 'exhale' ? state.sets + 1 : state.sets
      if (newSets >= action.settings.maxRounds) {
        return { status: 'idle', phase: 'inhale', timeLeft: 0, sets: newSets }
      }
      return { ...state, phase: next, timeLeft: getPhaseDuration(next, action.settings.baseTime), sets: newSets }
    }
  }
}

// ── Habit tracker helpers ────────────────────────────────────────────────────

const HABIT_KEY = 'breath-habit'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function loadHabit(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(HABIT_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveHabit(data: Record<string, number>) {
  localStorage.setItem(HABIT_KEY, JSON.stringify(data))
}

// ── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { status, phase, sets } = state

  const [settings, setSettings] = useState<AppSettings>({ baseTime: 5, maxRounds: 10 })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [habit, setHabit] = useState<Record<string, number>>(loadHabit)
  const [currentView, setCurrentView] = useState<'breath' | 'options'>('breath')

  const prevStatusRef = useRef<Status>('idle')
  const prevPhaseRef = useRef<Phase>('inhale')

  // Detect session completion (running → idle with full sets)
  useEffect(() => {
    if (prevStatusRef.current === 'running' && status === 'idle' && sets === settings.maxRounds) {
      const key = todayKey()
      setHabit(prev => {
        const next = { ...prev, [key]: Math.min((prev[key] ?? 0) + 1, 3) }
        saveHabit(next)
        return next
      })
      playChime(1046.50) // completion chime
    }
    prevStatusRef.current = status
  }, [status, sets, settings.maxRounds])

  // Play chime on phase change
  useEffect(() => {
    if (status === 'running' && prevPhaseRef.current !== phase) {
      playChime(880) // phase change chime
    }
    prevPhaseRef.current = phase
  }, [phase, status])

  // Interval tick
  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => dispatch({ type: 'tick', settings }), 1000)
    return () => clearInterval(id)
  }, [status, settings])

  const circleStyle = (): React.CSSProperties => {
    if (status !== 'running') return { transform: 'scale(0.82)', transition: 'transform 1s ease' }
    switch (phase) {
      case 'inhale':
        return { transform: 'scale(1)', transition: `transform ${settings.baseTime}s ease-in-out` }
      case 'hold':
        return { transform: 'scale(1)', transition: 'transform 0.4s ease' }
      case 'exhale':
        return { transform: 'scale(0.75)', transition: `transform ${settings.baseTime * 2}s ease-in-out` }
    }
  }

  const circleLabel = () => {
    if (status === 'idle') return 'READY'
    if (status === 'paused') return 'PAUSED'
    return phase.toUpperCase()
  }

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    setSettingsOpen(false)
  }

  const today = todayKey()

  return (
    <div className="min-h-screen bg-[#0d0e14] flex items-center justify-center p-6">

      <Card className="w-full max-w-sm bg-[#16171d] border-[#2a2b3a]">
        <CardContent className="p-8 flex flex-col items-center w-full">

          {currentView === 'breath' ? (
            <>
              <header className="text-center mb-10">
                <h1 className="text-5xl font-bold text-[#6867b3] tracking-tight">Breath Force</h1>
                <p className="text-[#6b7280] mt-2 text-lg">Find your center</p>
              </header>

              <div className="flex items-center justify-center mb-10">
                <div
                  onClick={() => {
                    if (status === 'idle') {
                      playChime(880)
                      dispatch({ type: 'start', settings })
                    }
                  }}
                  className="w-56 h-56 rounded-full flex items-center justify-center"
                  style={{
                    ...circleStyle(),
                    background: 'radial-gradient(circle at center, #161830 0%, #0d0e14 70%)',
                    border: '2px solid #6366f1',
                    boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2), inset 0 0 40px rgba(99,102,241,0.1)',
                    cursor: status === 'idle' ? 'pointer' : 'default',
                  }}
                >
                  <span className="text-white font-bold text-2xl tracking-widest select-none">
                    {circleLabel()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center mb-8 gap-1">
                <p className="text-[#6b7280] text-sm">
                  Round {sets}/{settings.maxRounds}
                </p>
                <p className="text-[#4a4b5e] text-xs font-semibold tracking-widest uppercase">
                  {settings.baseTime} : {settings.baseTime * 4} : {settings.baseTime * 2}
                </p>
              </div>

              {/* Weekly habit tracker */}
              <WeeklyHabitTracker habit={habit} today={today} />

              <div className="w-full space-y-3 mt-4">
                {status !== 'idle' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => dispatch({ type: status === 'paused' ? 'resume' : 'pause' })}
                      className="flex-1 bg-[#5c5fc2] hover:bg-[#6366f1] text-white"
                    >
                      {status === 'paused' ? 'Resume' : 'Pause'}
                    </Button>
                    <Button
                      onClick={() => dispatch({ type: 'stop' })}
                      variant="outline"
                      className="flex-1 border-[#4a4b5e] text-white bg-transparent hover:bg-[#252638]"
                    >
                      Stop
                    </Button>
                  </div>
                )}
                {status === 'idle' && (
                  <div className="flex justify-center items-center pt-2">
                    <button
                      onClick={() => setCurrentView('options')}
                      className="text-[#4a4b5e] hover:text-[#6b7280] transition-colors text-sm font-medium uppercase tracking-wider"
                    >
                      Options
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center min-h-[460px]">
              <header className="text-center mb-10 mt-4">
                <h1 className="text-4xl font-bold text-[#6867b3] tracking-tight">Options</h1>
                <p className="text-[#6b7280] mt-2 text-md">Customize your experience</p>
              </header>
              <div className="w-full space-y-4 flex flex-col flex-1">
                <Button
                  onClick={() => setSettingsOpen(true)}
                  variant="outline"
                  className="w-full border-[#4a4b5e] text-white bg-[#1a1b26] hover:bg-[#252638] flex items-center justify-start gap-4 h-14 text-lg px-6"
                >
                  <Settings size={22} className="text-[#6366f1]" />
                  Settings
                </Button>
                <Button
                  onClick={() => setFeedbackOpen(true)}
                  variant="outline"
                  className="w-full border-[#4a4b5e] text-white bg-[#1a1b26] hover:bg-[#252638] flex items-center justify-start gap-4 h-14 text-lg px-6"
                >
                  <MessageSquare size={22} className="text-[#6366f1]" />
                  Feedback
                </Button>
              </div>
              <div className="w-full flex justify-center mt-auto pt-6">
                <button
                  onClick={() => setCurrentView('breath')}
                  className="text-[#4a4b5e] hover:text-[#6b7280] transition-colors text-sm font-medium uppercase tracking-wider"
                >
                  Back
                </button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#16171d] border-[#2a2b3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Settings</DialogTitle>
          </DialogHeader>

          <SettingsOptions settings={settings} onSave={handleSaveSettings} />
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="bg-[#16171d] border-[#2a2b3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Send Feedback</DialogTitle>
          </DialogHeader>

          <FeedbackForm onClose={() => setFeedbackOpen(false)} />
        </DialogContent>
      </Dialog>

    </div>
  )
}
