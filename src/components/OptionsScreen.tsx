import { Settings, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OptionsScreenProps {
  onOpenSettings: () => void
  onOpenFeedback: () => void
  onBack: () => void
}

export function OptionsScreen({ onOpenSettings, onOpenFeedback, onBack }: OptionsScreenProps) {
  return (
    <div className="w-full flex flex-col items-center min-h-[460px]">
      <header className="text-center mb-10 mt-4">
        <h1 className="text-4xl font-bold text-[#6867b3] tracking-tight">Options</h1>
        <p className="text-[#6b7280] mt-2 text-md">Customize your experience</p>
      </header>
      <div className="w-full space-y-4 flex flex-col flex-1">
        <Button
          onClick={onOpenSettings}
          variant="outline"
          className="w-full border-[#4a4b5e] text-white bg-[#1a1b26] hover:bg-[#252638] flex items-center justify-start gap-4 h-14 text-lg px-6"
        >
          <Settings size={22} className="text-[#6366f1]" />
          Settings
        </Button>
        <Button
          onClick={onOpenFeedback}
          variant="outline"
          className="w-full border-[#4a4b5e] text-white bg-[#1a1b26] hover:bg-[#252638] flex items-center justify-start gap-4 h-14 text-lg px-6"
        >
          <MessageSquare size={22} className="text-[#6366f1]" />
          Feedback
        </Button>
      </div>
      <div className="w-full flex justify-center mt-auto pt-6">
        <button
          onClick={onBack}
          className="text-[#4a4b5e] hover:text-[#6b7280] transition-colors text-sm font-medium uppercase tracking-wider underline underline-offset-4"
        >
          Back
        </button>
      </div>
    </div>
  )
}
