# Ghost-Driver Dashboard PRD

## Original Problem Statement
Készíts egy modern, ultra-minimalista, sötét tónusú (fekete-fehér) Web Dashboard kezelőfelületet egy kiberbiztonsági szoftverhez (Ghost-driver). A technológiai stílus legyen 'industrial' és 'stealth' - angelcore/darkcore/etherealcore vibe-bal.

## User Personas
1. **Regular User**: Kiberbiztonsági szoftver felhasználó aki konfigurálni szeretné a driver beállításait
2. **Administrator**: Teljes hozzáférés a rendszerhez, felhasználók kezelése, invite kódok generálása

## Core Requirements (Static)
- JWT alapú autentikáció (email/password)
- Invite key alapú regisztráció (GHOST-XXXX-XXXX formátum)
- Admin jogosultság speciális admin invite key-vel (ADMIN-XXXX-XXXX)
- Dashboard status cards és live stats
- Config page toggles és sliders
- Admin panel user management, invite requests, killswitch

## What's Been Implemented (2024-03-15)

### Backend (FastAPI + MongoDB)
- ✅ JWT autentikáció (login/register)
- ✅ User model (admin flag, subscription, config)
- ✅ Invite key rendszer (GHOST-XXXX-XXXX)
- ✅ Invite request rendszer (approve/reject)
- ✅ User config CRUD (cloud sync) - **EXTENDED**
  - ESP: enabled, color, sound, head_circle, snap_line
  - RCS: enabled, strength
  - Triggerbot: enabled, delay (50-500ms), key binding
  - General: smoothing, fov
- ✅ Dashboard status & live stats endpoints
- ✅ Admin: user management, ban/unban, extend subscription
- ✅ Admin: invite key generation
- ✅ Global killswitch

### Frontend (React + Tailwind + Framer Motion)
- ✅ Login page (angelcore/darkcore design)
- ✅ Register page (invite key kötelező)
- ✅ Request invite page
- ✅ Dashboard (status cards, live stats, activity log)
- ✅ Config page - **FINAL VERSION**
  - ESP modul: toggle + color picker, Sound ESP (szinezhető), Head Circle, Snap Line
  - RCS modul: toggle + strength slider (0-100%)
  - Triggerbot modul: toggle + delay slider (50-500ms), key binding
  - Radar modul: toggle + color picker
  - Grenade Prediction modul: toggle + color picker
  - Bomb Timer modul: toggle + color picker
  - Spectator List modul: toggle + color picker
  - ~~Fine Tuning~~ (removed)
  - Cloud Sync gomb
- ✅ Community page - **FINAL VERSION**
  - Upcoming Features: Discord Server, Leaderboard System (In-Game Overlay, Auto-Update removed)
  - Community Guidelines
  - Submit a Suggestion form (csak admin látja az Admin Panelben)
- ✅ Support page (FAQ accordion)
- ✅ Admin panel - **EXTENDED**
  - Users tab (user management, ban/unban, extend subscription)
  - Requests tab (invite requests approve/reject)
  - Invite Keys tab (generate/copy keys)
  - **Suggestions tab (NEW)** - view/review/delete user suggestions
  - Global killswitch control
- ✅ Responsive design (mobile sidebar sheet)
- ✅ Cinzel + JetBrains Mono fonts

### Design
- ✅ Industrial Stealth x Dark Angelcore aesthetic
- ✅ Pure black (#000000) background
- ✅ White text, gray borders (#1A1A1A)
- ✅ Glass-morphism cards
- ✅ Green/red status indicators
- ✅ Smooth animations (framer-motion)

## Test Results
- Backend: 100% (17/17 API endpoints working)
- Frontend: 85% (core features working)

## Prioritized Backlog

### P0 (Critical) - Completed
- [x] Authentication system
- [x] Dashboard with status
- [x] Config page with toggles/sliders
- [x] Admin panel

### P1 (High Priority)
- [ ] Email notification when invite request approved
- [ ] Password reset functionality
- [ ] Session refresh token
- [ ] User activity logging

### P2 (Medium Priority)
- [ ] Discord/Telegram community integration
- [ ] Support ticket system
- [ ] User profile settings
- [ ] Two-factor authentication

### P3 (Low Priority)
- [ ] Dark/light theme toggle
- [ ] Localization (multi-language)
- [ ] Export user data

## Next Tasks
1. Implement email notifications for invite approvals
2. Add password reset flow
3. Improve mobile loading performance
4. Add user activity audit log
