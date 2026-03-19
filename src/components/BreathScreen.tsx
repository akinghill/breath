import React from 'react'
import { Button } from '@/components/ui/button'
import { WeeklyHabitTracker } from '@/components/WeeklyHabitTracker'
import { playChime } from '@/lib/audio'
import { Subtitle } from '@/components/Subtitle'
import type { AppSettings, Phase, Status } from '@/hooks/useBreathingSession'

interface BreathScreenProps {
  status: Status
  phase: Phase
  sets: number
  settings: AppSettings
  habit: Record<string, number>
  today: string
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onOptions: () => void
}

export function BreathScreen({
  status,
  phase,
  sets,
  settings,
  habit,
  today,
  onStart,
  onPause,
  onResume,
  onStop,
  onOptions
}: BreathScreenProps) {
  const circleStyle = (): React.CSSProperties => {
    if (status !== 'running') return { transform: 'scale(0.82)', transition: 'transform 1s ease' }
    switch (phase) {
      case 'inhale':
        return { transform: 'scale(1)', transition: `transform ${settings.baseTime}s ease-in-out` }
      case 'hold':
        return { transform: 'scale(1)', transition: 'transform 0.4s ease' }
      case 'exhale':
      default:
        return { transform: 'scale(0.75)', transition: `transform ${settings.baseTime * 2}s ease-in-out` }
    }
  }

  const circleLabel = () => {
    if (status === 'idle') return 'READY'
    if (status === 'paused') return 'PAUSED'
    return phase.toUpperCase()
  }

  return (
    <>
      <header className="text-center mb-10">
        <h1 className="text-5xl font-bold text-[#6867b3] tracking-tight">Breath Force</h1>
        <Subtitle status={status} />
      </header>

      <div className="flex items-center justify-center mb-10">
        <div
          onClick={() => {
            if (status === 'idle') {
              playChime(880)
              onStart()
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
              onClick={status === 'paused' ? onResume : onPause}
              className="flex-1 bg-[#5c5fc2] hover:bg-[#6366f1] text-white"
            >
              {status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={onStop}
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
              onClick={onOptions}
              className="text-[#4a4b5e] hover:text-[#6b7280] transition-colors text-sm font-medium uppercase tracking-wider underline underline-offset-4"
            >
              Options
            </button>
          </div>
        )}
      </div>
    </>
  )
}
