# Что было добавлено и изменено в бэке

## Пользователи и профиль
- Добавлен публичный маршрут `/profile/{id}` для просмотра чужого профиля.
- `UserProfileDTO` расширен датой регистрации `createdAt`.
- Добавлена подробная статистика по играм через `UserGameStatsDTO`.
- Добавлен поиск игроков по никнейму: `GET /api/users/search?query=...`.
- Добавлены совместимые endpoints для фронта профиля:
  - `PUT /api/users/update`
  - `POST /api/users/avatar`
  - `DELETE /api/users/avatar`
  - `POST /api/users/change-password`
- Добавлен `ChangePasswordDTO`.
- При изменении ника обновляется `username` в сессии.

## Команды
- Добавлен `RemoveTeamMemberDTO`.
- Добавлены методы удаления участника из команды и выхода из команды.
- Добавлен endpoint `GET /api/teams` для списка всех команд.
- Расширены `TeamShortDTO` и `TeamFullDTO`:
  - тип игры команды,
  - текущее количество участников,
  - максимум участников,
  - флаг `member`.
- Логика приглашений и принятия приглашений сохранена.

## Турниры
- Добавлены `JoinSoloTournamentDTO` и `JoinTeamTournamentDTO`.
- Добавлены сервисные методы регистрации игрока и команды в турнир.
- Для командной регистрации добавлена проверка:
  - команда подходит по игре,
  - команда полностью заполнена,
  - регистрировать команду может только капитан.
- Добавлен endpoint `GET /api/tournaments/{id}/my-eligible-teams`.
- Добавлен старт турнира: `POST /api/tournaments/{id}/start`.
- Реализована генерация турнирной сетки при старте турнира:
  - все матчи создаются сразу,
  - строится дерево по раундам,
  - поддерживаются пустые слоты и auto-bye.
- Добавлен подсчёт текущих участников в `TournamentShortDTO` и `TournamentFullDTO`.

## Матчи
- `player1Id` и `team1Id` в матчах сделаны nullable на уровне entity и schema, чтобы можно было создавать пустые слоты сетки.
- `MatchDTO` расширен полем `nextMatchId`.
- Обновлены DTO изменения результата матча.
- Добавлена логика:
  - проверка владельца турнира,
  - обновление результата только для `IN_PROGRESS` матчей,
  - автоматическая передача победителя в следующий матч,
  - автоматическое завершение турнира после завершения всех матчей.
- Result endpoints теперь работают и через `POST`, и через `PUT`.

## Участники турнира
- В entity `TournamentSoloParticipant` и `TournamentTeamParticipant` добавлено поле `parallel`.
- В репозитории участников турниров добавлены методы:
  - `existsBy...`
  - `countBy...`
  - `findByTournamentIdOrderBySeedAsc(...)`


## Уведомления
- Добавлены `CreateNotificationDTO` и `UpdateNotificationDTO`.
- `NotificationService` расширен получением всех и pending-уведомлений, чтением одного уведомления и обновлением статуса.
- `NotificationApiController` теперь поддерживает:
  - `GET /api/notifications/my`
  - `GET /api/notifications/my/pending`
  - `GET /api/notifications/{id}`
  - `POST /api/notifications`
  - `PUT /api/notifications/{id}`

## Прочее
- В `schema.sql` исправлен дефолтный тип уведомления на `TEAM_INVITE`.
- Обновлён справочник DTO `frontend-dfh-guide.md` на русском языке.

## Что ещё можно добавить позже
- отдельный DTO и endpoint для передачи капитанства в команде;
- `slotInNextMatch` в матчах для полностью детерминированного дерева;
- отдельный API для списка участников турнира в виде готового дерева;
- улучшенную фильтрацию и пагинацию поиска игроков.
