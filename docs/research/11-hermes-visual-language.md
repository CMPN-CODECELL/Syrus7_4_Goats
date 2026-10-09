# 11. Hermes Agent site: visual language spec

Source: https://hermes-agent.nousresearch.com/ (captured 2026-10-09, built-in browser). Tags: (m) = getComputedStyle measurement; (css) = stylesheet or CSS variable; (i) = inferred. Desktop values at 1280 px, mobile at 375 px. Light and dark schemes render identically (checked). Screenshot limit: the Browser pane shrinks emulated desktop viewports to a ~230 px thumbnail, so desktop shots show layout only; mobile shots (368-375 px) are legible, and detail comes from computed styles.

## 1. Overall aesthetic

- **One loud colour field.** Full-bleed blue `#0000F2` with `#F2F2F2` type, alternating with `#F2F2F2` paper bands carrying `#000091` text. Two bands, no page gradients.
- **Poster typography.** Uppercase condensed display (hero weight 200, tracking -0.02em, line-height 1.0) over a neo-grotesk body. Section heads are sentence case at 80 px.
- **Terminal as a second voice.** 10-11 px mono uppercase eyebrows ("#1 CONNECT"), a dark-blue terminal panel with OS tabs and a copy button.
- **Engraved art, not photos.** Blue duotone halftone and line engravings, blended with `lighten` or `plus-lighter`, under an SVG grain layer.
- **Square and quiet.** Zero-radius buttons and cards, dotted 0.8 px rules instead of shadows, 150 ms colour transitions, scroll-linked fades and parallax. A 5 px inset viewport frame (desktop only) is the signature edge.

## 2. Exact tokens

### 2a. Colours

| Hermes token | Hex | Used for |
|---|---|---|
| field (`--hermes-color-blue`) | #0000F2 | body, hero, downloads, footer 2; blue text on paper (m) |
| paper / text (`--hermes-white`) | #F2F2F2 | text on blue; paper bands: features, FAQ, plans, footer 1 (m) |
| deep blue (`--hermes-blue-dark-40`) | #000091 | paper-band text and headings; terminal panel (m) |
| html canvas | #0000C2 | area outside the page edge (m) |
| viewport frame (`.hw-frame`) | ~#3333F2, 4.8 px | fixed inset border, hidden under 768 px (m) |
| primary button fill | #FFFFFF at 98% | hero and header CTA, blue text (m) |
| secondary button fill | #F2F2F2 at 20% | "Deploy to the cloud" (m) |
| shadow ink / selection / status | #000061 at 8-18% / #F2F200 / #8CC4A7, #DDBA7D, #F0949E | shadows; selection; success, warning, error (css) |

### 2b. Fonts

| Role | Family as loaded (m) | Source | Free stand-in |
|---|---|---|---|
| H1, H2, H3, prices | Rules Gothic Condensed 200/300/400; Rules Gothic Compressed 500 | self-hosted `/font/Rules/*.woff2` (commercial) | Barlow Condensed 200 / 400; Saira Extra Condensed 500 |
| Body, chips | Rules Variable 100-900 | `/font/Rules/RulesVariable.woff2` | Hanken Grotesk 400 / 500 |
| Nav, buttons, footer lists | Rules Condensed 400 / 500 | `/font/Rules/` | Barlow Condensed 500, uppercase |
| Eyebrows, code | Aeonik Fono Pro TRIAL 400 | `/font/AeonikFonoProTRIAL/*.woff2` (trial licence) | Geist Mono 400 |

### 2c. Type scale (m)

| Role | Desktop / mobile | Weight | Line-height | Tracking | Case |
|---|---|---|---|---|---|
| H1 hero | 105 px / 64 px | 200 | 1.0 | -0.02em | UPPER |
| H2 section | 80 px / 80 px | 400 | 1.0 | -0.02em | Sentence |
| H3 feature, price | 46 px (css 3.6vw, max 48) | 500 | 1.1 | 0 | Sentence |
| FAQ question | 32 px (css var, not measured) | light (i) | ~1.2 | 0 | Sentence |
| Body | 16 px | 400 | 1.6 | 0 | Sentence |
| Button | 14 px | 500 | 1.33 | 0 hero; 0.1em generic | UPPER |
| Nav link | 12 px | 400 | 1.0 | 0.1em | UPPER |
| Eyebrow, code | 10-11 px mono | 400 | 1.5 | 0.1em eyebrow | UPPER / as typed |

### 2d. Spacing and layout

