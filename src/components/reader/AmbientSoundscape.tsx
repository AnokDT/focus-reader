import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, CloudRain, Coffee, Wind, TreePine, Waves, Music } from 'lucide-react'

interface SoundPreset {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  create: (ctx: AudioContext) => AudioNode
}

function createBrownNoise(ctx: AudioContext): AudioNode {
  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.5
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 200
  source.connect(filter)
  return filter
}

function createRain(ctx: AudioContext): AudioNode {
  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.97 ? 0.3 : 0.05)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 3000
  filter.Q.value = 0.5
  const gain = ctx.createGain()
  gain.gain.value = 0.4
  source.connect(filter)
  filter.connect(gain)
  return gain
}

function createCafe(ctx: AudioContext): AudioNode {
  // Pink noise + murmur simulation
  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 0.3
  const gain = ctx.createGain()
  gain.gain.value = 0.25
  source.connect(filter)
  filter.connect(gain)
  return gain
}

function createForest(ctx: AudioContext): AudioNode {
  const bufferSize = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate
    // Wind-like modulation
    const wind = Math.sin(t * 0.3) * 0.3 + Math.sin(t * 0.7) * 0.2
    data[i] = (Math.random() * 2 - 1) * 0.04 * (1 + wind)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  const gain = ctx.createGain()
  gain.gain.value = 0.35
  source.connect(filter)
  filter.connect(gain)
  return gain
}

function createWaves(ctx: AudioContext): AudioNode {
  const bufferSize = 4 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    const t = i / ctx.sampleRate
    // Slow rhythmic wave crash
    const wave = Math.pow(Math.sin(t * 0.4), 2) * 0.6 + Math.sin(t * 0.15) * 0.3
    data[i] = (Math.random() * 2 - 1) * 0.08 * Math.max(0, wave)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 600
  const gain = ctx.createGain()
  gain.gain.value = 0.4
  source.connect(filter)
  filter.connect(gain)
  return gain
}

function createLoFi(ctx: AudioContext): AudioNode {
  // Warm lo-fi hum
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 110
  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = 165
  const osc3 = ctx.createOscillator()
  osc3.type = 'triangle'
  osc3.frequency.value = 55

  const gain = ctx.createGain()
  gain.gain.value = 0.03
  const gain2 = ctx.createGain()
  gain2.gain.value = 0.02
  const gain3 = ctx.createGain()
  gain3.gain.value = 0.04

  // LFO for warmth
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.1
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 2
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  osc.connect(gain)
  osc2.connect(gain2)
  osc3.connect(gain3)

  const merger = ctx.createGain()
  gain.connect(merger)
  gain2.connect(merger)
  gain3.connect(merger)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 400
  merger.connect(filter)

  return filter
}

const PRESETS: SoundPreset[] = [
  { id: 'rain', label: 'Rain', icon: <CloudRain size={16} />, color: '#60a5fa', create: createRain },
  { id: 'cafe', label: 'Café', icon: <Coffee size={16} />, color: '#f59e0b', create: createCafe },
  { id: 'brown', label: 'Brown Noise', icon: <Wind size={16} />, color: '#a78bfa', create: createBrownNoise },
  { id: 'forest', label: 'Forest', icon: <TreePine size={16} />, color: '#34d399', create: createForest },
  { id: 'waves', label: 'Waves', icon: <Waves size={16} />, color: '#38bdf8', create: createWaves },
  { id: 'lofi', label: 'Lo-Fi', icon: <Music size={16} />, color: '#f472b6', create: createLoFi },
]

interface ActiveSound {
  id: string
  gain: GainNode
  source: AudioNode
}

export function AmbientSoundscape() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSounds, setActiveSounds] = useState<Map<string, ActiveSound>>(new Map())
  const [volumes, setVolumes] = useState<Map<string, number>>(new Map())
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    return ctxRef.current
  }, [])

  const toggleSound = useCallback((preset: SoundPreset) => {
    const ctx = getCtx()
    setActiveSounds((prev) => {
      const next = new Map(prev)
      if (next.has(preset.id)) {
        // Stop
        const active = next.get(preset.id)!
        active.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
        setTimeout(() => {
          try { active.source.disconnect() } catch {}
        }, 400)
        next.delete(preset.id)
      } else {
        // Start
        const source = preset.create(ctx)
        const gain = ctx.createGain()
        const vol = volumes.get(preset.id) || 0.5
        gain.gain.value = 0
        source.connect(gain)
        gain.connect(ctx.destination)
        if (source instanceof AudioBufferSourceNode) source.start()
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.5)
        next.set(preset.id, { id: preset.id, gain, source })
      }
      return next
    })
  }, [getCtx, volumes])

  const updateVolume = useCallback((id: string, vol: number) => {
    setVolumes((prev) => new Map(prev).set(id, vol))
    const active = activeSounds.get(id)
    if (active) {
      const ctx = getCtx()
      active.gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1)
    }
  }, [activeSounds, getCtx])

  const stopAll = useCallback(() => {
    const ctx = getCtx()
    activeSounds.forEach((active) => {
      active.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      setTimeout(() => { try { active.source.disconnect() } catch {} }, 400)
    })
    setActiveSounds(new Map())
  }, [activeSounds, getCtx])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeSounds.forEach((active) => {
        try { active.source.disconnect() } catch {}
      })
      ctxRef.current?.close()
    }
  }, [])

  const anyPlaying = activeSounds.size > 0

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all ${anyPlaying ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'}`}
        title="Focus Sounds — ambient background audio for concentration"
      >
        {anyPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
        {anyPlaying && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
        )}
      </button>

      {/* Sound panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-72 bg-[var(--color-surface-0)]/95 backdrop-blur-xl border border-[var(--color-surface-3)] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[var(--color-surface-3)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Focus Sounds</span>
                {anyPlaying && (
                  <button onClick={stopAll} className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors">
                    Stop all
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                {anyPlaying ? 'Mix multiple sounds together' : 'Click a sound to start — layer them for best effect'}
              </p>
            </div>
            <div className="p-3 space-y-1">
              {PRESETS.map((preset) => {
                const isActive = activeSounds.has(preset.id)
                const vol = volumes.get(preset.id) || 0.5
                return (
                  <div key={preset.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSound(preset)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all w-full ${
                        isActive
                          ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-secondary)]'
                      }`}
                      style={isActive ? { boxShadow: `inset 0 0 0 1.5px ${preset.color}40` } : {}}
                    >
                      <span style={{ color: isActive ? preset.color : undefined }}>{preset.icon}</span>
                      {preset.label}
                      {isActive && (
                        <span className="ml-auto flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-0.5 rounded-full"
                              style={{
                                height: 6 + i * 3,
                                backgroundColor: preset.color,
                                opacity: vol > (i + 1) * 0.3 ? 1 : 0.3,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </button>
                    {isActive && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={vol}
                        onChange={(e) => updateVolume(preset.id, parseFloat(e.target.value))}
                        className="w-16 h-1 accent-[var(--color-accent)] cursor-pointer"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
