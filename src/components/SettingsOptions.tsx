import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { AppSettings } from '@/hooks/useBreathingSession'

interface SettingsOptionsProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
}

export function SettingsOptions({ settings, onSave }: SettingsOptionsProps) {
  const [draft, setDraft] = useState<AppSettings>(settings)

  return (
    <>
      <div className="space-y-6 py-2">
        <div className="space-y-3">
          <label className="text-sm text-[#9ca3af]">Breathing Method</label>
          <div className="flex bg-[#1a1b26] p-1 rounded-lg border border-[#2a2b3a]">
            <button
              onClick={() => setDraft(d => ({ ...d, mode: 'power' }))}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${draft.mode === 'power' ? 'bg-[#5c5fc2] text-white' : 'text-[#6b7280] hover:text-white'}`}
            >
              Power
            </button>
            <button
              onClick={() => setDraft(d => ({ ...d, mode: 'box' }))}
              className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${draft.mode === 'box' ? 'bg-[#5c5fc2] text-white' : 'text-[#6b7280] hover:text-white'}`}
            >
              Box
            </button>
          </div>
        </div>

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
            {draft.mode === 'power'
              ? `Inhale ${draft.baseTime}s · Hold ${draft.baseTime * 4}s · Exhale ${draft.baseTime * 2}s`
              : `Inhale ${draft.baseTime}s · Hold ${draft.baseTime}s · Exhale ${draft.baseTime}s · Hold ${draft.baseTime}s`
            }
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

        <div className="flex justify-between items-center pt-2">
          <label className="text-sm text-[#9ca3af]">Show Timer</label>
          <Switch 
            checked={draft.showTimer} 
            onCheckedChange={(c) => setDraft(d => ({ ...d, showTimer: c }))} 
          />
        </div>
      </div>

      <Button
        onClick={() => onSave(draft)}
        className="w-full bg-[#5c5fc2] hover:bg-[#6366f1] text-white mt-2"
      >
        Save
      </Button>
    </>
  )
}