- Unit `.25rem`; steps 4, 8, 12-16, 24, 32, 48, 64, 96 px (css). Content column 1080 px (css); gutter `max(24px, min(6vw, 80px))`; page max 1440 px.
- Section padding (m): hero 80 px (48 under 768); features 180 px top, 80 px bottom (80 / 48 mobile); FAQ and plans 60 px (48 mobile). Header 114 px. Gaps: hero 30 px; feature grid 80 px row, 40 px column.

### 2e. Borders, radii, shadows, textures

- **Radius and rules:** 0 on buttons, cards, inputs and FAQ rows; terminal 6 px; plan chips right-rounded (1.75 px). Rules: 0.8 px dotted blue between FAQ items, 0.8 px solid chips, 1 px header rule on scroll, 0.5 px hairlines (m).
- **Shadows:** rare, ink-tinted. Lift `0 2px 8px 0 rgb(0 0 97 / .08)`; popout `0 4px 40px 0 rgb(0 0 97 / .18)`. No glows.
- **Grain (css, exact):** SVG `feTurbulence` (fractalNoise, baseFrequency 0.72, 4 octaves, white speckle matrix), tile 179.2 px, opacity .9, on a container with `mix-blend-mode: plus-lighter`. Page backgrounds carry no image or gradient (m).

```css
.grain { position: relative; isolation: isolate; mix-blend-mode: plus-lighter; }
.grain::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .9; background-size: 179.2px;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 1 1 0 -1.55'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
```

## 3. Components

Snippets use the Option B tokens from section 6.

**Nav.** Recipe: `flex items-center justify-between px-6 pt-10 pb-5 md:px-[clamp(24px,6vw,80px)]`; two-line wordmark `font-display uppercase leading-[.9] text-cream`; small solid CTA and a two-bar menu icon right. A hidden second nav sits at top -100 px, which suggests a compact bar slides in on scroll (i, not verified).

**Primary button (m: 36 px high, 10 px padding, 16 px icon, 8 px gap).** Secondary: `bg-cream/20 text-cream hover:bg-cream/30`, same metrics.

```html
<a class="inline-flex h-9 items-center gap-2 bg-peach px-2.5 font-display text-sm font-medium uppercase text-ink rounded-none
  transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-cream active:scale-[0.98]
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream">Run optimisation</a>
```

**Hover arc border (m).** A 1.25 px ring with a 160 degree gradient that circles the button. Runs only with `(hover:hover) and (prefers-reduced-motion: no-preference)`.

```css
.btn-arc { position: relative; isolation: isolate; }
.btn-arc > .arc { position: absolute; inset: 0; padding: 1.25px; overflow: hidden; opacity: 0; pointer-events: none;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); mask-composite: exclude; }
.btn-arc > .arc::before { content: ""; position: absolute; top: 0; left: 0; width: 300%; height: 300%;
  background: linear-gradient(160deg, transparent 0 15%, currentColor 20%, transparent 35% 55%, currentColor 60%, transparent 75% 95%, currentColor 100%); }
.btn-arc:hover > .arc { opacity: 1; }
@media (hover: hover) and (prefers-reduced-motion: no-preference) { .btn-arc:hover > .arc::before { animation: arc 2.23s linear infinite; } } @keyframes arc { from { transform: translate(-10%, -10%); } to { transform: translate(-50%, -50%); } }
```

**Terminal block (m).** Recipe: `rounded-[6px] bg-ink-deep p-1` outer; top row `flex gap-3 px-3 py-2 font-mono text-[11px] uppercase` holds OS tabs as `underline underline-offset-4` labels with colon separators; command row `font-mono text-[11px] leading-[16.5px] text-cream` plus a copy icon.

**FAQ list.** Dotted rules, large condensed question, "+" on the right: `<details class="border-b border-dotted border-line py-4">` with `summary` in `font-display text-[32px] font-light`.

**Links, dividers, headers.** Text links underline with a 4 px offset (`underline underline-offset-4 decoration-1 hover:text-peach`); footer links underline on hover (m, colour shift not measured). Dividers: 1 px solid `border-line`, 0.8 px dotted in lists. Panels: none on the field; columns separate by space, art or hairlines; data panels use `border border-line bg-panel rounded-none p-5`. Section header: eyebrow `font-mono text-[10px] uppercase tracking-[0.1em] text-peach`, then H2 `font-display text-[80px] leading-none tracking-[-0.02em]`.

## 4. Layout patterns

- **Band rhythm.** Field and paper bands alternate; the page ends on a field band with a large art bleed. Whitespace (180 px before features) and display type carry the rhythm. Nothing sits in a sidebar.
- **Two-up hero.** 1fr / 1fr (525 px each at 1280, gap 30 px). Copy left; art right, absolutely centred at 631 x 793 px, bleeding past its column, `mix-blend-mode: lighten`.
- **Three-up features and split portal.** 333 px columns (m), each eyebrow, H3, body, then a framed art box offset up to about 135 px for asymmetry. The portal splits text left and tall art right (575 x 844 px) with a negative top offset.

