# SocialOps Design System

## Untitled UI v8 Foundation + SocialOps Product Adaptation + Ant Design Implementation Guide

> **Status:** Foundation specification / source of truth  
> **Product:** SocialOps  
> **Primary design reference:** Untitled UI-inspired analytics dashboard approved by the product owner  
> **Implementation target:** React + TypeScript + Ant Design  
> **Design language:** Untitled UI first; keep the current SocialOps shell/layout architecture and apply the reference primarily to visual language, density, and component styling  
> **Last researched:** 2026-08-15

---

# 0. Why this file exists

This document is the **single visual and interaction source of truth** for SocialOps.

It exists so that:

- designers do not invent new visual rules screen by screen;
- developers do not fall back to default Ant Design styling;
- AI coding agents do not invent colors, spacing, radii, shadows, or component variants;
- SocialOps remains visually consistent even as features grow;
- design decisions remain portable if the implementation library changes later.

Authority:

```text
Accessibility and usability
        ↓
SocialOps product requirements
        ↓
design.md
        ↓
SocialOps semantic tokens
        ↓
Ant Design theme/component tokens
        ↓
Ant Design defaults
```

When Ant Design disagrees visually with this file, **this file wins**.

---

# 1. Source provenance

This system was reconstructed from the most reliable sources available.

## 1.1 Primary sources

1. **Untitled UI React v8 official documentation**
   - installation/theme CSS
   - theming
   - typography
   - upgrade to v8
   - component documentation

2. **Untitled UI public Figma design-system file**
   - file key: `QuTkCmTi7bHTYr9p7k3F1Y`
   - direct variable extraction was used on the public Colors node.

3. **Untitled UI Figma PRO VARIABLES v8 preview**
   - file key: `QERVV4a2Fpa1FmsZ5LGW3S`
   - current API access to this preview is view-only, so public docs and public Figma data are used for exact values where possible.

## 1.2 Reliability labels

- **[OFFICIAL-v8]** — directly documented in official Untitled UI v8 material.
- **[FIGMA-EXTRACTED]** — extracted directly from the public Untitled UI Figma file.
- **[SOCIALOPS]** — adapted specifically for SocialOps.
- **[IMPLEMENTATION]** — guidance for mapping Untitled UI onto Ant Design.

---

# 2. Design principles

## 2.1 Minimal, modern, neutral

Untitled UI v8 uses `Neutral` as its default gray family.

SocialOps should:

- use neutral surfaces as the dominant visual language;
- reserve brand color for actions, focus, selection, and emphasis;
- avoid large decorative color blocks in operational screens;
- use whitespace and typography before borders/shadows to create hierarchy.

## 2.2 Product UI, not marketing UI

Inside the authenticated product:

- clarity > decoration;
- scanability > novelty;
- predictable behavior > experimentation;
- subtle motion > decorative animation.

## 2.3 Progressive complexity

Use:

- progressive disclosure;
- drawers/slideouts;
- sensible defaults;
- collapsible advanced options;
- filters before additional navigation levels.

## 2.4 Component consistency

Repeated components must share:

- sizing;
- padding;
- typography;
- radius;
- focus;
- disabled state;
- icon scale;
- hover/pressed behavior.

---

# 3. Token architecture

Use four layers.

## 3.1 Primitive

```text
neutral.50
neutral.900
brand.600
red.500
radius.lg
shadow.md
spacing.4
```

## 3.2 Semantic

```text
color.bg.primary
color.bg.secondary
color.text.primary
color.text.secondary
color.border.primary
color.fg.brand.primary
color.focus-ring
```

## 3.3 Component

```text
button.primary.bg
input.border
table.row.hover
sidebar.item.active.bg
```

## 3.4 SocialOps domain

```text
platform.facebook
platform.tiktok
status.draft
status.pending-approval
status.scheduled
status.published
status.failed
connection.connected
connection.permission-missing
```

---

# 4. Primitive colors

## 4.1 Base

**[OFFICIAL-v8 / FIGMA-EXTRACTED]**

```css
--color-transparent: transparent;
--color-white: #ffffff;
--color-black: #000000;
```

## 4.2 Neutral

**[FIGMA-EXTRACTED]**

| Token       | Value     |
| ----------- | --------- |
| Neutral/50  | `#FAFAFA` |
| Neutral/100 | `#F5F5F5` |
| Neutral/200 | `#E5E5E5` |
| Neutral/300 | `#D4D4D4` |
| Neutral/400 | `#A3A3A3` |
| Neutral/500 | `#737373` |
| Neutral/600 | `#525252` |
| Neutral/700 | `#404040` |
| Neutral/800 | `#262626` |
| Neutral/900 | `#171717` |
| Neutral/950 | `#0A0A0A` |

