let audioCtx: AudioContext | null = null

export function playChime(frequency: number = 880) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const oscillator = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.type = 'sine'
    osc2.type = 'sine'
    
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime)
    osc2.frequency.setValueAtTime(frequency * 2, audioCtx.currentTime)
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2)

    oscillator.start(audioCtx.currentTime)
    osc2.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 2)
    osc2.stop(audioCtx.currentTime + 2)
  } catch (e) {
    console.error('Audio playback failed:', e)
  }
}
