# DTO guide for frontend

## Общая идея

DTO — это объекты, которыми фронт и бэк обмениваются по HTTP. Entity в ответах фронту не используются.

Правило простое:
- `GET` обычно возвращает DTO
- `POST` и `PUT` обычно принимают `Create...DTO`, `Update...DTO` или специализированный DTO

## Auth / session

### `AuthorizationUserDTO`
Используется для авторизации.

Поля:
- `login` — можно передавать **username или email**
- `password`

Фактические endpoints в проекте сейчас:
- `POST /signin` — форма логина
- `POST /api/auth/login` — ajax логин
- `GET /api/auth/check` — проверка текущей сессии
- `POST /api/auth/logout` — logout

### Ответ `/api/auth/check`
Возвращает JSON вида:
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "PLAYER",
    "imageUrl": "john.jpg"
  }
}
```

## User DTO

### `ShortUserDTO`
Короткое представление пользователя.

Поля:
- `id`
- `username`
- `role`
- `country`
- `imageUrl`

### `CreateUserDTO`
Создание пользователя через API.

Поля:
- `username`
- `email`
- `password`
- `country`
- `imageUrl`

### `UpdateUserDTO`
Обновление профиля.

Поля:
- `username`
- `email`
- `country`
- `imageUrl`

### `ChangePasswordDTO`
Смена пароля текущего пользователя.

Поля:
- `currentPassword`
- `newPassword`

### `UserGameStatsDTO`
Статистика пользователя по одной игре.

Поля:
- `gameName`
- `matchCount`
- `winPercent`

### `UserProfileDTO`
Полный DTO профиля.

Поля:
- `userId`
- `username`
- `email` — отдается владельцу профиля
- `role`
- `country`
- `enabled`
- `imageUrl`
- `createdAt`
- `owner`
- `games` — список `UserGameStatsDTO`

### User endpoints
- `GET /api/users/{id}` → `UserProfileDTO`
- `POST /api/users` ← `CreateUserDTO`
- `PUT /api/users/{id}` ← `UpdateUserDTO`
- `PUT /api/users/update` ← `UpdateUserDTO` для текущего пользователя
- `POST /api/users/avatar` ← `UpdateUserDTO` (`imageUrl`)
- `DELETE /api/users/avatar`
- `POST /api/users/change-password` ← `ChangePasswordDTO`

## Tournament DTO

### `TournamentShortDTO`
Для карточек и списков.

Поля:
- `id`
- `title`
- `status`
- `participantType`
- `gameName`
- `organizerUsername`
- `imageUrl`

### `TournamentFullDTO`
Для страницы турнира.

Поля:
- `id`
- `title`
- `description`
- `participantType`
- `access`
- `status`
- `gameName`
- `gameCode`
- `organizerUsername`
- `startDate`
- `registrationDeadline`
- `minParticipants`
- `maxParticipants`
- `createdAt`
- `imageUrl`
- `owner`

### `CreateTournamentDTO`
Поля:
- `title`
- `description`
- `participantType`
- `access`
- `gameTypeId`
- `status`
- `startDate`
- `registrationDeadline`
- `minParticipants`
- `maxParticipants`
- `imageUrl`

### `UpdateTournamentDTO`
Та же структура, что и у `CreateTournamentDTO`, но все поля опциональны.

### Tournament endpoints
- `GET /api/tournaments`
- `GET /api/tournaments/{id}`
- `GET /api/tournaments/my`
- `GET /api/tournaments/status/{status}`
- `GET /api/tournaments/game/{gameTypeId}`
- `GET /api/tournaments/search?title=...`
- `POST /api/tournaments`
- `PUT /api/tournaments/{id}`

## Team DTO

### `TeamShortDTO`
Поля:
- `id`
- `name`
- `captainUsername`
- `imageUrl`

### `TeamMemberDTO`
Поля:
- `userId`
- `username`
- `role`
- `country`
- `imageUrl`
- `joinedAt`

### `TeamFullDTO`
Поля:
- `id`
- `name`
- `captainUsername`
- `captainId`
- `imageUrl`
- `createdAt`
- `owner`
- `currentMembersCount`
- `maxMembersCount`
- `members`

### `CreateTeamDTO`
Поля:
- `name`
- `gameTypeId`
- `imageUrl`

### `AddTeamMemberDTO`
Поля:
- `userId`

### `InviteTeamMemberDTO`
Поля:
- `userId`

### Team endpoints
- `GET /api/teams/my`
- `GET /api/teams/{id}`
- `GET /api/teams/{id}/members`
- `POST /api/teams`
- `POST /api/teams/{id}/members`
- `POST /api/teams/{id}/invite`
- `POST /api/teams/invite/{notificationId}/accept`
- `POST /api/teams/invite/{notificationId}/decline`

## Match DTO

### `MatchDTO`
Универсальный DTO для solo/team матчей.

Поля:
- `id`
- `matchType`
- `tournamentId`
- `tournamentTitle`
- `roundNumber`
- `status`
- `scheduledAt`
- `participant1Id`
- `participant1Name`
- `participant2Id`
- `participant2Name`
- `winnerId`
- `winnerName`
- `owner`

### `UpdateSoloMatchResultDTO`
Поля:
- `winnerUserId`
- `status`

### `UpdateTeamMatchResultDTO`
Поля:
- `winnerTeamId`
- `status`

## GameType DTO

### `GameTypeDTO`
Поля:
- `id`
- `name`
- `code`
- `description`
- `isActive`
- `imageUrl`
- `maxPlayers`

### `CreateGameTypeDTO`
Поля:
- `name`
- `code`
- `description`
- `isActive`
- `imageUrl`
- `maxPlayers`

### `UpdateGameTypeDTO`
Та же структура, поля опциональны.

## Notification DTO

### `NotificationDTO`
Поля:
- `id`
- `message`
- `teamId`
- `teamName`
- `type`
- `status`
- `createdAt`

## Что важно для фронта

- Если нужен список — обычно используется `Short...DTO`
- Если нужна страница сущности — обычно `...FullDTO` или `UserProfileDTO`
- Если в ответе есть `owner`, именно по нему лучше решать, показывать ли кнопки редактирования
- Для логина можно в одно поле передавать и email, и username
