# Backend audit and fixes

## What I fixed

### Auth / profile flow
- Kept session-based auth bridge through `SessionAuthenticationFilter`.
- Left login by **username or email** in `HomeController.findUserByLogin(...)`.
- Kept redirects to `/profile` because that page now resolves correctly.
- `ProfileController` no longer points to non-existing templates for `/my/tournaments`, `/my/matches`, `/notifications`; these routes now redirect to existing pages.

### User backend
- Added `createdAt` to `UserProfileDTO` so the profile page can render registration date.
- Expanded `UserService`:
  - create user
  - update own profile
  - update current user without explicit id
  - avatar update/reset
  - password change
- Added `ChangePasswordDTO`.
- Added compatibility endpoints in `UserApiController` used by the current frontend:
  - `PUT /api/users/update`
  - `POST /api/users/avatar`
  - `DELETE /api/users/avatar`
  - `POST /api/users/change-password`
- Kept existing REST endpoints:
  - `GET /api/users/{id}`
  - `POST /api/users`
  - `PUT /api/users/{id}`

### Team backend
- Team creation now requires `gameTypeId` and resolves `GameType` from DB.
- Team capacity is enforced using `GameType.maxPlayers`.
- `TeamFullDTO` includes:
  - `currentMembersCount`
  - `maxMembersCount`
- Invite acceptance and direct member add also validate team capacity.

### Notification consistency
- Unified invite type to `TEAM_INVITE` in backend logic.
- Updated `schema.sql` default notification type to `TEAM_INVITE`.

### Frontend/profile compatibility
- `profile.js` updated to work with current backend DTO/JSON responses:
  - uses `createdAt`
  - uses `/api/users/update`
  - works with avatar/password endpoints
  - no longer depends on missing `bio`, `rating`, `totalWins`, `totalTournaments` fields
- `login.html` cleaned up from duplicate CSS/JS includes.

### DTO guide
- Rewrote `frontend-dfh-guide.md` into an actual **DTO guide** with current DTO names and endpoints.

## Important notes
- I could not run a full Maven build in the container because the wrapper needs network access to fetch Maven.
- The most important backend mismatches were resolved by aligning DTOs, user endpoints, profile page flow, and team capacity logic.
