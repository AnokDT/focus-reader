# PROJECT EYELOCK — Sprint 1: Research & Innovation

## The Question We're Actually Asking

> "What if we invented a new way for humans to read on screens?"

Not a PDF reader. Not a speed reader. A **reading experience** that makes the eyes want to stay, the mind want to absorb, and the body forget it's looking at glass.

---

# PART 1: RESEARCH SUMMARY

## 1.1 How Humans Actually Read

### Eye Movement Fundamentals

**Saccades** — The eyes don't glide smoothly. They jump. Every 200-300ms, the eyes make a ballistic movement called a saccade, landing on a word or group of letters. During a saccade, vision is essentially blind (saccadic suppression). Reading happens in the fixations between saccades.

**Fixations** — The eyes pause for 200-500ms on each fixation point. This is where comprehension happens. Average reader makes 4-5 fixations per line. Skilled readers make fewer, longer fixations.

**Regression** — Readers backtrack 10-15% of the time. This is normal, not a bug. It serves comprehension. Forcing linear reading causes anxiety.

**Perceptual Span** — The area of clear vision during fixation is only 1-2 degrees of visual angle (~7-15 characters left, 3-4 characters right for left-to-right languages). Everything beyond is peripheral blur.

**Optimal Viewing Position** — The best place to land on a word is slightly left of center (the "preferred viewing position"). This is where word recognition is fastest.

### The Eye-Brain Reading Loop

```
Fixation (200-500ms)
  -> Parallel letter recognition (20-70ms)
    -> Word identification (80-100ms)
      -> Semantic processing (150-200ms)
        -> Saccade planning (30-50ms)
          -> Saccade execution (20-50ms)
            -> Repeat
```

Total time per word: 200-400ms for comprehension. This is biological reality.

### What Causes Reading Fatigue

1. **Vergence-accommodation conflict** — Eyes focus on screen plane, but converge on virtual content distance. Mismatch causes strain.
2. **Blue light exposure** — Suppresses melatonin, affects circadian rhythm.
3. **Microsaccade drift** — On static screens, eyes drift during fixation, requiring constant micro-corrections.
4. **Cognitive overhead** — Tracking position, maintaining attention, managing regressions all consume mental resources.
5. **Low contrast** — Forces harder work from visual system.
6. **Poor typography** — Tight line spacing, narrow columns, wrong font all increase cognitive load.

### Peripheral Vision in Reading

- **Useful field of view (UFOV)**: ~5 degrees where words can be identified
- **Parafoveal preview**: Words 2-3 positions ahead are partially processed
- **Boundary effect**: When eyes cross an invisible boundary, parafoveal preview helps plan the next saccade
- **Implication**: What happens in peripheral vision matters enormously for reading fluency

## 1.2 Dyslexia Research

### Key Findings

- **Crowding effect**: Letters too close together are harder to distinguish
- **Visual stress**: Some readers experience pattern glare from high-contrast text
- **Colored overlays**: 20-30% of dyslexic readers benefit from tinted backgrounds
- **OpenDyslexic font**: Weighted bottoms reduce letter rotation confusion
- **Line length**: 60-70 characters per line optimal for dyslexic readers
- **Inter-letter spacing**: Increasing spacing by 20-30% improves reading speed

### What This Teaches Us

The "optimal" reading experience is not one-size-fits-all. There is genuine biological variation. Any reading system should adapt to the individual.

## 1.3 Typography Research

### The Science of Readable Type

| Factor | Optimal Range | Why |
|--------|---------------|-----|
| x-height | Medium-high | Larger x-height = faster recognition |
| Letter spacing | +5-10% default | Reduces crowding |
| Word spacing | 20-25% of em | Enough to separate words without breaking flow |
| Line height | 1.4-1.6x font size | Enough air for line tracking |
| Line length | 50-75 characters | Too long = lost tracking, too short = too many saccades |
| Serif vs Sans | No significant difference | For screen reading, sans-serif is slightly preferred |
| Font weight | Regular (400) | Light fonts cause strain; bold is for emphasis only |
| Justification | Left-aligned | Justified creates rivers of white space |

## 1.4 Speed Reading Science

### The Truth About Speed Reading

- **Average reading speed**: 200-300 WPM (adult, English, non-fiction)
- **Comprehension ceiling**: ~600 WPM before comprehension drops significantly
- **Spritz claim**: 1000+ WPM — possible for simple content, not for complex material
- **RSVP research**: 300-500 WPM is the sweet spot for comprehension retention
- **Chunking**: Reading 3-4 words at once is faster than single words

### RSVP Limitations (Current Research)

1. **Tachistoscopic presentation** (flashing words) causes "temporal crowding"
2. **No regression** — Can't reread difficult passages
3. **Pace mismatch** — Fixed WPM doesn't adapt to content complexity
4. **Loss of spatial layout** — User loses context of where they are
5. **Fixation point absence** — Nothing for the eyes to lock onto

### The Core Problem With RSVP

RSVP removes the spatial anchor that human vision evolved to use. The eyes evolved to fixate on stationary objects. Moving text forces the visual system into an unnatural mode.

## 1.5 Paper vs Digital Reading

### Research Findings

- **Comprehension**: Paper slightly better for long-form, complex text
- **Speed**: No significant difference for most readers
- **Navigation**: Paper users make more regressions (good for comprehension)
- **Metacognition**: Paper readers better at judging their own understanding
- **Fatigue**: Digital causes more fatigue at 60+ minutes
- **Memory**: Paper readers have better spatial memory of where information was

### Why Paper Feels Better

1. **Tactile feedback** — Physical page turning provides spatial anchoring
2. **Fixed layout** — No reflow, no unexpected changes
3. **Peripheral context** — Can see upcoming text, page edges, thickness
4. **No glare** — Matte surface, reflected light
5. **No emission** — Eyes not receiving direct light

## 1.6 Existing Patents and Technologies

### Spritz
- **Patent**: US9256342B2 — "Method and system for display of text for reading"
- **Innovation**: Single fixation point, words flash at optimal position
- **Problem**: No spatial context, regression impossible, fatigue at high speeds

### Bionic Reading
- **Patent**: WO2021165337A1 — "System and method for guided reading"
- **Innovation**: Bold fixation points (first few letters) guide the eye
- **Problem**: Only helps initial letter recognition, doesn't address movement

### BeeLine Reader
- **Innovation**: Color gradient across lines guides eye back to left margin
- **Problem**: Only addresses line tracking, not word tracking

---
