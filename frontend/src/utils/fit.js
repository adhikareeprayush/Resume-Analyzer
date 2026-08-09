/** Single source of truth for how a model verdict maps onto the palette. */
const FIT_TONES = { 'Good Fit': 'ok', 'Potential Fit': 'warn', 'No Fit': 'neutral' }

export const FIT_TEXT_ON_DARK = {
  ok: 'text-ok-hot',
  warn: 'text-warn-hot',
  neutral: 'text-paper/50'
}

export function fitTone(label) {
  return FIT_TONES[label] || 'neutral'
}
