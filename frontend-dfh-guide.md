# Справочник по DFH для фронтенда

## Что такое DFH

**DFH = Data For HTTP**.

Это объект, который бэкенд:

* либо **отдаёт** фронтенду в ответе API,
* либо **принимает** от фронтенда в теле запроса.

Проще:

* **Entity** — объект базы данных
* **DFH** — объект для обмена по HTTP

Фронтенд работает только с `DFH`, а не с JPA entity.

---

## Как работать с DFH

### 1. Получение данных

Когда фронт делает `GET`, он получает `DFH`.

Примеры:

* `GET /api/users/{id}` → `UserDFH`
* `GET /api/tournaments` → `List<TournamentShortDFH>`
* `GET /api/teams/{id}` → `TeamFullDFH`

### 2. Отправка данных

Когда фронт делает `POST` или `PUT`, он обычно отправляет `Create...DFH` или `Update...DFH`.

Примеры:

* `POST /api/tournaments` ← `CreateTournamentDFH`
* `POST /api/teams` ← `CreateTeamDFH`
* `PUT /api/gametypes/{id}` ← `UpdateGameTypeDFH`

### 3. Основное правило

* `ShortDFH` — короткий объект для списков
* `FullDFH` — полный объект для страницы одного объекта
* `Create...DFH` — тело запроса на создание
* `Update...DFH` — тело запроса на изменение

---

## USER

### `UserDFH`

Полный объект пользователя для страницы профиля.

**Поля:**

* `userId` — id пользователя
* `username` — логин/ник
* `email` — email; обычно отдаётся только владельцу профиля
* `role` — роль пользователя (`PLAYER`, `ORGANIZER`, `ADMIN`)
* `country` — страна
* `enabled` — активен ли пользователь
* `imageUrl` — ссылка на аватар
* `owner` — владелец ли текущий пользователь этого профиля
* `games` — список игр пользователя

**Где использовать:**

* страница профиля
* личный кабинет
* публичный профиль

### `UserGameStatsDFH`

Одна игра в профиле пользователя.

**Поля:**

* `gameName` — название игры
* `matchCount` — количество матчей
* `winPercent` — процент побед

**Где использовать:**

* блок статистики по играм в профиле пользователя

---

## TOURNAMENT

### `TournamentShortDFH`

Короткий объект турнира для списков.

**Поля:**

* `id` — id турнира
* `title` — название турнира
* `status` — статус турнира
* `participantType` — тип участия (`SOLO`, `TEAM`)
* `gameName` — название игры
* `organizerUsername` — username организатора
* `imageUrl` — картинка турнира

**Где использовать:**

* список турниров
* мои турниры
* карточки турниров

### `TournamentFullDFH`

Полный объект турнира для страницы одного турнира.

**Поля:**

* `id`
* `title`
* `description`
* `participantType`
* `access`
* `status`
* `gameName`
* `gameCode`
* `organizerUsername`
* `startDate`
* `registrationDeadline`
* `maxParticipants`
* `createdAt`
* `imageUrl`
* `owner`

**Где использовать:**

* страница турнира
* страница управления турниром

### `CreateTournamentDFH`

Тело запроса на создание турнира.

**Поля:**

* `title`
* `description`
* `participantType`
* `access`
* `gameTypeId`
* `status`
* `startDate`
* `registrationDeadline`
* `maxParticipants`
* `imageUrl`

**Где использовать:**

* форма создания турнира

---

## TEAM

### `TeamShortDFH`

Короткий объект команды для списков.

**Поля:**

* `id`
* `name`
* `captainUsername`
* `imageUrl`

**Где использовать:**

* список команд
* мои команды

### `TeamMemberDFH`

Один участник команды.

**Поля:**

* `userId`
* `username`
* `role`
* `country`
* `imageUrl`
* `joinedAt`

**Где использовать:**

* состав команды
* таблица участников

### `TeamFullDFH`

Полный объект команды.

**Поля:**

* `id`
* `name`
* `captainUsername`
* `captainId`
* `imageUrl`
* `createdAt`
* `owner`
* `members`

**Где использовать:**

* страница команды
* страница управления командой

### `CreateTeamDFH`

Тело запроса на создание команды.

**Поля:**

* `name`
* `imageUrl`

**Где использовать:**

* форма создания команды

### `AddTeamMemberDFH`

Тело запроса на прямое добавление участника в команду.

**Поля:**

* `userId`

**Где использовать:**

