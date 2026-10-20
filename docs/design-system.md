# Design system

Direction: "Kitchen notebook". Warm paper background, ink-black outlines with hard offset
shadows (like a sticker or notebook cutout), spice colors for status, one handwritten
accent for human notes. Not a generic SaaS look: no purple gradients, no soft blurry shadows,
no default grey cards.

Visual reference: the design canvas "RecipeForge - Kitchen Notebook UI" (screens: Matches,
Pantry, Cook mode). Mobile-first, 390 px wide; desktop = the same layout centered with max-width.

## Colors
| Token | Hex | Use |
|---|---|---|
| paper | #F6EFE2 | page background |
| card | #FFFBF2 | cards, inputs, bottom nav |
| ink | #2B2118 | text, outlines, shadows, primary buttons |
| ink-soft | #5A4A3A | secondary text |
| paprika | #B83A22 | handwritten accents, "expires today", current progress, running timer |
| turmeric | #E0A526 | match-percent badge, "expiring soon" banner (#F3D27A for pills) |
| olive | #3E4A24 on #E3E8D3 | "fresh", diet tags |
| expired | #6B2A1D on #E6D9C8 | expired items |

All text pairs must keep contrast of at least 4.5:1.

## Typography
- Display / headings: Fraunces (700-800)
- Handwritten accent (short notes only, max one per screen): Caveat 600
- Body / UI: Inter (400-600), 13-15 px body, 11 px for legal notes

## Shape and spacing
- Card: 1.5 px ink border, radius 14, hard shadow 3px 3px 0 ink
- Chips and buttons: radius 99, 1.5 px ink border, min height 44 px
- Page padding 18 px, gap between cards 8-14 px

## Components
- Recipe card: title (Fraunces 20), explanation line ("92% available, missing 1 item ≈ 400 ₸, uses milk expiring tomorrow"), tags, round match badge with percent.
- Pantry row: name, quantity, expiry pill (fresh / expiring in N days / expires today / expired · discard).
- Banner: turmeric, one line, whole banner is a button.
- Cook mode: progress segments, one step per screen in Fraunces 30, ingredient checkboxes for the step, parallel timer cards, Back / Next step.
- Bottom nav: Pantry, Matches, Shopping, Profile; current item inverted (ink background).
- Persistent notes (always visible): filters do not replace label checks for allergies; dates are user estimates and the app never says an item is safe.
- Empty, loading and error states use the same card style and one handwritten line.

## Rules
- Real buttons, links and labelled inputs; icon-only buttons need aria-label.
- No emoji as icons. Prices always in ₸ with "approx." where estimated.