## 4.3 Approved SocialOps emerald brand

**[OFFICIAL-v8 / FIGMA-EXTRACTED]**

| Token     | Value     |
| --------- | --------- |
| Brand/50  | `#ECFDF5` |
| Brand/100 | `#D1FAE5` |
| Brand/200 | `#A7F3D0` |
| Brand/300 | `#6EE7B7` |
| Brand/400 | `#34D399` |
| Brand/500 | `#10B981` |
| Brand/600 | `#059669` |
| Brand/700 | `#047857` |
| Brand/800 | `#065F46` |
| Brand/900 | `#064E3B` |
| Brand/950 | `#022C22` |

### SocialOps decision

The visual reference uses Untitled UI purple, but SocialOps ships with this
emerald scale instead. Keep the Untitled UI neutral system, spacing, radius,
shadow, and component language; only the primary brand hue changes.

---

# 5. Utility palettes

Untitled UI v8 aligns to Tailwind CSS v4 native palettes.

Use semantic aliases around:

```text
red
yellow
green
blue
sky
indigo
purple
pink
orange
emerald
amber
slate
```

Do not let feature code choose arbitrary raw utility colors.

---

# 6. Extracted utility values

## Red

`50 #FEF2F2` · `100 #FEE2E2` · `200 #FECACA` · `300 #FCA5A5` · `400 #F87171` · `500 #EF4444` · `600 #DC2626` · `700 #B91C1C` · `800 #991B1B` · `900 #7F1D1D` · `950 #450A0A`

## Orange

`50 #FFF7ED` · `100 #FFEDD5` · `200 #FED7AA` · `300 #FDBA74` · `400 #FB923C` · `500 #F97316` · `600 #EA580C` · `700 #C2410C` · `800 #9A3412` · `900 #7C2D12` · `950 #431407`

## Yellow

`50 #FEFCE8` · `100 #FEF9C3` · `200 #FEF08A` · `300 #FDE047` · `400 #FACC15` · `500 #EAB308` · `600 #CA8A04` · `700 #A16207` · `800 #854D0E` · `900 #713F12` · `950 #422006`

## Green

`50 #F0FDF4` · `100 #DCFCE7` · `200 #BBF7D0` · `300 #86EFAC` · `400 #4ADE80` · `500 #22C55E` · `600 #16A34A` · `700 #15803D` · `800 #166534` · `900 #14532D` · `950 #052E16`

## Sky

`50 #F0F9FF` · `100 #E0F2FE` · `200 #BAE6FD` · `300 #7DD3FC` · `400 #38BDF8` · `500 #0EA5E9` · `600 #0284C7` · `700 #0369A1` · `800 #075985` · `900 #0C4A6E` · `950 #082F49`

## Blue

`50 #EFF6FF` · `100 #DBEAFE` · `200 #BFDBFE` · `300 #93C5FD` · `400 #60A5FA` · `500 #3B82F6` · `600 #2563EB` · `700 #1D4ED8` · `800 #1E40AF` · `900 #1E3A8A` · `950 #172554`

## Purple

`50 #FAF5FF` · `100 #F3E8FF` · `200 #E9D5FF` · `300 #D8B4FE` · `400 #C084FC` · `500 #A855F7` · `600 #9333EA` · `700 #7E22CE` · `800 #6B21A8` · `900 #581C87` · `950 #3B0764`

## Pink

`50 #FDF2F8` · `100 #FCE7F3` · `200 #FBCFE8` · `300 #F9A8D4` · `400 #F472B6` · `500 #EC4899` · `600 #DB2777` · `700 #BE185D` · `800 #9D174D` · `900 #831843` · `950 #500724`

## Rose

`50 #FFF1F2` · `100 #FFE4E6` · `200 #FECDD3` · `300 #FDA4AF` · `400 #FB7185` · `500 #F43F5E` · `600 #E11D48` · `700 #BE123C` · `800 #9F1239` · `900 #881337` · `950 #4C0519`

## Slate

`50 #F8FAFC` · `100 #F1F5F9` · `200 #E2E8F0` · `300 #CBD5E1` · `400 #94A3B8` · `500 #64748B` · `600 #475569` · `700 #334155` · `800 #1E293B` · `900 #0F172A` · `950 #020617`

---

# 7. Semantic colors — light mode

## 7.1 Text

**[OFFICIAL-v8]**

