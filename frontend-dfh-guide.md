# Справочник по DTO и API для фронтенда

## Что такое DTO

**DTO (Data Transfer Object)** — объект, который фронтенд получает от бэка или отправляет в запросе.

Проще говоря:
- **Entity** — объект базы данных
- **DTO** — объект для обмена через HTTP

Фронтенд должен работать именно с DTO.

---

## Общая логика

### DTO, которые бэк **отдаёт**
Обычно это:
- короткие DTO для списков
- полные DTO для страницы одного объекта

### DTO, которые бэк **принимает**
Обычно это:
- DTO на создание (`Create...DTO`)
- DTO на обновление (`Update...DTO`)
- DTO на действие (`Join...DTO`, `Remove...DTO`, `ChangePasswordDTO`)

---

# USER

## `UserProfileDTO`
Полный профиль пользователя.

### Поля
- `userId` — id пользователя
- `username` — никнейм
- `email` — email; обычно отдаётся только владельцу профиля
- `role` — роль (`PLAYER`, `ORGANIZER`, `ADMIN`)
- `country` — страна
- `enabled` — активен ли пользователь
- `imageUrl` — ссылка на аватар
- `createdAt` — дата регистрации
- `owner` — владелец ли текущий пользователь этого профиля
- `games` — список статистики по играм

### Где используется
- `GET /api/users/{id}`
- страница `/profile`
- страница `/profile/{id}`

---

## `UserGameStatsDTO`
Статистика пользователя по одной игре.

### Поля
- `gameTypeId` — id игры
- `gameName` — название игры
- `totalMatches` — количество матчей
- `totalWins` — количество побед
- `winRate` — винрейт в процентах

### Совместимость
Для старого фронта DTO также отдаёт совместимые поля:
- `matchCount`
- `winPercent`

### Где используется
- внутри `UserProfileDTO`
- блок статистики в профиле

---

## `ShortUserDTO`
Короткая карточка пользователя.

### Поля
- `id`
- `username`
- `role`
- `country`
- `imageUrl`

### Где используется
- поиск игроков
- приглашения
- списки пользователей

---

## `CreateUserDTO`
Создание пользователя.

### Поля
- `username`
- `email`
- `password`
- `country`
- `imageUrl`

---

## `UpdateUserDTO`
Обновление профиля пользователя.

### Поля
- `username`
- `email`
- `country`
- `imageUrl`

---

## `ChangePasswordDTO`
Смена пароля.

### Поля
- `currentPassword`
- `newPassword`

### Где используется
- `POST /api/users/change-password`

---

## `AuthorizationUserDTO`
DTO для авторизации.

### Поля
- `login` — username или email
- `password`

---

## USER API

### Публичные запросы
- `GET /api/users/{id}` — получить профиль пользователя
- `GET /api/users/search?query=...` — поиск пользователей по никнейму

### Защищённые запросы
- `PUT /api/users/{id}` — обновить профиль по id
- `PUT /api/users/update` — обновить текущего пользователя
- `POST /api/users/avatar` — обновить аватар
- `DELETE /api/users/avatar` — сбросить аватар
- `POST /api/users/change-password` — сменить пароль

---

# TEAM

## `TeamShortDTO`
Короткая карточка команды.

### Поля
- `id`
- `name`
- `captainUsername`
- `gameTypeName`
- `imageUrl`
- `currentMembersCount`
- `maxMembersCount`

### Где используется
- `GET /api/teams`
- `GET /api/teams/my`
- список команд для выбора в турнире

---

## `TeamMemberDTO`
Один участник команды.

### Поля
- `userId`
- `username`
- `role`
- `country`
- `imageUrl`
- `joinedAt`

---

## `TeamFullDTO`
Полная информация о команде.

### Поля
- `id`
- `name`
- `captainUsername`
- `captainId`
- `gameTypeId`
- `gameTypeName`
- `imageUrl`
- `createdAt`
- `owner` — капитан ли текущий пользователь
- `member` — состоит ли текущий пользователь в команде
- `currentMembersCount`
- `maxMembersCount`
- `members` — список участников

### Где используется
- `GET /api/teams/{id}`

---

## `CreateTeamDTO`
Создание команды.

### Поля
- `name`
- `gameTypeId`
- `imageUrl`

---

