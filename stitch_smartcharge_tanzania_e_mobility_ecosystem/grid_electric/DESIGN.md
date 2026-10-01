---
name: Grid Electric
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4b'
  surface-container-lowest: '#010f1e'
  surface-container-low: '#0d1d2c'
  surface-container: '#122130'
  surface-container-high: '#1c2b3b'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#b9ccb5'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233242'
  outline: '#849581'
  outline-variant: '#3b4b3a'
  surface-tint: '#00e55b'
  primary: '#edffe8'
  on-primary: '#003911'
  primary-container: '#00ff66'
  on-primary-container: '#007128'
  inverse-primary: '#006e27'
  secondary: '#bdc6e0'
  on-secondary: '#273045'
  secondary-container: '#40495e'
  on-secondary-container: '#afb8d2'
  tertiary: '#f0fcff'
  on-tertiary: '#00363d'
  tertiary-container: '#85edff'
  on-tertiary-container: '#006c79'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff83'
  primary-fixed-dim: '#00e55b'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531b'
  secondary-fixed: '#d9e2fd'
  secondary-fixed-dim: '#bdc6e0'
  on-secondary-fixed: '#121b2f'
  on-secondary-fixed-variant: '#3d475c'
  tertiary-fixed: '#9cf0ff'
  tertiary-fixed-dim: '#00daf3'
  on-tertiary-fixed: '#001f24'
  on-tertiary-fixed-variant: '#004f58'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  telemetry-display:
    fontFamily: JetBrains Mono
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  gutter-desktop: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
  space-2xl: 2.5rem
---

## Brand & Style

This design system delivers a high-precision, mission-critical utility interface engineered for commercial EV charging infrastructure, sub-station metering, and high-uptime energy grids in East Africa. The aesthetic merges industrial utility reliability with contemporary digital energy telemetry: crisp, high-density layouts, low visual drag, and high-readability data visualizations under bright equatorial daylight and low-light control rooms alike.

### Personality & Emotional Tenor
- **Operational Authority:** Unflinching, real-time precision that field engineers, fleet operators, and commercial hub managers can trust instinctively.
- **Electric Momentum:** Kinetic, vibrant energy accents against structural dark tones that signify continuous power flow and active telemetry.
- **Utilitarian Elegance:** No superfluous ornament. Every pixel, badge, and hairline border conveys status, load balancing, tariff tracking, or operational health.

### Design Movement
- **Modern Industrial Technical / Data-Dense Utility:** Grounded by dense structural grids, subtle high-precision container borders, monospaced numerical telemetry, and tactile high-contrast interactive states.

## Colors

The palette leverages a deep marine substrate punctuated by ionized energy greens and cyan telemetry highlights. It is tuned specifically for sustained monitoring shifts and clear outdoor visibility on field diagnostics hardware.

### Roles & System Allocation
- **Primary (`#00FF66` - Ion Green):** The lifeblood of the interface. Reserved strictly for active power distribution, online charger connectivity, successful validation states, active kilowatts, and primary user confirmations.
- **Secondary (`#0B1528` - Deep Marine Navy):** The structural core canvas and surface baseline. It anchors the viewport, absorbs glare, and eliminates the fatigue associated with stark neutral black `#000000`.
- **Tertiary (`#00E5FF` - Telemetry Cyan):** Auxiliary data streams, real-time load telemetry, billing rate metrics, phase balance diagnostics, and navigational focus anchors.
- **Neutral (`#8A99AD` - Slate Wire):** Secondary typography, structural divider lines, inactive port markers, units of measurement, and unselected component outlines.
- **Functional Warnings & Critical States:**
  - **Grid Alert (`#FF3B30`):** Phase failure, emergency shutoff, port fault.
  - **Thermal/Throttled (`#FFB800`):** Peak tariff warning, thermal limit proximity, delayed queue.
- **Surface Elevation Hierarchy:**
  - `surface-canvas`: `#060C17` (Deepest base ground)
  - `surface-card`: `#0F1D36` (Primary component container)
  - `surface-elevated`: `#162644` (Modals, drop menus, interactive focus)