```css
--color-text-primary: var(--color-neutral-900);
--color-text-secondary: var(--color-neutral-700);
--color-text-secondary_hover: var(--color-neutral-800);
--color-text-tertiary: var(--color-neutral-600);
--color-text-tertiary_hover: var(--color-neutral-700);
--color-text-quaternary: var(--color-neutral-500);
--color-text-placeholder: var(--color-neutral-500);

--color-text-brand-primary: var(--color-brand-900);
--color-text-brand-secondary: var(--color-brand-700);
--color-text-brand-secondary_hover: var(--color-brand-800);
--color-text-brand-tertiary: var(--color-brand-600);

--color-text-error-primary: var(--color-red-600);
--color-text-warning-primary: var(--color-yellow-600);
--color-text-success-primary: var(--color-green-600);

--color-text-white: var(--color-white);
--color-text-primary_on-brand: var(--color-white);
--color-text-secondary_on-brand: var(--color-brand-200);
--color-text-tertiary_on-brand: var(--color-brand-200);
--color-text-quaternary_on-brand: var(--color-brand-300);
```

## 7.2 Borders

**[OFFICIAL-v8]**

```css
--color-border-primary: var(--color-neutral-300);
--color-border-secondary: var(--color-neutral-200);
--color-border-secondary_alt: rgb(0 0 0 / 0.1);
--color-border-tertiary: var(--color-neutral-100);
--color-border-brand: var(--color-brand-500);
--color-border-brand_alt: var(--color-brand-600);
--color-border-error: var(--color-red-500);
--color-border-error_subtle: var(--color-red-300);
```

## 7.3 Background roles

Use semantic surface names:

```text
bg.primary
bg.primary_alt
bg.primary_hover
bg.secondary
bg.secondary_alt
bg.secondary_hover
bg.tertiary
bg.quaternary
bg.active
bg.overlay
bg.brand-primary
bg.brand-secondary
bg.brand-solid
bg.brand-solid_hover
bg.error-primary
bg.error-secondary
bg.error-solid
bg.warning-primary
bg.warning-secondary
bg.warning-solid
bg.success-primary
bg.success-secondary
bg.success-solid
```

Feature code should not hard-code `#fff` for product surfaces.

---

# 8. Dark mode

**[OFFICIAL-v8]**

Untitled UI v8 uses semantic variable remapping.

Rules:

- components consume semantic tokens;
- utility color scales remap for dark surfaces;
- dark mode is not a simple color inversion;
- borders become more important than shadows;
- charts must be tested independently;
- platform identities must retain adequate contrast.

Preferred class convention can follow Untitled UI:

```html
<html class="dark-mode"></html>
```

---

# 9. Typography

## 9.1 Font family

**[OFFICIAL-v8 / FIGMA-EXTRACTED]**

```css
Inter, -apple-system, "Segoe UI", Roboto, Arial, sans-serif
```

Monospace:

```css
ui-monospace, "Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace
```

## 9.2 Scale

| Token       | Size | Line height | Letter spacing |
| ----------- | ---: | ----------: | -------------: |
| Text xs     | 12px |        18px |              0 |
| Text sm     | 14px |        20px |              0 |
| Text md     | 16px |        24px |              0 |
| Text lg     | 18px |        28px |              0 |
| Text xl     | 20px |        30px |              0 |
| Display xs  | 24px |        32px |              0 |
| Display sm  | 30px |        38px |              0 |
| Display md  | 36px |        44px |        -0.72px |
| Display lg  | 48px |        60px |        -0.96px |
| Display xl  | 60px |        72px |         -1.2px |
| Display 2xl | 72px |        90px |        -1.44px |

Weights:

```text
400 Regular
500 Medium
600 Semibold
700 Bold — sparingly
```

## 9.3 Application mapping

```text
Page title        Display xs / Semibold   24/32
Section heading   Text xl / Semibold      20/30
Component heading Text lg / Semibold      18/28
Body              Text sm/md              14/20 or 16/24
Label             Text sm / Medium        14/20
Metadata          Text xs / Regular       12/18
```

Do not invent 15px/17px/19px typography.

---

# 10. Spacing

Base unit:

```text
4px
```

Scale:

```text
0   = 0
0.5 = 2px
1   = 4px
1.5 = 6px
2   = 8px
2.5 = 10px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
```

Common use:

```text
Icon ↔ label          8px
Label ↔ input         6px
Input ↔ hint          6px
Field ↔ field         16–20px
Card padding          20–24px
Section gap           24–32px
Major section gap     32–48px
```

---

# 11. Radius

**[OFFICIAL-v8]**

