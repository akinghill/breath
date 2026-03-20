import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FeedbackForm } from '@/components/FeedbackForm'
import { SettingsOptions } from '@/components/SettingsOptions'
import { OptionsScreen } from '@/components/OptionsScreen'
import { BreathScreen } from '@/components/BreathScreen'
import { useBreathingSession } from '@/hooks/useBreathingSession'
import type { AppSettings } from '@/hooks/useBreathingSession'

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaults: AppSettings = { baseTime: 5, maxRounds: 10, showTimer: true, mode: 'power' }
    try {
      const saved = localStorage.getItem('breath-settings')
      if (saved) return { ...defaults, ...JSON.parse(saved) }
    } catch {}
    return defaults
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'breath' | 'options'>('breath')

  const { status, phase, timeLeft, sets, habit, today, start, pause, resume, stop } = useBreathingSession(settings)

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    localStorage.setItem('breath-settings', JSON.stringify(newSettings))
    setSettingsOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0d0e14] flex items-center justify-center p-6">

      <Card className="w-full max-w-sm bg-[#16171d] border-[#2a2b3a]">
        <CardContent className="p-8 flex flex-col items-center w-full">

          {currentView === 'breath' ? (
            <BreathScreen
              status={status}
              phase={phase}
              timeLeft={timeLeft}
              sets={sets}
              settings={settings}
              habit={habit}
              today={today}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onOptions={() => setCurrentView('options')}
            />
          ) : (
            <OptionsScreen
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenFeedback={() => setFeedbackOpen(true)}
              onBack={() => setCurrentView('breath')}
            />
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
