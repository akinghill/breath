import { useReducer, useEffect, useState, useRef } from 'react'
import { playChime } from '@/lib/audio'

export type Phase = 'inhale' | 'hold' | 'exhale'
export type Status = 'idle' | 'running' | 'paused'

export type AppSettings = {
  baseTime: number
  maxRounds: number
  showTimer: boolean
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

const HABIT_KEY = 'breath-habit'

export function todayKey(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export function useBreathingSession(settings: AppSettings) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { status, phase, sets } = state

  const [habit, setHabit] = useState<Record<string, number>>(loadHabit)
  
  const prevStatusRef = useRef<Status>('idle')
  const prevPhaseRef = useRef<Phase>('inhale')
  const wakeLockRef = useRef<any>(null)

  // Screen wake lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.error('Failed to acquire wake lock', err)
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release()
          wakeLockRef.current = null
        } catch (err) {
          console.error('Failed to release wake lock', err)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (status === 'running') {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [status])

  // Detect session completion (running → idle with full sets)
  useEffect(() => {
    if (prevStatusRef.current === 'running' && status === 'idle' && sets === settings.maxRounds) {
      const key = todayKey()
      setHabit(prev => {
        const next = { ...prev, [key]: (prev[key] ?? 0) + 1 }
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

  const start = () => dispatch({ type: 'start', settings })
  const pause = () => dispatch({ type: 'pause' })
  const resume = () => dispatch({ type: 'resume' })
  const stop = () => dispatch({ type: 'stop' })

  return { status, phase, timeLeft: state.timeLeft, sets, habit, today: todayKey(), start, pause, resume, stop }
}