| Token   |  Value |
| ------- | -----: |
| none    |    0px |
| xs      |    2px |
| sm      |    4px |
| default |    4px |
| md      |    6px |
| lg      |    8px |
| xl      |   12px |
| 2xl     |   16px |
| 3xl     |   24px |
| full    | 9999px |

SocialOps defaults:

```text
inputs/buttons       8px
cards                8–12px
dropdown/popover     8–12px
modal                16px
avatar               full
```

---

# 12. Shadows and elevation

**[OFFICIAL-v8]**

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);

--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);

--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);

--shadow-lg:
  0 12px 16px -4px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03),
  0 2px 2px -1px rgba(0, 0, 0, 0.04);

--shadow-xl:
  0 20px 24px -4px rgba(0, 0, 0, 0.08), 0 8px 8px -4px rgba(0, 0, 0, 0.03),
  0 3px 3px -1.5px rgba(0, 0, 0, 0.04);

--shadow-2xl: 0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 4px 4px -2px rgba(0, 0, 0, 0.04);

--shadow-3xl: 0 32px 64px -12px rgba(0, 0, 0, 0.14), 0 5px 5px -2.5px rgba(0, 0, 0, 0.04);
```

Elevation:

```text
page/surface       none
card               none/xs
sticky toolbar     xs/sm
dropdown/popover   md
drawer              lg
modal               xl
```

---

# 13. Container and breakpoints

**[OFFICIAL-v8]**

```text
max-width container: 1280px
xxs: 320px
xs: 600px
```

SocialOps application ranges:

```text
<600        mobile
600–767     large mobile/small tablet
768–1023    tablet
1024–1279   small desktop
>=1280      desktop
>=1536      wide desktop
```

Full-width operational screens may ignore the 1280px content max-width:

- planning calendar;
- analytics workbench;
- large tables;
- composer split view.

---

# 14. Borders

Use:

```text
1px normal
semantic border roles
```

Prefer horizontal separators and whitespace over full grid borders.

---

# 15. Focus

**[OFFICIAL-v8]**

```text
focus ring: Brand/500
error focus: Red/500
```

Never remove keyboard focus without an accessible replacement.

---

# 16. Disabled

**[OFFICIAL-v8]**

v8 standardizes disabled states around:

```css
opacity: 0.5;
```

Do not invent different disabled colors for every component.

For permission/integration constraints, pair disabled state with an explanation.

---

# 17. Icons

Preference:

1. `@untitledui/icons`
2. Ant Design icon only when needed
3. no casual mixing of icon families

Common sizes:

```text
12 small utility
16 standard inline
20 navigation/action
24 large action
```

Icon-only controls need:

- accessible name;
- tooltip where useful;
- adequate hit target.

---

# 18. Buttons

**[OFFICIAL-v8]**

Variants:

```text
primary
secondary
tertiary
primary-destructive
secondary-destructive
tertiary-destructive
link-gray
link-color
link-destructive
```

Sizes:

```text
xs
sm
md
lg
xl
```

v8 adds `xs` at 32px height.

Every button supports:

```text
default
hover
focus-visible
pressed
loading
disabled
```

Loading preserves width.

---

# 19. Inputs

v8 modernizes Input/Select around:

```text
sm
md
lg
```

SocialOps:

```text
md standard forms
sm compact filters/toolbars
lg onboarding/auth
```

Anatomy:

```text
Label
Control
Hint/error
```

---

# 20. Textarea

Use for:

- caption;
- comment;
- report description;
- notes.

Caption textarea should support:

- character count;
- platform limit feedback;
- stable error/hint area;
- sufficient vertical space.

---

# 21. Select / Tag Select / Multi-select

Use:

```text
Workspace selector    Select
Brand selector        searchable Select
Channel selector      searchable Multi-select
Report tags/sections  Tag Select where suitable
Role                   Select
```

Long account lists require search.

Account options should show:

- avatar;
- name;
- platform;
- connection health;
- disabled reason.

---

# 22. Checkbox / Radio / Toggle

Checkbox:

- independent multi-selection.

Radio:

- one-of-few visible options.

Toggle:

- immediate binary state.

Do not use Toggle for changes that require a Save action.

---

# 23. Tags and badges

Use for:

- status;
- category;
- connection state;
- compact count/context.

Do not turn every label into a pill.

Status must never rely on color alone.

---

# 24. Avatar

Use for:

- user;
- member;
- brand;
- social account.

v8 supports border/rounded/count variants and subtle skeuomorphic effects.

---

# 25. Dropdown / Context menu

v8 supports richer dropdowns, submenus and context menus.

Selection indicators may use:

```text
checkmark
checkbox
radio
toggle
```

Destructive actions must be visually separated and may require confirmation.

---

# 26. Tabs

Untitled UI tab styles include:

```text
brand
gray
border
minimal
```

SocialOps default:

> minimal or border tabs for application-level sub-navigation.

Examples:

```text
Facebook: Overview | Posts | Analytics
Planning: Calendar | List
```

---

# 27. Tables

**[OFFICIAL-v8]**

Sizes:

```text
sm
md
```

Default SocialOps: `md`.

Use `sm` for logs/dense data.

Rules:

- subtle horizontal separation;
- avoid vertical grids;
- clear hover/selected state;
- aligned numbers;
- bulk-selection toolbar;
- preserve filters across pagination.

---

# 28. Modal

v8 consolidates:

- radius;
- primary background;
- `shadow-xl`;
- scroll behavior.

Use for:

- confirmation;
- short form;
- small decision.

Do not use for:

- full Post Composer;
- complex Report Builder;
- large permission editor.

---

# 29. Drawer / Slideout

Use for:

- profile;
- contextual detail;
- filters;
- post detail;
- approval detail;
- account detail.

Suggested SocialOps widths:

```text
400–480px compact
520–640px normal
720–800px complex
```

---

# 30. Pagination

Use direct-page and rows-per-page patterns for operational datasets.

Avoid infinite scroll for stable records.

---

# 31. Empty states

v8 includes multiple empty-state variants.

SocialOps anatomy:

```text
Visual/icon
Title
One sentence
Primary action
Optional secondary action
```

---

# 32. Notifications and alerts

Transient notification/toast:

```text
Saved
Copied
Queued
Export started
```

Persistent alert:

```text
Token expiring
Permission missing
Publish failed
Billing limit
```

Actionable errors must not disappear too quickly.

---

# 33. Loading

Use:

- skeleton for layouts;
- spinner for local actions;
- upload progress;
- loading button.

Avoid full-app spinners if only one region loads.

---

# 34. Filter bars

Common SocialOps filters:

```text
Platform
Account
Status
Approval
Publish state
Date
Creator
Approver
```

Rules:

- common filters visible;
- advanced filters collapsed;
- show active count;
- provide Clear all;
- preserve state across related views.

---

# 35. Command menu / Search

May support `⌘K` / `Ctrl+K`.

Potential actions:

```text
Switch workspace
Switch brand
Find content
Find account
Jump to page
Create post
```

---

# 36. Data visualization

Use:

- line;
- bar;
- pie only for small categorical sets;
- radar only when meaningful;
- metric components.

Hierarchy:

```text
Key metrics
Performance trend
Top content
Channel comparison
Detail table
```

Avoid large rows of equal-emphasis KPI cards.

---

# 37. SocialOps application shell

Visual source note:

- keep the current routed SocialOps shell structure;
- do not replace the app with the generic analytics IA from the reference image;
- apply the reference to spacing, typography, control styling, borders, shadows, and density instead.

## Topbar

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Logo  [Workspace ▾]  [Brand ▾]   Overview   Planning          [Avatar]  │
└───────────────────────────────────────────────────────────────────────────┘
```

