# Salon Calendar — Design Philosophy

This app replaces a paper appointment book for salon employees who are
**not tech-savvy** — assume the skill level of someone who cannot operate
Google Calendar. Every decision here optimizes for zero learning curve and
maximum legibility over feature completeness, density, or conventional web
design taste. Read this before touching any UI in this project.

The concrete model to hold in your head: a real wall calendar hanging on a
big screen. All of a month's days are visible at once, exactly like a
printed page. You write directly on a day to add something. There is
nothing to configure, nothing themed, nothing to learn.

## Primary device: an in-store desktop/laptop computer

This is NOT a phone-first app, despite being PWA-installable. The real,
primary usage is a computer sitting at the front desk with a full-size
monitor. Design and lay out every screen for that first:

- **Use the available screen space.** A cramped, narrow column centered in
  a sea of empty background is a failure, not a clean minimalist choice.
  Whitespace must never be the reason something looks small — if a
  desktop screen is wide, the calendar, the text, the buttons should be
  correspondingly large, not padded out with unused margin. The root font
  size itself scales with viewport width (see `html` in `src/index.css`),
  so a big front-desk monitor (2560px+) gets visibly larger text than a
  standard 1920px screen — not just more empty margin around the
  same-sized content.
- Mobile/tablet layouts (for the PWA-install case) are a secondary
  consideration — they should still work, but never at the cost of the
  desktop experience.

## Big, stark, unmistakable — and deliberately plain

- **Big fonts everywhere.** When in doubt, go bigger. Body text,
  appointment lines, day numbers — this is read at a glance by someone
  standing at a counter, possibly without reading glasses. Text is full
  near-black ink, not grey. (The day number in a calendar cell is kept a
  little smaller than the appointment lines, like a printed calendar.)
- **One fixed stark-white theme, always.** White background, near-black
  text — not dark-mode-aware, not theme-switching. This runs on a known
  in-store device; its appearance should never depend on a system dark
  mode setting. Do not reintroduce a `prefers-color-scheme` variant.
- **No accent color, no decorative typeface.** This was tried (a gold
  "paper calendar" theme with a Didone display serif) and explicitly
  rejected by the owner as clutter that drifted away from this file's own
  philosophy. The app uses the system UI font stack and black-on-white
  only, plus grey hairlines for the grid. Today's day number, the day
  currently open for editing, and the employee filter dropdown are all
  shown with weight/borders, never color — this includes appointments
  under the employee filter's **All** view (see "Per-employee calendar"
  below), which was briefly color-coded per employee and then explicitly
  reverted; don't reintroduce color-coding there either without the owner
  asking for it again.
- **Large tap/click targets.** Every interactive element should be
  obviously clickable and comfortably sized — no small icon buttons, no
  fine print as the only affordance.
- **Plain language, no extra words.** The people using this only ever look
  at the calendar itself — they are not reading instructions or pressing
  labeled buttons elsewhere. Don't add copy, banners, or confirmations
  beyond what's on the calendar unless something has actually gone wrong
  (see "never fail silently" below).

## Interaction model

- **One screen: the month, and nothing else.** No sidebar, no separate
  form, no day-view drill-in, no modal, no confirmation dialog. The
  calendar grid is the entire app.
- **The grid is exactly the month.** As many day cells as the month has
  days (28–31), Sunday–Saturday columns, sized to fill the screen. Slots
  before day 1 or after the last day are blank — no faded days from the
  neighboring month. The current month is the default view on load and
  always fits without scrolling (a very busy month is the one exception
  that may scroll).
- **Click a day to write on it.** The cell expands in place into editable
  lines: each existing appointment as one plain text line, typed the same
  way it'd be written on paper ("2:30 Full set"), plus one blank line at
  the end. Tapping an empty day lands you straight in that blank line,
  ready to type — no extra click to "get into" it. Nothing floats over the
  grid and nothing else on screen moves. Only one day is ever open at a
  time — opening another closes the previous one.
- **Assume limited keyboard/mouse precision.** This audience can't
  reliably hit a small target or type punctuation fluently, so: clicking
  anywhere in an already-open day (not just precisely on a line) still
  focuses the newest line, rather than requiring an exact hit; the blank
  line is always focused the moment it appears (on open, and again after
  each add) so typing can just continue; and a time can be typed with no
  colon at all ("230 Full set" — see `parseTimeAndNote` in
  `lib/date.js`), since that key is hard for some people to reach. There's
  also no placeholder example text in the blank line — it was mistaken
  for a real entry.
- **No Save button, no separate time field, no format checking, no time
  required.** A line commits when you click away from it (or press Enter)
  — `lib/date.js`'s `parseTimeAndNote` reads a leading time off the same
  line as the note, the way staff already write it. A bare hour with no
  am/pm is read the way paper is: 1–7 means afternoon/evening, 8–11 means
  morning, 12 is noon. A line with no recognizable time is just saved as a
  note with no time (the database column is nullable — see
  `supabase/migrations/0002_optional_time.sql`); it appears after the
  timed appointments in that day's cell. Retyping an existing timed line
  with no time in it keeps that appointment's time as-is and only updates
  the note — nothing is ever invented, and nothing is required either.
  Clicking outside the open day (or pressing Escape) closes it, and first
  lets whatever you were typing commit, so leaving never silently discards
  a valid entry.
- **No delete button, no confirmation step.** Clearing a line entirely and
  clicking away removes that appointment. Editing directly is also how a
  mistake (wrong time, misspelled note) gets fixed — there's no separate
  "undo" or "delete" affordance to learn.
- **Change month by scrolling.** The calendar is one continuous scroll of
  month pages (a couple of years back and forward), not a single page you
  flip — scrolling flows straight from one month into the next, no
  buttons, no gesture-triggered page swap. The page loads scrolled to the
  current month.
- **Never fail silently.** A save or removal that actually fails (a
  dropped connection, a database error) must say so explicitly, in plain
  language, right next to what failed — never a full-page banner, never
  nothing. This is about real failures, not input formatting — see above.
- **Same-time appointments are normal, not a conflict** — multiple
  employees can each have a client at once; the app never flags this.
- **Per-employee calendar, as a filter, not separate logins.** A small
  dropdown next to every month name (present on every month since the
  calendar is one continuous scroll) lists **All** plus every employee, and
  a **+ Add employee** row at the end. Adding one is a text entry right
  inside that dropdown — no separate screen, same commit-on-blur/Enter, no
  Save button as everywhere else. Selecting an employee filters the whole
  calendar to just their appointments; typing a new line while their filter
  is active tags it to them automatically, while typing under **All**
  leaves it unassigned, same as before this feature existed. **All**
  aggregates everyone's tagged appointments plus every unassigned one —
  nothing is ever hidden by adding employees. All appointment text stays
  plain ink everywhere, including **All** — there's no color-coding by
  employee (see above); telling lines apart there means checking each
  employee's own filter. Editing a line's text never reassigns who it's
  tagged to; that only ever happens at creation.

## Where the rest lives

The full architecture, data model, and build-milestone history are in the
original planning doc. This file is the durable "why it looks/behaves
this way" reference — update it if a real design decision changes, don't
let this drift out of sync with the code.