## `AddTeamMemberDTO`
Прямое добавление участника капитаном.

### Поля
- `userId`

---

## `InviteTeamMemberDTO`
Приглашение пользователя в команду.

### Поля
- `userId`

---

## `RemoveTeamMemberDTO`
Удаление участника из команды капитаном.

### Поля
- `userId`

### Где используется
- `DELETE /api/teams/{id}/members`

---

## TEAM API

- `GET /api/teams` — список всех команд
- `GET /api/teams/my` — мои команды
- `GET /api/teams/{id}` — полная информация о команде
- `GET /api/teams/{id}/members` — состав команды
- `POST /api/teams` — создать команду
- `POST /api/teams/{id}/members` — добавить участника
- `DELETE /api/teams/{id}/members` — удалить участника
- `POST /api/teams/{id}/leave` — выйти из команды
- `POST /api/teams/{id}/invite` — пригласить пользователя
- `POST /api/teams/invite/{notificationId}/accept` — принять приглашение
- `POST /api/teams/invite/{notificationId}/decline` — отклонить приглашение

---

# TOURNAMENT

## `TournamentShortDTO`
Короткая карточка турнира.

### Поля
- `id`
- `title`
- `status`
- `participantType` — `SOLO` или `TEAM`
- `access` — `OPEN` или `INVITE`
- `gameTypeId`
- `gameName`
- `organizerUsername`
- `currentParticipantsCount`
- `maxParticipants`
- `imageUrl`

### Где используется
- общий список турниров
- мои турниры
- поиск турниров

---

## `TournamentFullDTO`
Полная информация о турнире.

### Поля
- `id`
- `title`
- `description`
- `participantType`
- `access`
- `status`
- `gameTypeId`
- `gameName`
- `gameCode`
- `organizerUsername`
- `startDate`
- `registrationDeadline`
- `maxParticipants`
- `minParticipants`
- `currentParticipantsCount`
- `createdAt`
- `imageUrl`
- `owner`

### Где используется
- `GET /api/tournaments/{id}`

---

## `CreateTournamentDTO`
Создание турнира.

### Поля
- `title`
- `description`
- `participantType`
- `access`
- `gameTypeId`
- `status`
- `startDate`
- `registrationDeadline`
- `maxParticipants`
- `minParticipants`
- `imageUrl`

---

## `UpdateTournamentDTO`
Редактирование турнира.

### Поля
- `title`
- `description`
- `participantType`
- `access`
- `gameTypeId`
- `status`
- `startDate`
- `registrationDeadline`
- `maxParticipants`
- `minParticipants`
- `imageUrl`

---

## `JoinSoloTournamentDTO`
Регистрация игрока в соло-турнир.

### Поля
- `tournamentId`

### Где используется
- `POST /api/tournaments/join/solo`

---

## `JoinTeamTournamentDTO`
Регистрация команды в командный турнир.

### Поля
- `tournamentId`
- `teamId`

### Где используется
- `POST /api/tournaments/join/team`

---

## TOURNAMENT API

- `GET /api/tournaments` — список турниров
- `GET /api/tournaments/{id}` — один турнир
- `GET /api/tournaments/my` — мои турниры
- `GET /api/tournaments/status/{status}` — турниры по статусу
- `GET /api/tournaments/game/{gameTypeId}` — турниры по игре
- `GET /api/tournaments/search?title=...` — поиск по названию
- `GET /api/tournaments/{id}/my-eligible-teams` — команды текущего капитана, подходящие для турнира
- `POST /api/tournaments` — создать турнир
- `PUT /api/tournaments/{id}` — обновить турнир
- `POST /api/tournaments/join/solo` — вступить в соло-турнир
- `POST /api/tournaments/join/team` — вступить командой в турнир
- `POST /api/tournaments/{id}/start` — стартовать турнир и сгенерировать сетку

---

# MATCH

## `MatchDTO`
Универсальный DTO матча.

### Поля
- `id`
- `matchType` — `SOLO` или `TEAM`
- `tournamentId`
- `tournamentTitle`
- `roundNumber`
- `status`
- `scheduledAt`
- `nextMatchId`
- `participant1Id`
- `participant1Name`
- `participant2Id`
- `participant2Name`
- `winnerId`
- `winnerName`
- `owner`