## Sidenav — MVP

```text
SUMMARY
All Platforms

PLATFORMS
Facebook
TikTok

────────────

Reports
Members
Settings
```

MVP is Facebook + TikTok only.

---

# 38. Workspace selector behavior

When workspace changes:

1. update workspace;
2. invalidate brand if no longer valid;
3. restore last-used brand if available;
4. otherwise pick first accessible brand;
5. refresh context.

Invariant:

```ts
selectedBrand.workspaceId === selectedWorkspace.id
```

---

# 39. Brand selector behavior

Changing brand updates:

- Overview;
- Planning;
- platform counts;
- social accounts;
- reports context;
- brand-level permissions.

---

# 40. Avatar drawer

Contains:

```text
Profile
Language
Appearance
Help & Support
Logout
```

---

# 41. All Platforms

Cross-platform summary for the current brand.

Recommended:

```text
Views
Engagement
Published posts
Follower growth
Performance trend
Platform comparison
Top content
Publishing health
```

---

# 42. Facebook platform view

Disconnected:

```text
Facebook
No Facebook Pages connected.
[Connect Facebook]
```

Connected:

```text
Facebook
3 Pages connected                 [+ Connect Page]

[All Pages ▾]

Overview | Posts | Analytics
```

---

# 43. TikTok platform view

```text
TikTok
N accounts connected              [+ Connect TikTok]

[All Accounts ▾]

Overview | Posts | Analytics
```

Keep structure parallel with Facebook unless platform behavior requires otherwise.

---

# 44. Planning

Brand-level feature.

