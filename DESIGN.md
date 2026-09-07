# Design

<!-- impeccable:design-schema 1 -->

## The world

**The Agit-Train.** Unbleached newsprint, soot-black stencil capitals, and revolutionary red rationed to a single wedge that drives into the composition carrying the action.

Chosen from the bolder register after two re-rolls, over an arcade marquee row (led by deal order, lost on tone) and a split-flap departure board (won product clarity, lost emotional range).

Why it holds for a fire-safety brand:

- **Red becomes a verb.** In this world red is not brand wallpaper — it is rationed to the wedge, and the wedge is always an action or an alarm. That is precisely how red should behave on a site about fire, where a page painted red has nothing left to say when something is actually wrong.
- **Stencil is native.** Stencilled capitals are already on every cylinder, cabinet, crate and bay marking in this product's world. Nothing is being imported.
- **The original job matches.** The agit-train existed to inform and mobilise people who did not yet know what they needed to know. That is the job of teaching a buyer the difference between a Class B and a Class K fire.
- **It survives having no photographs.** Cut-out photomontage, stencil, rule and wedge compose a complete page with zero product imagery, and absorb real photography later without redesign.

**Binding constraint from the client:** the page architecture is held to https://jbayurveda.in/ section for section. The world supplies surface, type, colour and motion. It does not get to reorganise the site. Where this document and the reference structure disagree, the reference structure wins.

## Palette

Light is the default. The use scene decides it: a facilities manager comparing specifications at a desk in daylight, not a designer in a dark room.

```
Light — newsprint
--ground          #EDE6D6   unbleached newsprint, the page
--ground-raised   #F7F3E9   cards, panels, raised stock
--ground-sunk     #E2D9C5   wells, table stripes, inset
--ink             #14120F   soot black, all body and display
--ink-muted       #5C574D   secondary text, tinted from the ground, never grey
--ink-faint       #8A8271   tertiary, captions, disabled
--rule            #14120F @ 18%
--wedge           #CE2A15   RATIONED. Actions and alarms only.
--wedge-deep      #A61F0E   wedge pressed state

Dark — soot
--ground          #14120F
--ground-raised   #1E1B17
--ground-sunk     #0C0B09
--ink             #EDE6D6
--ink-muted       #A79E8C
--ink-faint       #7A7264
--rule            #EDE6D6 @ 16%
--wedge           #E8462C   lifted for the dark ground
--wedge-deep      #FF5C40
```

**The rationing rule, which is the whole world:** red appears only on (1) the primary action of a view, (2) a genuine alarm or prohibition state, (3) the moving wedge. Never on decoration, never on a heading, never on a hover that is not an action, never on more than one element in a viewport without a reason you could defend out loud. A second red on screen must earn its place by being a second action.

## Type

Self-hosted through `next/font/google`, subset and preloaded. No system display face.

- **Display — Anton.** Heavy condensed wood-type grotesque for hero words, section heads and wedge labels. Always uppercase, tracking `-0.02em` at display sizes. Hero stacks one word per line at `clamp(3.5rem, 11vw, 9rem)`.
- **Text — Archivo (variable 100–900).** Body, UI, labels, and all specification data. Tabular figures (`font-variant-numeric: tabular-nums`) are on by default for every price, capacity, pressure and quantity, so columns of numbers align and a value change does not reflow the row.
- **No monospace as a costume.** Archivo's tabular figures carry the technical register; a mono face would be decoration.

Measure holds at 65–75ch for prose. Display caps at 9rem.

## Composition

- **The diagonal of travel.** Sections lean on one consistent angle, `-4deg` — wedges, the marquee band, section transitions. One angle for the whole site; a second angle would be noise.
- **The wedge.** Primary actions are clip-path wedges that drive in from the left. The wedge is the only shape allowed to break a grid edge.
- **Rules over boxes.** Structure comes from hairline rules and stencil labels, not from stacked cards. Where the reference uses a card, keep the card — but build it from rule and ground, never from shadow.
- **Cars.** Each home section bands like a railcar: a stencilled section label at the head, its content, a rule at the foot.

## Motion

One authored moment, from the world: **the wedge drives.** It enters from the left on an exponential ease-out and stops hard. Everything else is quiet — the marquee's steady travel, and a `120ms` state change on controls.

- One shared motion clock. Every timed element reads the same base duration so nothing beats independently.
- Anything being read holds perfectly still. No drifting backgrounds behind text.
- Continuous runs — rules, marquee bands, the wedge — go edge to edge unbroken. A deliberate break is a ranked joint, never an accident of layout.
- `prefers-reduced-motion` stops the marquee and lands the wedge at rest.

## Signature components

- **Class panel row.** `A B C D K` as lettered cells. Covered cells are ink-filled; prohibited cells carry a struck rule and read "do not use on"; unstated cells stay empty. Never colour alone — every state carries a letter and a label.
- **Pending image.** No product photography exists until the client uploads it. A product without an image renders a stencilled newsprint panel carrying its class row and SKU, whole-unit and deliberate. It reads as awaiting its photograph, never as a broken box. This is the launch condition, so it is designed, not defaulted.
- **Spec field.** Class, capacity, medium, IS number and price ride on the card face as a dense designed field. Nothing critical hides behind an accordion.
- **Live-electrical mark.** A separate stamped mark, because "safe on energised equipment" is not a fire class and must not be shown as one.

## Browser surfaces

Selection is wedge-red on cream with ink text. Caret is wedge. Scrollbars are ground-sunk with an ink-faint thumb, no rounding. Focus rings are a 2px wedge outline at 2px offset, visible on both themes. Underline offset `0.18em`, thickness `1.5px`.

## Non-negotiable

- Fire class never depends on colour. Letter and label always.
- Certification is product data on the card, not fine print.
- Both themes hold 4.5:1 for body and placeholder text.
- No invented certification numbers, test results, customers or approvals.

## Scroll choreography

The world's own grammar reads *"content advances car by car along one strong
axis of travel"* and *"scroll advances the train."* The scroll layer is not
section reveals dressed up. It is that sentence, implemented.

- **Focal — the train travels.** The collections rail pins at `lg` and above,
  and vertical scroll drives the cars laterally across the viewport. Below
  `lg` it stays the native scroll-snap rail: pinning a phone is a usability
  tax, not a feature.
- **Continuity — the car arrives.** A section's leading rule *draws* edge to
  edge from its origin, and the head follows just behind it. The rule is what
  moves; the content trails it. This is "continuous runs go edge to edge
  unbroken" turned into motion, not a fade-and-rise with a new name.
- **Interactive — depth is state.** The five fire-class cells bring one
  forward on pointer or focus while the others recede. Rank is depth, and the
  frontmost outranks the rest.
- **The band answers the reader.** The marquee reverses with scroll direction,
  so the train is driven rather than idling.

Every pre-animation state lives behind `html.fx-motion`, a class only added
once script confirms motion is wanted. A failed script, an old browser, or
`prefers-reduced-motion` therefore renders the page complete and still —
nothing is ever hidden waiting for JavaScript that may not arrive.
