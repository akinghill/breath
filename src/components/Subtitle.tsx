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
  const [animState, setAnimState] = useState<'visible' | 'exiting' | 'hidden'>('visible')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (status !== 'idle') return

    const intervalId = setInterval(() => {
      setAnimState('exiting')

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

        setAnimState('hidden')

        snapTimeoutRef.current = setTimeout(() => {
          setAnimState('visible')
        }, 800)
      }, 1000)
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
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)
    }
  }, [])

  return (
    <div className="h-8 mt-2 flex items-center justify-center overflow-hidden w-full max-w-md mx-auto">
      <h2 className="grid grid-cols-[1fr_auto_1fr] gap-[0.3em] w-full text-[#6b7280] text-lg font-normal">
        <div className="text-right flex items-center justify-end">
          <span
            className={`inline-block ${animState === 'visible' ? 'transition-all duration-800 ease-in-out opacity-100 translate-y-0 translate-x-0' :
                animState === 'exiting' ? 'transition-all duration-1000 ease-in-out opacity-0 -translate-y-3 -translate-x-3' :
                  'transition-none opacity-0 translate-y-3 -translate-x-3'
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
            className={`inline-block ${animState === 'visible' ? 'transition-all duration-800 ease-in-out opacity-100 translate-y-0 translate-x-0' :
                animState === 'exiting' ? 'transition-all duration-1000 ease-in-out opacity-0 translate-y-3 translate-x-3' :
                  'transition-none opacity-0 -translate-y-3 translate-x-3'
              }`}
          >
            {NOUNS[nounIndex]}
          </span>
        </div>
      </h2>
    </div>
  )
}