```text
Planning

Calendar | List

Platform
Status
Approval
Date

[Create post]
```

Contains:

- draft;
- approval;
- scheduled;
- published;
- failed;
- calendar;
- list.

---

# 45. Create Post

One Content belongs to exactly one platform.

```text
Create post
  ↓
Facebook
or
TikTok
```

No cross-platform bulk content entity in MVP.

---

# 46. Post Composer

Desktop:

```text
┌─────────────────────────────────┬──────────────────────────┐
│ Editor                          │ Preview                  │
│ Platform                        │                          │
│ Accounts                        │ Social post preview      │
│ Media                           │                          │
│ Caption                         │                          │
│ Per-account overrides           │                          │
│ Schedule                        │                          │
│ Approval                        │                          │
└─────────────────────────────────┴──────────────────────────┘
```

Use full page or large work surface, not a tiny modal.

---

# 47. Channel selector

Facebook content shows only Facebook Pages.

TikTok content shows only TikTok accounts.

Options show:

- avatar;
- name;
- selected state;
- health;
- disabled reason.

---

# 48. Calendar card

Compact:

```text
19:00 [FB]
[thumb] Summer campaign...
Approved
3 pages
```

Must show:

- time;
- thumbnail/type;
- title/caption preview;
- platform;
- status;
- account count.

---

# 49. Approval

Content states:

```text
DRAFT
PENDING_APPROVAL
APPROVED
REJECTED
```

Publication states:

```text
SCHEDULED
PUBLISHING
PUBLISHED
FAILED
```

Keep approval and publication conceptually separate.

---

# 50. Publication status

One Content → many Publications.

Summary:

```text
8 / 10 published
```

Retry only failed Publications.

Never repost successful ones.

---

# 51. Connection health

```text
CONNECTED
TOKEN_EXPIRING
TOKEN_EXPIRED
PERMISSION_MISSING
DISCONNECTED
ERROR
```

Always use text/accessibility, not colored dot only.

---

# 52. Reports

Builder:

```text
Report details
Date range
Platforms/accounts
Sections
Ordering
Preview
Export/share
```

Possible sections:

```text
Executive summary
Overview
Facebook performance
TikTok performance
Top content
Publishing activity
Engagement
Failures
Notes
```

---

# 53. Members and permissions

Member table:

```text
Member
Email
Workspace role
Brand access
Status
```

Permission groups:

```text
Brand
Channels
Content
Approval
Publishing
Analytics
Reports
Members
Billing
```

---

# 54. Settings

Recommended width:

```text
720–880px
```

Separate destructive settings visually at the end.

---

# 55. Responsive behavior

## >=1280

- persistent side nav;
- split composer;
- full calendar;
- multi-column analytics;
- full tables.

## 1024–1279

- narrower nav;
- hide low-priority columns;
- reduce preview width.

## 768–1023

- side nav compact/drawer;
- analytics 2-column;
- filters collapse;
- composer preview may become tab.

## <768

- side nav drawer;
- one-column;
- agenda/list calendar;
- stacked composer;
- sticky primary action allowed;
- ~44px touch targets.

Do not shrink desktop mechanically.

---

# 56. Accessibility

Target WCAG AA:

```text
normal text 4.5:1
large text 3:1
UI boundaries 3:1 where applicable
```

Keyboard:

- logical Tab order;
- Enter/Space activate;
- Escape closes expected overlays;
- modal traps focus;
- focus returns to trigger.

Color is never the only status indicator.

Respect `prefers-reduced-motion`.

---

# 57. Motion

Guidance:

```text
fast      120ms
standard  150–200ms
drawer    200–300ms
```

Use for:

- hover;
- selection;
- popover;
- modal;
- drawer;
- collapse.

Avoid bounce/large zoom/decorative loops in app UI.

---

# 58. Ant Design implementation

Architecture:

```text
design.md
  ↓
SocialOps primitive tokens
  ↓
SocialOps semantic tokens
  ↓
Ant ConfigProvider
  ↓
Ant component tokens
  ↓
SocialOps wrappers
  ↓
Feature components
```

---

# 59. Ant theme baseline

```ts
const socialOpsTheme = {
  token: {
    colorPrimary: '#7F56D9',

    colorText: '#171717',
    colorTextSecondary: '#404040',
    colorTextTertiary: '#525252',

    colorBgBase: '#FFFFFF',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#FAFAFA',
    colorBgElevated: '#FFFFFF',

    colorBorder: '#D4D4D4',
    colorBorderSecondary: '#E5E5E5',

    colorError: '#DC2626',
    colorWarning: '#CA8A04',
    colorSuccess: '#16A34A',
    colorInfo: '#2563EB',

    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',

    fontSize: 14,

    borderRadius: 8,
    borderRadiusSM: 4,
    borderRadiusLG: 12,

    controlHeightSM: 32,
    controlHeight: 40,
    controlHeightLG: 44,
  },
}
```