## Typography

The typographic system utilizes a deliberate tri-font architecture to cleanly separate spatial architectural titles, intuitive reading copy, and precise mechanical telemetry.

### Font Roles
- **Headlines (`Space Grotesk`):** Structural, geometric, and forward-looking. Provides hard-edged clarity for site headers, diagnostic screens, and major metric categories without feeling decorative.
- **Body (`Hanken Grotesk`):** Modern, sharp, and highly legible across compact screen footprints. Applied across status logs, error explanations, user account settings, and general narrative documentation.
- **Labels & Telemetry (`JetBrains Mono`):** Non-negotiable for live telemetry, kilowatt readings, voltage metrics, Shilling/USD pricing tables, transaction receipts, time durations, and system states. Fixed-width numerals prevent tabular layout shift during live sub-second polling updates.

### Formatting Rules
- All `label-*` tokens must be set in uppercase with positive letter spacing to maintain visual authority at compact sizes.
- Real-time numerical data must always pair the `JetBrains Mono` metric with a muted `Hanken Grotesk` or `JetBrains Mono` unit label (e.g., `480.2` **kW**, `6,850` **TZS**).

## Layout & Spacing

This design system uses a flexible, high-density fluid grid system configured to display multi-station telemetry without excessive vertical scroll. 

### Grid Layout Architecture
- **Desktop (1200px+):** 12-column grid, `gutter-desktop: 1.5rem`, `margin-desktop: 2.5rem`. Max container constraint of `1440px`. Accommodates side-by-side geographic GIS maps alongside simultaneous fast-charger telemetry banks.
- **Tablet (768px – 1199px):** 8-column grid, `gutter: 1rem`, `margin: 1.5rem`. Telemetry streams compress into 2x2 modular matrix patterns.
- **Mobile (320px – 767px):** 4-column grid, `gutter-mobile: 0.75rem`, `margin-mobile: 1rem`. Critical dispenser status cards stack into unified edge-to-edge compact blocks.

### Spacing Philosophy
- Base layout rhythm works on a compact `4px` coordinate unit to maintain data density.
- Component internal paddings are compressed using `space-xs` and `space-sm` for chips, badges, and readouts, maximizing visible screen real estate on rugged handheld field tablets and multi-dispenser driver kiosks.

## Elevation & Depth

This system intentionally departs from heavy physical drop shadows, adopting an illuminated industrial depth model driven by **Tonal Layering**, **Crisp Hairline Boundaries**, and **Energy Backlights**.

### Depth Layers
- **Ground 0 (Canvas):** Pure darkened background (`#060C17`) serving as the light sink.
- **Ground 1 (Cards & Data Cells):** Surface navy (`#0F1D36`) framed by a 1px border of `rgba(138, 153, 173, 0.15)`. No ambient shadow.
- **Ground 2 (Overlays & Flyouts):** Surface elevated (`#162644`) with a 1px border of `rgba(0, 229, 255, 0.3)` and an ultra-subtle ambient glow: `0 8px 24px -4px rgba(0, 0, 0, 0.6)`.

### Energy Signatures
When an EV charging dispenser is actively pumping power or an alert is active:
- **Active State:** Replace standard borders with a 1px solid `#00FF66` stroke accompanied by a directional inner boundary glow: `box-shadow: inset 0 0 12px rgba(0, 255, 102, 0.15), 0 0 8px rgba(0, 255, 102, 0.2)`.
- **Fault State:** Crisp 1px `#FF3B30` border coupled with a crisp perimeter highlight: `0 0 12px rgba(255, 59, 48, 0.25)`.

## Shapes

The system implements a **Soft-Mechanical (`roundedness: 1`)** geometry. 

### Geometric Rationale
Overly rounded forms signal casual consumer apps, while razor-sharp raw corners can impede visual scanning in dense tabular layouts. A controlled `4px` (`0.25rem`) standard corner radius creates a machined, industrial-grade silhouette that reads as engineered and resilient.

