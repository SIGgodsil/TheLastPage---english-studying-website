# Design system

The look of The Last Page: a printed literary magazine on warm paper. Built with the `web-design-studio` skill (Mode A, Design Library). The project's own tokens win over any reference (see "Sources").

## Sources

| Decision | Source |
|---|---|
| Colours: paper `#F7F3EA`, ink `#2B2420`, wine `#8B2E2E` | `CLAUDE.md` (project tokens) |
| One typeface: Times New Roman everywhere | The user (2026-11-26), replacing Lora + Inter |
| Hierarchy from type: large regular-weight titles, small tracked capitals for labels | WIRED (`design-library/wired.md`) |
| Soft shapes: pill buttons, softly rounded cards, a faint warm shadow; warm paper canvas, long vertical rests, one accent moment per view | Oura (`design-library/oura.md`) |
| Not boxy or rigid: no heavy rules or square frames | The user (2026-11-26), after the first pass used WIRED's square corners |
| Calm, kind tone; no harsh error states | `CLAUDE.md` |

## Typeface

- `--font-times`: `"Times New Roman", Times, Tinos, "Liberation Serif", serif`. Both `font-serif` and `font-sans` point to it.
- Tinos (Google Fonts, metric-compatible with Times New Roman, has Vietnamese) is loaded with `next/font` and **not preloaded**: only devices without Times New Roman (Android) download it.
- Root size 17 px, because Times New Roman has a small x-height.
- Weights: 400 and 700 only (the face has no 500/600). Titles stay at 400, as in a magazine. Bold is for labels, buttons and status.
- Italic carries the second voice: Vietnamese titles, taglines, hints.

## Tokens and utilities (`app/globals.css`)

| Name | Use |
|---|---|
| `paper`, `card` | Page and raised surfaces |
| `ink`, `muted` | Text, secondary text (muted `#6E645B`, contrast 5.2:1 on paper) |
| `wine`, `wine-deep` | The accent: primary actions, active status, section labels. `wine-deep` is its hover |
| `line` | Hairline rules and dividers |
| `eyebrow` | 0.7 rem bold capitals, 0.14 em tracking: section labels and metadata |
| `btn-primary` | Wine pill, at least 44 px tall: the one decisive action of a view |
| `btn-secondary` | Ink-outline pill that fills with ink on hover: quieter actions |
| `shadow-paper` | A faint, warm two-layer shadow for cards on the paper |

## Rules

- **One accent moment per view.** Wine fills only the main action; elsewhere it is text-only (labels, status).
- **Soft, not boxy.** Buttons are pills (`rounded-full`); cards are `rounded-2xl`, large bands `rounded-3xl`. No heavy rules or square frames: a short hairline with a dot is the only ornament.
- **Depth is quiet.** A `border-line` hairline on cards, `shadow-paper` on hover or on the one featured card. Never a hard or dark shadow.
- **Lists:** each story is a soft card with its metadata in an eyebrow above the title.
- **Motion:** colour and transform only, 150 ms; everything is cut short under `prefers-reduced-motion`.
- **Focus:** a 2 px wine outline on `:focus-visible`, everywhere.