Verify token names against the actual Ant Design version installed.

---

# 60. Ant override order

1. `ConfigProvider theme.token`
2. `ConfigProvider theme.components`
3. semantic styles/classNames APIs
4. product wrapper
5. scoped CSS
6. global `.ant-*` only as last resort

---

# 61. Ant mapping

## Button

`primary → primary`, `default → secondary`, `text → tertiary`, `danger → destructive`.

## Input/TextArea

Preserve behavior, replace visual shell.

## Select

Preserve search/keyboard/portal behavior, restyle.

## DatePicker/TimePicker

Preserve interaction, restyle field and popup.

## Table

Preserve sorting/filtering/selection/pagination; restyle strongly.

## Modal

Preserve accessibility/portal, map surface/radius/shadow.

## Drawer

Use for SocialOps slideouts.

## Form

Behavior can come from Ant; visual anatomy follows this file.

## Tag

No arbitrary Ant preset colors.

## Menu

Do not keep default Ant blue selection.

## Tabs

Map to Untitled minimal/border patterns.

## Calendar

Treat as primitive only; SocialOps calendar is a signature component.

---

# 62. Recommended wrappers

```text
UIButton
UIInput
UISelect
UIDatePicker
UITable
UIModal
UIDrawer
UITabs
UIBadge
StatusBadge
PlatformBadge
PageHeader
EmptyState
ErrorState
FilterBar
```

Wrap only when it adds design-system value.

---

# 63. Platform identity

```text
Facebook #1877F2
TikTok    #111111
```

Use for icon/small contextual accents only.

Do not use platform colors as SocialOps brand color.

---

# 64. Workflow colors

```text
Draft             neutral
Pending approval  yellow/amber
Approved          brand/green depending context
Scheduled         blue
Publishing        blue
Published         green
Failed            red
Rejected          red
```

Use soft semantic backgrounds and text labels.

---

# 65. Page anatomy

```text
Page header
  title
  description/context
  page actions

Filters/context

Primary content

Secondary/detail content
```

---

# 66. Page header

Use slots:

```text
breadcrumb/context
title
description
metadata
primary action
secondary action
filters/tabs
```

Keep global topbar stable.

---

# 67. Cards

Default:

```text
bg.primary
border.secondary
radius lg/xl
shadow none/xs
```

Do not put every section inside a card.

---

# 68. Data density

Application density should be comfortable, not sparse.

Use compact density for:

- tables;
- logs;
- bulk lists;
- side navigation.

---

# 69. Truncation

```text
Sidebar      1 line
Table cell   1 line unless content column
Calendar     1–2 lines
Post list    2–3 lines
Detail       full
```

---

# 70. Date/time/timezone

Scheduling must display timezone where ambiguity matters.

Example:

```text
15 Aug 2026
19:00
GMT+7
```

---

# 71. State contract

Every major feature must cover:

```text
Loading
Empty
Success
Partial success
Error
Permission denied
Disconnected
Expired permission/token
```

---

# 72. Key screens to validate

1. Login
2. Workspace/Brand switch
3. Brand Overview
4. Planning Calendar
5. Planning List
6. Create Facebook Post
7. Create TikTok Post
8. Facebook disconnected
9. Facebook overview
10. TikTok disconnected
11. TikTok overview
12. Analytics
13. Reports
14. Report Builder
15. Members
16. Settings
17. Profile drawer
18. Publication failure
19. Approval detail
20. Mobile planning

---

# 73. Figma organization

```text
00 Cover
01 Foundations
02 Base Components
03 Application Components
04 SocialOps Components
05 Patterns
06 Templates
07 Screens
08 Prototypes
```

SocialOps components:

```text
WorkspaceSelector
BrandSelector
PlatformNavItem
SocialAccountCard
ChannelSelector
PostComposer
PostPreview
CalendarPostCard
ApprovalBadge
ApprovalPanel
PublicationStatus
ConnectionHealth
MetricCard
ReportBuilder
```

---

# 74. Naming conventions

Good:

```text
color.text.primary
color.bg.primary
color.border.secondary
status.published.bg
platform.facebook.fg
```

Avoid names based on appearance such as `purpleButton` or `grayText`.

---

# 75. AI coding rules

AI MUST:

- read this file first;
- reuse semantic tokens;
- reuse wrappers;
- follow Untitled typography;
- follow radius/shadow/spacing scales;
- preserve responsive behavior;
- preserve accessibility;
- implement loading/empty/error;
- treat Ant as behavior foundation where appropriate.

AI MUST NOT:

- invent colors;
- invent spacing;
- invent radii;
- invent shadows;
- use default Ant blue;
- add decorative gradients;
- use platform color as app brand;
- use global `.ant-*` hacks without need;
- make every section a card;
- remove keyboard/focus behavior.

---

# 76. Visual review checklist

## Foundation

- [ ] semantic colors
- [ ] correct type scale
- [ ] correct spacing
- [ ] correct radius
- [ ] correct shadow
- [ ] no arbitrary hex
- [ ] no unapproved gradients

## Interaction

- [ ] hover
- [ ] focus-visible
- [ ] pressed/selected
- [ ] disabled
- [ ] loading
- [ ] error
- [ ] empty

## Responsive

- [ ] desktop
- [ ] small desktop
- [ ] tablet
- [ ] mobile
- [ ] overflow
- [ ] touch targets

## Accessibility

- [ ] contrast
- [ ] keyboard
- [ ] focus
- [ ] labels
- [ ] icon button name
- [ ] status not color-only

## Domain

- [ ] workspace context
- [ ] brand context
- [ ] platform context
- [ ] connection state
- [ ] approval state
- [ ] publication state
- [ ] timezone where relevant

---

# 77. v8-specific notes

SocialOps should preserve these v8 directions:

- Tailwind CSS v4.3 palette alignment.
- Neutral as default gray.
- Reduced redundant color variables.
- Semantic color mapping.
- `opacity-50` disabled pattern.
- Input/Select sm/md/lg.
- Button xs 32px.
- Icon-capable tabs.
- Richer dropdown selection indicators.
- Tighter sidebar/header spacing.
- Consolidated modal surface/radius/shadow.
- Rich filter/multi-select/tree/empty/pagination patterns.
- RTL readiness through logical CSS properties.

---

# 78. RTL readiness

Prefer logical properties:

```text
margin-inline-start
padding-inline-end
inset-inline-start
text-align: start
border-inline-start
```

Avoid physical left/right when the meaning is directional.

---

# 79. Change process

When a design need is missing:

1. check Untitled UI patterns;
2. check SocialOps tokens;
3. check existing product components;
4. define reusable rule/token if genuinely new;
5. update this file;
6. implement.

Do not solve system gaps with one-off CSS.

---

# 80. Final direction

```text
Untitled UI v8
+
Neutral foundation
+
default Untitled purple until SocialOps brand is finalized
+
Inter
+
Untitled spacing/radius/shadows
+
Ant Design behavioral primitives
+
SocialOps-specific planning/publishing/analytics UX
```

The product must feel polished, current, professional, efficient, and never like default Ant Design or a generic admin template.

---

# 81. Official references

```text
https://www.untitledui.com/figma
https://www.untitledui.com/free-figma-ui-kit
https://www.untitledui.com/changelog
https://www.untitledui.com/react
https://www.untitledui.com/react/docs/installation
https://www.untitledui.com/react/docs/theming
https://www.untitledui.com/react/docs/typography
https://www.untitledui.com/react/docs/upgrade
https://www.untitledui.com/react/docs/rtl
https://www.untitledui.com/react/components
https://www.untitledui.com/react/components/buttons
https://www.untitledui.com/react/components/inputs
https://www.untitledui.com/react/components/tables
https://www.untitledui.com/react/components/sidebar-navigations
https://www.untitledui.com/react/components/header-navigations
https://www.untitledui.com/react/components/tabs
https://www.untitledui.com/react/application-ui
https://www.untitledui.com/components/color-styles
https://www.untitledui.com/components/typography-styles
https://www.untitledui.com/components/grids-spacing
```

Figma references:

```text
PRO VARIABLES v8 preview:
https://www.figma.com/design/QERVV4a2Fpa1FmsZ5LGW3S/

FREE design-system file:
https://www.figma.com/design/QuTkCmTi7bHTYr9p7k3F1Y/
```

---

# 82. Provenance warning

This is **not an official Untitled UI distribution** and does not reproduce the proprietary PRO Figma library.

It is a SocialOps implementation specification reconstructed from:

- official public documentation;
- public Figma foundation data;
- officially documented v8 token behavior;
- SocialOps product requirements.

If licensed PRO VARIABLES data later becomes extractable, validate and update:

- complete variable collections;
- component property names;
- width variables;
- effects variables;
- full dark-mode aliases;
- page-level spacing;
- any newer post-v8 component changes.