## 5. Motion (m unless noted)

| Element | Trigger | Timing | Notes |
|---|---|---|---|
| Buttons | hover, active | 150 ms cubic-bezier(0,0,.2,1) | active scale .98 |
| Hover arc | hover | 2.23 s linear infinite | translate -10% to -50% |
| Hero copy | scroll | opacity 1 to .3; blur 0 to 10 px | scroll-linked variable |
| Feature and portal art | scroll | parallax, clamped ±64 px | css |
| Entrance | mount | fade .5 s; slide-up .6 s (6 px) | ease-out, fill both |
| Cursor blink | group hover | 1 s step-end infinite | keyframe `blink` |
| Ornaments | where applied (i) | spin 12 s linear; march .5 rem | `spin-slow`, `march` |

- No typewriter effect: no typing keyframe exists in the stylesheets, and terminal text is static. Route changes crossfade over .22 s (View Transitions). Zero animations run at idle. Reduced motion turns off parallax, hero fade, footer blur, the arc and view transitions.

## 6. Mapping to our app (Option B tokens)

```css
@import "tailwindcss";
@theme {
  --color-ink: #161e2f; --color-ink-deep: #0d121c; /* ink x 0.6, derived */
  --color-panel: #242f49; --color-line: #384358; --color-cream: #f4efea;
  --color-peach: #ffa586; --color-wine: #541a2e; --color-red: #b51a2b;
  --font-display: "Barlow Condensed", sans-serif; --font-sans: "Hanken Grotesk", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --animate-blink: blink 1s step-end infinite; @keyframes blink { 50% { opacity: 0; } }
}
```