### Corner Token Distribution
- **Base Components (`0.25rem`):** Applied to buttons, inputs, data chips, segmented controls, and dispenser telemetry cells.
- **Structural Cards (`rounded-lg: 0.5rem`):** Dispenser bays, power module groupings, and modal dialogs.
- **Pill Exceptions (`9999px`):** Restricted solely to circular status LEDs and inline connectivity status pips.

## Components

### Buttons
- **Primary Action (Active Charge / Pay):** Background `#00FF66`, foreground `#060C17`, font `JetBrains Mono` weight 600, uppercase. Border-radius: `0.25rem`. Zero shadow in resting state; on hover/tap, an electrical aura triggers: `box-shadow: 0 0 16px rgba(0, 255, 102, 0.4)`.
- **Secondary (Telemetry Toggle / Export):** Background `rgba(15, 29, 54, 0.8)`, border: 1px solid `rgba(138, 153, 173, 0.3)`, foreground `#FFFFFF`. On hover, border shifts to `#00E5FF` with text color transitioning to `#00E5FF`.
- **Destructive (Emergency Stop):** Background `rgba(255, 59, 48, 0.1)`, border: 1px solid `#FF3B30`, foreground `#FF3B30`. On focus/press: Background becomes solid `#FF3B30`, text transitions to `#060C17`.

### Chips & Badges
- Lightweight, compact footprint: padding `2px 8px`, typography `label-sm`.
- **Available Chip:** `#00FF66` background at `12%` opacity, border `1px solid rgba(0, 255, 102, 0.4)`, text `#00FF66`.
- **Charging Chip:** `#00E5FF` background at `12%` opacity, border `1px solid rgba(0, 229, 255, 0.4)`, text `#00E5FF`. Includes an oscillating pulse indicator.
- **Offline Chip:** Neutral background at `10%` opacity, border `1px solid rgba(138, 153, 173, 0.2)`, text `#8A99AD`.

### Lists & Telemetry Feeds
- Structured as dense stacked strips separated by `1px solid rgba(138, 153, 173, 0.1)`.
- Numeric values aligned right in `JetBrains Mono`, status icons aligned left. Padding: `8px 12px`.
- Alternating subtle rows or hover highlights using `#162644` to enable rapid eye tracking across 16+ bay dashboards.

### Inputs & Field Controls
- Background: `#060C17`, border: `1px solid rgba(138, 153, 173, 0.25)`, border-radius: `0.25rem`.
- Text: `Hanken Grotesk` 14px in `#FFFFFF`. Floating label: `label-sm` in `#8A99AD`.
- Focused state: Border changes to 1px `#00E5FF`, accompanied by an outer highlight ring: `0 0 0 1px #00E5FF`.

### Checkboxes & Radio Controls
- Base: 16x16px square (checkbox) or circle (radio), border `1px solid #8A99AD`, background `transparent`.
- Selected: Background transitions to `#00FF66`, border color `#00FF66`, icon/indicator colored `#060C17`.

### Cards & Telemetry Dispensers
- Minimalist perimeter with dense internal structure.
- Top section: Station ID (`Space Grotesk`, 14px), Plug Type, and Live Status Badge.
- Middle Section: Telemetry Readout (`telemetry-display` in `#00FF66` showing instantaneous kW output; auxiliary readouts for Amps, Volts, and Temp in `telemetry-md` `#8A99AD`).
- Bottom Section: Session accumulation (kWh delivered, Elapsed Time, Total Cost in TZS).

### Bespoke Domain Components
- **Power Arc Gauge:** Compact circular or horizontal segment gauge displaying phase capacity in increments of 10kW. Active segments illuminate in `#00FF66`; peak-load capacity thresholds render in `#FFB800`.
- **Tariff Phase Pill:** Inline real-time grid indicator displaying current commercial utility rates (e.g., `PEAK 450 TZS/kWh` or `OFF-PEAK 210 TZS/kWh`) utilizing `JetBrains Mono` for immediate operator recognition.