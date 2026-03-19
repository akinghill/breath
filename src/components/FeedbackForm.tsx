import { useForm, ValidationError } from '@formspree/react'
import { Button } from '@/components/ui/button'

export function FeedbackForm({ onClose }: { onClose: () => void }) {
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
        What can we do to improve Breath Force for you?
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