- **Header and tabs (Optimise / Evidence / Method).** Header `flex justify-between px-6 pt-8 pb-5 md:px-[clamp(24px,6vw,80px)]`. Wordmark `font-display text-2xl uppercase leading-[.9] text-cream`. Tabs `role="tab"` in `font-display text-xs uppercase tracking-[0.1em] text-cream/70`; active `aria-selected:text-cream aria-selected:underline decoration-peach decoration-2 underline-offset-[6px]`.
- **Input rail.** Sticky 320 px aside (the site's sidebar token), `bg-ink border-r border-line`. Stock rows `border-b border-dotted border-line py-2.5`; checkboxes `size-4 appearance-none border border-cream/60 checked:bg-peach`; sliders `accent-peach`; numbers `font-mono tabular-nums text-right bg-transparent border-b border-line focus:border-peach`.
- **Run button and log.** Run: `h-11 w-full bg-peach text-ink font-display uppercase` with the arc border; `aria-busy` disables it. Log: `<pre class="h-48 overflow-auto rounded-[6px] bg-ink-deep p-3 font-mono text-[11px] leading-[16.5px] text-cream/80">`, timestamps `text-peach`, caret `<span class="inline-block w-[0.6ch] bg-peach animate-blink">&nbsp;</span>`.
- **Metric cards.** `grid grid-cols-2 gap-px border border-line bg-line xl:grid-cols-4`; cells `bg-ink p-5`; label `font-mono text-[10px] uppercase tracking-[0.1em] text-cream/70`; value `font-display text-[48px] font-light leading-none tabular-nums text-cream`.
- **Data tables (SolverTable).** Header mono 10 px uppercase, `border-b border-line`. Rows `border-b border-dotted border-line py-3 hover:bg-panel`, numbers mono tabular. Selected row `bg-panel border-l-2 border-peach`.
- **Recharts.** Height 360 px (site chart token). Series: peach `#FFA586` (primary), cream `#F4EFEA` (secondary), slate `#7C8AA8` (derived third). Red marks violations only, never text. Bars (BitstringHistogram): `radius={0}`, peach at 85%, selected cream.

```tsx
const tick = { fill: "#f4efea", fillOpacity: 0.7, fontFamily: "Geist Mono", fontSize: 11 };
<ResponsiveContainer width="100%" height={360}>
  <LineChart data={rows} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
    <CartesianGrid stroke="#384358" strokeDasharray="2 4" vertical={false} />
    <XAxis dataKey="x" axisLine={{ stroke: "#384358" }} tickLine={false} tick={tick} />
    <YAxis axisLine={false} tickLine={false} tick={tick} />
    <Tooltip cursor={{ stroke: "#ffa586" }} contentStyle={{ background: "#242f49", border: "1px solid #384358", borderRadius: 0, fontFamily: "Geist Mono", fontSize: 11, color: "#f4efea" }} />
    <Line type="monotone" dataKey="y" stroke="#ffa586" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#ffa586", stroke: "#161e2f" }} />
  </LineChart>
</ResponsiveContainer>
```

- **Honesty / verdict panel.** `border border-line border-t-2 border-t-peach bg-panel p-6`. Eyebrow mono peach; verdict `font-display text-[32px] font-light text-cream`; check rows `border-b border-dotted border-line`. Pass chip: `inline-flex h-[18px] items-center rounded-r-[2px] border-[0.8px] border-peach px-1.5 font-mono text-[10px] uppercase text-peach` (copies the plan chip). Fail chip: same with `bg-red text-cream`.

## 7. Palette decision

**Option A: Hermes look with Hermes colours** (WCAG 2.x ratios). Field `#0000F2`, paper `#F2F2F2`, deep blue `#000091`, accent `#F2F200`.

| Pair | Ratio | Use |
|---|---|---|
| #F2F2F2 on #0000F2 | 8.2:1 | body, H1 (AAA) |
| #000091 on #F2F2F2 | 13.5:1 | paper-band text (AAA) |
| #F2F2F2 on #000091 | 13.5:1 | terminal text (AAA) |
| #0000F2 on #FFFFFF | 9.2:1 (8.8 on the 98% fill) | primary button (AAA) |
| #F2F2F2 on #3030F2 | 6.6:1 | secondary button (AA) |
| #F2F200 on #0000F2 | 7.7:1 | selection, focus (AAA) |
| #F2F2F2 at 60% on #0000F2 | 3.3:1 | large text only |

**Option B: Hermes layout and typography with Sunset Navy colours.** Field ink `#161E2F`, panel `#242F49`, line `#384358`, peach `#FFA586`, red `#B51A2B`, wine `#541A2E`, cream `#F4EFEA`.

| Pair | Ratio | Use |
|---|---|---|
| #F4EFEA on #161E2F | 14.6:1 | body (AAA) |
| #F4EFEA on #242F49 | 11.6:1 | panel text (AAA) |
| #161E2F on #FFA586 | 8.7:1 | primary button text (AAA) |
| #FFA586 on #161E2F | 8.7:1 | accent text, links (AAA) |
| #FFA586 on #242F49 | 7.0:1 | accent text on panels (AAA) |
| #F4EFEA at 70% on #161E2F | 7.7:1 | muted text (AAA) |
| #541A2E on #F4EFEA | 11.8:1 | paper-band text (AAA) |
| #F4EFEA on #B51A2B | 5.8:1 | error button, chip (AA) |
| #B51A2B on #161E2F | 2.5:1 | decorative only, never text |

Peach on cream is 1.7:1. On paper bands use ink or wine for text, and peach only as a fill with ink text.

**Recommendation: Option B.** Every text pair is AAA. Option A also passes, but the saturated `#0000F2` field is the Hermes identity, and the team already chose Sunset Navy. B keeps the Hermes structure and type on our palette.

## 8. Licensing note

- **Fonts.** The Rules family and Aeonik Fono Pro TRIAL are commercial and self-hosted by the site. The Aeonik file is a trial build. Do not download, copy or ship either; use the stand-ins in 2b. Confirm the licences of Barlow, Hanken Grotesk and Geist Mono before use (believed SIL OFL).
- **Logo, art and copy.** Do not copy the wordmark, the wing mark (`hermes-wing.svg`), the Nous logo, favicons, the hero, feature, portal or footer art, the Hermes name, or site copy. Make our own halftone art and labels.
- **Software licence and generic ideas.** The footer says MIT for the Hermes Agent software, which does not clearly cover the site's fonts, images or wordmark: treat those as all rights reserved. Layout, colour roles and effects (grain, duotone, 1080 px column, hover arc) are generic and may be reused with our own assets.

## 9. Sources and method

- Site: https://hermes-agent.nousresearch.com/ (title "Hermes Agent: Open-Source AI Agent That Grows With You | Nous Research").
- Stylesheets read via CSSOM: `/_next/static/chunks/0ra9kfpcjnxic.css`, `08r4seld28gkz.css`, `00qqun8ycjaz7.css`. Fonts from `document.fonts` and preload links.
- Method: `getComputedStyle` on body, headings, nav, buttons, terminal, FAQ and plan elements at 1280 and 375 px; all `--*` variables on `:root`; `@keyframes` and media-query walk; `getAnimations()` at idle; `read_page` and `get_page_text` for structure.
- Not verified: text-link hover colours; the fixed full-viewport canvas (z 101, pointer-events none), likely decorative; the compact sticky nav; the FAQ question size (from a CSS variable).