### Где используется
- `GET /api/matches/tournament/{tournamentId}`
- `GET /api/matches/my`
- `GET /api/matches/solo/{id}`
- `GET /api/matches/team/{id}`

---

## `UpdateSoloMatchResultDTO`
Обновление результата соло-матча.

### Поля
- `winnerUserId`
- `status` — опционально, по умолчанию бэк ставит `FINISHED`

### Где используется
- `POST /api/matches/solo/{id}/result`
- `PUT /api/matches/solo/{id}/result`

---

## `UpdateTeamMatchResultDTO`
Обновление результата командного матча.

### Поля
- `winnerTeamId`
- `status` — опционально, по умолчанию бэк ставит `FINISHED`

### Где используется
- `POST /api/matches/team/{id}/result`
- `PUT /api/matches/team/{id}/result`

---

## MATCH API

- `GET /api/matches/my` — мои матчи
- `GET /api/matches/tournament/{tournamentId}` — матчи турнира
- `GET /api/matches/solo/{id}` — соло-матч
- `GET /api/matches/team/{id}` — командный матч
- `POST /api/matches/solo/{id}/result` — обновить результат соло-матча
- `PUT /api/matches/solo/{id}/result` — обновить результат соло-матча
- `POST /api/matches/team/{id}/result` — обновить результат командного матча
- `PUT /api/matches/team/{id}/result` — обновить результат командного матча

---

# NOTIFICATION

## `NotificationDTO`
Уведомление пользователя.

### Поля
- `id`
- `message`
- `teamId`
- `teamName`
- `status`
- `type`
- `createdAt`

### Где используется
- `GET /api/notifications/my`
- `GET /api/notifications/my/pending`
- `GET /api/notifications/{id}`

---

## `CreateNotificationDTO`
Создание уведомления вручную.

### Поля
- `userId`
- `message`
- `teamId`
- `teamName`
- `type`
- `status`

---

## `UpdateNotificationDTO`
Обновление статуса уведомления.

### Поля
- `status`

---

# GAMETYPE

## `GameTypeDTO`
Полная информация о типе игры.

### Поля
- `id`
- `name`
- `code`
- `description`
- `isActive`
- `imageUrl`
- `maxPlayers`

## `CreateGameTypeDTO`
Создание типа игры.

### Поля
- `name`
- `code`
- `description`
- `isActive`
- `imageUrl`
- `maxPlayers`

## `UpdateGameTypeDTO`
Редактирование типа игры.

### Поля
- `name`
- `code`
- `description`
- `isActive`
- `imageUrl`
- `maxPlayers`

---

# Что нового в бэке

## Профиль и пользователи
- Добавлен публичный профиль `/profile/{id}`.
- Добавлена дата регистрации в `UserProfileDTO`.
- Добавлена подробная статистика по играм.
- Добавлен поиск игроков `GET /api/users/search?query=...`.
- Добавлены совместимые endpoints для профиля:
  - `PUT /api/users/update`
  - `POST /api/users/avatar`
  - `DELETE /api/users/avatar`
  - `POST /api/users/change-password`

## Команды
- Добавлен список всех команд `GET /api/teams`.
- Добавлено удаление участника из команды.
- Добавлен выход из команды.
- Карточки команд расширены числом участников и типом игры.

## Турниры
- Добавлено вступление в турнир для игрока и команды.
- Добавлен список доступных команд текущего капитана для турнирной регистрации.
- Добавлен старт турнира и генерация сетки.
- При старте турнира создаются матчи по дереву и обрабатываются auto-bye.

## Матчи
- Добавлено обновление результата матча.
- Победитель автоматически передаётся в следующий матч.
- Турнир автоматически завершается после завершения всех матчей.
- В `MatchDTO` добавлен `nextMatchId`.

---

# Рекомендации для фронта

## Показ категорий / игр
Если строка с категориями или играми разваливает карточку:
- лучше ограничить показ на фронте
- например, выводить первые 2–3 значения и затем `+N`

Это лучше делать именно на фронте, а не отдельным специальным DTO.

## Показ игроков
Для выбора игроков / приглашений / поиска лучше использовать:
- `GET /api/users/search?query=...`
- и отображать `ShortUserDTO`

Это безопаснее и легче, чем тянуть полный профиль в списки.