* только если поддерживается прямое добавление участника без приглашения

### `InviteTeamMemberDFH`

Тело запроса на приглашение пользователя в команду.

**Поля:**

* `userId`

**Где использовать:**

* кнопка/форма “пригласить в команду”

---

## MATCH

### `MatchDFH`

Универсальный объект матча для фронта. Используется и для `SOLO`, и для `TEAM` матчей.

**Поля:**

* `id`
* `matchType` — `SOLO` или `TEAM`
* `tournamentId`
* `tournamentTitle`
* `roundNumber`
* `status`
* `scheduledAt`
* `participant1Id`
* `participant1Name`
* `participant2Id`
* `participant2Name`
* `winnerId`
* `winnerName`
* `owner`

**Где использовать:**

* список матчей турнира
* мои матчи
* карточка матча
* страница матча

### `UpdateSoloMatchResultDFH`

Тело запроса на обновление результата solo-матча.

**Поля:**

* `winnerUserId`
* `status`

**Где использовать:**

* форма внесения результата solo-матча

### `UpdateTeamMatchResultDFH`

Тело запроса на обновление результата командного матча.

**Поля:**

* `winnerTeamId`
* `status`

**Где использовать:**

* форма внесения результата team-матча

---

## GAMETYPE

### `GameTypeDFH`

Полный объект игры.

**Поля:**

* `id`
* `name`
* `code`
* `description`
* `isActive`
* `imageUrl`
* `maxPlayers`

**Где использовать:**

* список игр
* выбор игры в форме турнира
* карточки игр

### `CreateGameTypeDFH`

Тело запроса на создание игры.

**Поля:**

* `name`
* `code`
* `description`
* `isActive`
* `imageUrl`
* `maxPlayers`

**Где использовать:**

* форма создания игры

### `UpdateGameTypeDFH`

Тело запроса на обновление игры.

**Поля:**

* `name`
* `description`
* `isActive`
* `imageUrl`
* `maxPlayers`

**Где использовать:**

* форма редактирования игры

---

## NOTIFICATION

### `NotificationDFH`

Объект уведомления пользователя.

**Поля:**

* `id`
* `message`
* `teamId`
* `teamName`
* `type`
* `status`
* `createdAt`

**Где использовать:**

* список уведомлений
* приглашения в команду

---

## Как фронту понимать поле `owner`

Если `owner = true`, значит текущий пользователь владеет объектом.

Примеры:

* свой профиль
* своя команда
* свой турнир
* свой доступ к управлению матчами

### Что можно делать, если `owner = true`

* показывать кнопки редактирования
* показывать кнопки управления
* показывать формы создания/изменения данных

Если `owner = false`, объект доступен только для просмотра.

---

## Как фронту работать со списками

### Список объектов

Если API возвращает массив, значит это обычно список `ShortDFH` или список вложенных объектов.

Примеры:

* `List<TournamentShortDFH>`
* `List<TeamShortDFH>`
* `List<NotificationDFH>`
* `UserDFH.games` → `List<UserGameStatsDFH>`
* `TeamFullDFH.members` → `List<TeamMemberDFH>`

---

## Рекомендуемый подход на фронте

### Для списков

Использовать `ShortDFH`.

### Для страниц деталей

Использовать `FullDFH`.

### Для форм

Отправлять `Create...DFH` или `Update...DFH`.

### Для прав доступа в интерфейсе

Опираться на `owner` и, если нужно, на `role`.

---

## Короткая шпаргалка

### User

* `UserDFH` — профиль пользователя
* `UserGameStatsDFH` — статистика по одной игре

### Tournament

* `TournamentShortDFH` — карточка турнира
* `TournamentFullDFH` — полный турнир
* `CreateTournamentDFH` — создание турнира

### Team

* `TeamShortDFH` — карточка команды
* `TeamFullDFH` — полная команда
* `TeamMemberDFH` — участник команды
* `CreateTeamDFH` — создание команды
* `InviteTeamMemberDFH` — приглашение в команду
* `AddTeamMemberDFH` — прямое добавление участника

### Match

* `MatchDFH` — универсальный матч
* `UpdateSoloMatchResultDFH` — обновление solo-матча
* `UpdateTeamMatchResultDFH` — обновление team-матча

### GameType

* `GameTypeDFH` — игра
* `CreateGameTypeDFH` — создание игры
* `UpdateGameTypeDFH` — обновление игры

### Notification

* `NotificationDFH` — уведомление
