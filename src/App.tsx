import { useReducer, useEffect, useState, useRef } from 'react'
import { Settings, MessageSquare } from 'lucide-react'
import { useForm, ValidationError } from '@formspree/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'inhale' | 'hold' | 'exhale'
type Status = 'idle' | 'running' | 'paused'

type AppSettings = {
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

/** Returns the ISO date strings for Mon–Sun of the current week. */
function currentWeekDays(): string[] {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const SESSION_COLORS = [
  '#22233a', // 0 – empty
  '#3b3d7a', // 1 – low
  '#5558c8', // 2 – mid
  '#6366f1', // 3 – full
]

function FeedbackForm({ onClose }: { onClose: () => void }) {
  const [state, handleSubmit] = useForm("maqpakek");

  if (state.succeeded) {
    return (
      <div className="py-6 text-center space-y-6 mt-2">
        <p className="text-[#6867b3] font-medium text-lg">Thank you for your feedback!</p>
        <Button onClick={onClose} className="bg-[#5c5fc2] hover:bg-[#6366f1] text-white w-full">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 flex flex-col">
      <p className="text-sm text-[#9ca3af] mb-2">
        We'd love to hear your thoughts on how we can improve Breath Force.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-[#9ca3af] ml-1 tracking-wide">Email (Optional)</label>
        <input
          id="email"
          type="email"
          name="email"
          className="w-full bg-[#0d0e14] border border-[#2a2b3a] rounded-md p-3 text-sm text-white placeholder-[#4a4b5e] focus:outline-none focus:ring-1 focus:ring-[#6366f1] transition-colors"
          placeholder="your@email.com"
        />
        <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-400 text-xs mt-1" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs font-medium text-[#9ca3af] ml-1 tracking-wide">Message</label>
        <textarea
          id="message"
          name="message"
          required
          className="w-full min-h-[120px] bg-[#0d0e14] border border-[#2a2b3a] rounded-md p-3 text-sm text-white placeholder-[#4a4b5e] focus:outline-none focus:ring-1 focus:ring-[#6366f1] resize-none transition-colors"
          placeholder="Tell us what you think..."
        />
        <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-400 text-xs mt-1" />
      </div>

      <Button
        type="submit"
        disabled={state.submitting}
        className="w-full bg-[#5c5fc2] hover:bg-[#6366f1] text-white mt-4 disabled:opacity-50"
      >
        {state.submitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { status, phase, sets } = state

  const [settings, setSettings] = useState<AppSettings>({ baseTime: 5, maxRounds: 10 })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [draft, setDraft] = useState<AppSettings>(settings)
  const [habit, setHabit] = useState<Record<string, number>>(loadHabit)

  const prevStatusRef = useRef<Status>('idle')

  // Detect session completion (running → idle with full sets)
  useEffect(() => {
    if (prevStatusRef.current === 'running' && status === 'idle' && sets === settings.maxRounds) {
      const key = todayKey()
      setHabit(prev => {
        const next = { ...prev, [key]: Math.min((prev[key] ?? 0) + 1, 3) }
        saveHabit(next)
        return next
      })
    }
    prevStatusRef.current = status
  }, [status, sets, settings.maxRounds])

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

  const openSettings = () => { setDraft(settings); setSettingsOpen(true) }
  const saveSettings = () => { setSettings(draft); setSettingsOpen(false) }

  const weekDays = currentWeekDays()
  const today = todayKey()

  return (
    <div className="min-h-screen bg-[#0d0e14] flex items-center justify-center p-6">

      <Card className="w-full max-w-sm bg-[#16171d] border-[#2a2b3a]">
        <CardContent className="p-8 flex flex-col items-center">

          <header className="text-center mb-10">
            <h1 className="text-5xl font-bold text-[#6867b3] tracking-tight">Breath Force</h1>
            <p className="text-[#6b7280] mt-2 text-lg">Find your center</p>
          </header>

          <div className="flex items-center justify-center mb-10">
            <div
              onClick={() => status === 'idle' && dispatch({ type: 'start', settings })}
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

          <p className="text-[#6b7280] text-sm mb-8">
            Round {sets}/{settings.maxRounds}
          </p>

          {/* Weekly habit tracker */}
          <div className="flex gap-2 mb-8">
            {weekDays.map((date, i) => {
              const count = habit[date] ?? 0
              const isToday = date === today
              return (
                <div key={date} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-lg transition-colors duration-300"
                    style={{ backgroundColor: SESSION_COLORS[count] }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: isToday ? '#6b7280' : '#3a3b4a' }}
                  >
                    {DAY_LABELS[i]}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="w-full space-y-3">
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
            <div className="flex justify-between items-center">
              <button
                onClick={() => setFeedbackOpen(true)}
                disabled={status !== 'idle'}
                className="text-[#4a4b5e] hover:text-[#6b7280] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <MessageSquare size={20} />
                Feedback
              </button>
              <button
                onClick={openSettings}
                disabled={status !== 'idle'}
                className="text-[#4a4b5e] hover:text-[#6b7280] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#16171d] border-[#2a2b3a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-[#9ca3af]">Base Time</label>
                <span className="text-sm font-medium">{draft.baseTime}s</span>
              </div>
              <Slider
                min={2}
                max={10}
                step={1}
                value={[draft.baseTime]}
                onValueChange={([v]) => setDraft(d => ({ ...d, baseTime: v }))}
              />
              <p className="text-xs text-[#4a4b5e]">
                Inhale {draft.baseTime}s · Hold {draft.baseTime * 4}s · Exhale {draft.baseTime * 2}s
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm text-[#9ca3af]">Rounds</label>
                <span className="text-sm font-medium">{draft.maxRounds}</span>
              </div>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[draft.maxRounds]}
                onValueChange={([v]) => setDraft(d => ({ ...d, maxRounds: v }))}
              />
            </div>
          </div>

          <Button
            onClick={saveSettings}
            className="w-full bg-[#5c5fc2] hover:bg-[#6366f1] text-white mt-2"
          >
            Save
          </Button>
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
