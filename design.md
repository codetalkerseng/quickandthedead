"The Quick and the Dead" - App Design Document

1. Concept & Vibe

A real-time, dynamic-survival tournament web application for live Airsoft quick-draw competitions. The aesthetic is rugged, tense, and cinematic (sepia tones, charcoal blacks, dust, and blood red accents). The app manages the flow of challenges, enforces safety gear, and perfectly synchronizes a countdown clock across all devices to trigger the draw.

2. Core Game Rules & Mechanics

Dynamic Survival: Players remain in the pool until eliminated or disqualified.

The "No Refusal" Protocol: Any active player can challenge any other. The defender cannot decline.

The Hourly Quota: Every competitor must fight at least once per hour. The UI will highlight players entering the "Danger Zone" (45+ mins since last duel) to encourage challenges.

Resolution: Fights continue until one yields, is eliminated, or a double-elimination (tie) occurs.

Drifters (Late Joiners): Late participants can register mid-tournament. Their hourly clock begins the moment their profile is created. They are flagged with a "Drifter" badge until their first duel.

Safety First: A mandatory, un-bypassable checklist for eye/mouth protection and holstering appears before the 1-minute countdown.

3. "Fun" Enhancements (Thematic Elements)

Boot Hill (The Graveyard): Instead of just crossing off names, eliminated players are moved to a visual "Boot Hill" tab with an epitaph (e.g., "Gunned down by [Opponent]", "Yielded to [Opponent]", or "Disqualified by the Sheriff").

The Town Crier (Kill Feed): A scrolling ticker at the top or bottom of the global tournament board announcing events in real-time (e.g., "The Kid just called out Scars!", "Cort advances!").

Cinematic Audio: Subtle heartbeat sounds during the 1-minute warning, culminating in a loud, synchronized clock chime/gong at 00:00.

4. Technical Architecture (Firebase Free Tier)

Frontend: React (Vite) + Tailwind CSS + Lucide React. Mobile-first responsive design.

Backend: Firebase v10+ (Auth, Firestore, Hosting).

Constraints: To stay within the Spark Plan (Free Tier) limits (50k reads/day, no Cloud Functions):

No Live Database Timers: The clock ticks locally on the client. Firestore only stores a static scheduledTime timestamp.

NTP Synchronization: The client calculates server time-drift upon loading to ensure the local requestAnimationFrame countdown chimes on all phones within milliseconds of each other.

Security Rules Driven: All logic and role-based access control (Admin vs. Player) is enforced via firestore.rules.

5. User Workflows

A. Registration & Onboarding

User scans QR code, uses a shareable link, or enters a room code.

Creates an account via Email/Password.

Sets up Profile: Legal Name, Nickname (Public), Photo/Selfie, Handedness (R/L), and Character Alignment (Dropdown: Ellen, Herod, Cort, The Kid, etc.).

B. The Duel Lifecycle

The Call Out: Player A selects Player B from the Active Roster and issues a challenge.

The Announcement: The app broadcasts a "Next Match" banner to all screens ("Player A vs. Player B"). Match status is scheduled.

The 5-Minute Warning: Match status moves to warning. Push/in-app notifications tell players to approach the staging area.

The Safety Gate (Pre-1-Min): Players open the app and MUST check three boxes: Eye Pro, Face Pro, Concealed Holster.

The Countdown: Exactly 1 minute before the strike, the screen locks into a ticking countdown.

The Strike: At 00:00, the app chimes and flashes visually.

The Aftermath (+30s): The clock shows "ACTIVE FIRE" for 30 seconds.

Resolution: Admin steps in via the Admin Dashboard and selects: "Winner A", "Winner B", "Yielded (Winner)", or "Tie (Double Elim)".

C. Admin Operations

Setup: Create a Tournament (Date, Time, Location, House Rules).

Prizes: Configure public prize listings (1st, 2nd, Best Draw, etc.).

Overrides: Force-assign a challenge between two players, pause the clock for safety, or instantly disqualify a player.

6. Database Schema (Firestore)

/tournaments/{id}

details: { date, time, location, status, rules }

prizes: [{ title, description }]

/profiles/{uid}

personal: { name, nickname, photoURL, handPreference, characterAlign }

status: "alive" | "eliminated" | "disqualified"

stats: { joinedAt (Timestamp), lastMatchTime (Timestamp), matchesPlayed }

isAdmin: boolean

/matches/{id}

participants: { challengerId, defenderId }

timing: { scheduledTime, warningTime }

status: "scheduled" | "warning" | "active" | "resolved" | "cancelled"

result: { winnerId (or "tie"/"yield"), logMessage } // logMessage feeds the Town Crier
