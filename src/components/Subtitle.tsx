import { useState, useEffect, useRef } from 'react'
import type { Status } from '@/hooks/useBreathingSession'

const VERBS = ['Find', 'Expand', 'Feel']
const NOUNS = ['Center', 'Life', 'Power']

interface SubtitleProps {
  status: Status
}

export function Subtitle({ status }: SubtitleProps) {
  const [verbIndex, setVerbIndex] = useState(0)
  const [nounIndex, setNounIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (status !== 'idle') return

    const intervalId = setInterval(() => {
      setIsVisible(false)

      timeoutRef.current = setTimeout(() => {
        setVerbIndex((current) => {
          let next;
          do {
            next = Math.floor(Math.random() * VERBS.length)
          } while (next === current)
          return next
        })
        setNounIndex((current) => {
          let next;
          do {
            next = Math.floor(Math.random() * NOUNS.length)
          } while (next === current)
          return next
        })
        setIsVisible(true)
      }, 500)
    }, 6000)

    return () => {
      clearInterval(intervalId)
      // We do not clear the timeout here on purpose, so that if the user starts 
      // the session during a transition, it finishes the fade out/in sequence
    }
  }, [status])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="h-8 mt-2 flex items-center justify-center overflow-hidden w-full max-w-md mx-auto">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-[0.3em] w-full text-[#6b7280] text-lg">
        <div className="text-right flex items-center justify-end">
          <span
            className={`transition-all duration-500 ease-in-out inline-block ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
          >
            {VERBS[verbIndex]}
          </span>
        </div>
        <div className="text-center flex items-center justify-center">
          your
        </div>
        <div className="text-left flex items-center justify-start">
          <span
            className={`transition-all duration-500 ease-in-out inline-block ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
              }`}
          >
            {NOUNS[nounIndex]}
          </span>
        </div>
      </div>
    </div>
  )
}
