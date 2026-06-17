Claude Code Execution Instructions: "The Quick and the Dead" App

1. Project Context

You are building a mobile-first, real-time web application for a live Airsoft quick-draw tournament. It features single-elimination survival mechanics, mandatory safety checklists, and perfectly synchronized countdown timers.

2. Technical Stack & Strict Constraints

Stack: Vite + React + Tailwind CSS + Firebase v10 (Auth, Firestore, Hosting).

Constraint 1 (FREE TIER ONLY): You MUST NOT write, suggest, or initialize Firebase Cloud Functions. We are restricted to the Spark Plan. All logic must be client-side, secured by firestore.rules.

Constraint 2 (READ LIMITS): We have a strict 50,000 document read limit per day. DO NOT sync countdown ticks via Firestore. Use a static scheduledTime timestamp in the database and calculate the live countdown locally on the client via requestAnimationFrame.

3. Implementation Steps

Execute this project sequentially. Ensure each step is fully functional and tested via the Firebase Local Emulator Suite before moving to the next.

Step 1: Scaffolding & Setup

Initialize a Vite React project.

Install Firebase, React Router, Tailwind CSS, and Lucide React.

Initialize the Firebase Local Emulator Suite (Auth, Firestore, Hosting).

Set up an aesthetically fitting Tailwind theme (sepia backgrounds, dark charcoal panels, blood red alerts).

Step 2: Database Rules & Emulation (firestore.rules)

Write strict rules.

Players can only read active data and update their own profile setup.

Only Admins (isAdmin == true) can resolve matches, disqualify players, or create tournaments.

Any active player can CREATE a match document (issue a challenge) if both players are currently "alive".

Step 3: Auth, Profiles & Drifters

Build the Email/Password Auth flow.

Build the Onboarding Screen (Name, Nickname, Photo upload to Base64 or standard URL, Handedness, Character Alignment).

Track joinedAt. Players joining after tournament start get a "Drifter" visual tag on their profile.

Step 4: The Time-Sync Hook (Critical)

Write a custom React hook useServerTimeOffset().

On app load, this hook should calculate the drift between local device time and Firebase server time.

Build the CountdownClock component. It must accept a scheduledTime timestamp, apply the server offset, and accurately render a local countdown that culminates in an audio/visual trigger exactly at zero.

Step 5: The Match State Machine & UI

Challenge UI: Build the "Active Roster" list. Allow players to click another player and hit "Call Out". No refusal logic—it immediately writes the match to Firestore.

Safety Gate Modal: If a match enters the warning state (5 mins out), pop up a modal for the participants. They MUST check off three safety checkboxes (Eye Pro, Face Pro, Holster) before they can see the 1-minute countdown screen.

The Town Crier (Kill Feed): Build a scrolling ticker component that listens to recently resolved matches and generates a flavor text announcement.

Step 6: Board & Boot Hill

Tournament Board: Display "Alive" players. Highlight players whose lastMatchTime is older than 45 minutes (The Danger Zone).

Boot Hill: A separate tab/view showing eliminated and disqualified players, displaying how they lost.

Step 7: Admin Dashboard

Build a protected route for Admins.

Needs controls to: Create the tournament (Date/Time/Location/Prizes), Force-assign challenges, adjust clocks, and resolve active matches (Winner A, Winner B, Tie/Double-Elim, Yield).

When instructed to begin, read design.md for gameplay context, then start with Step 1.

I have provided you two files. 

design.md - contains the design of the webapp.

characters.md - contains details about the movie that would be helpful.
