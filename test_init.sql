INSERT INTO "User" ("id", "username", "email", "passwordHash", "role", "country", "enabled", "createdAt") VALUES
(1, 'john_doe', 'john@example.com', '72bff4b3150a585ee51f75faf2b297cf925249c734df90131ee1c0e45433393e', 'PLAYER', 'USA', true, '2024-01-15 10:00:00'),      -- пароль: password123
(2, 'jane_smith', 'jane@example.com', 'a4977b08484badd028211bfb1fe5dcf815aacf981bc31d7e68bdf6d5d8daa65f', 'PLAYER', 'Canada', true, '2024-01-20 11:30:00'),    -- пароль: qwerty456
(3, 'pro_gamer', 'pro@example.com', 'df60bc926a3fe316bbab5005d7208671077a90164afc3202cca84de6b1b699e2', 'PLAYER', 'Sweden', true, '2024-02-01 09:15:00'),   -- пароль: pro789
(4, 'noob_master', 'noob@example.com', '88fa9a7bc90ee4fb8e19824917a97eb8290f5d936efd18ca69073f296058d3a4', 'PLAYER', 'Germany', true, '2024-02-10 14:45:00'),  -- пароль: noob321
(5, 'elite_sniper', 'elite@example.com', 'ecf82abd27b28d08774313e434fa491dc4fbc554bafbafbf88c0d62bf994acd4', 'PLAYER', 'USA', true, '2024-02-15 16:20:00'),    -- пароль: sniper654
(6, 'tournament_org1', 'org1@example.com', '0653c6a1b110de75c3e87cc63eda16b3db12c5293de831fcc171710a0f6a0a8d', 'ORGANIZER', 'UK', true, '2024-01-05 08:00:00'),  -- пароль: orgpass111
(7, 'tournament_org2', 'org2@example.com', '1ff64f247ad17e518ceae417e30ea4ab6a43100fd45e78bb4c3747852f899708', 'ORGANIZER', 'Germany', true, '2024-01-10 12:00:00'), -- пароль: orgpass222
(8, 'admin_user', 'admin@example.com', '524e307cc2cfd75726169e8c26d8be343ea1480fbb731d08892436e70d801652', 'ADMIN', 'USA', true, '2024-01-01 00:00:00');         -- пароль: admin000

-- 2. Типы игр
INSERT INTO "GameTypes" ("id", "name", "code", "description", "isActive") VALUES
(1, 'Dota 2', 'dota2', 'MOBA от Valve', true),
(2, 'Counter-Strike 2', 'cs2', 'Тактический шутер', true),
(3, 'League of Legends', 'lol', 'MOBA от Riot Games', true),
(4, 'Valorant', 'valorant', 'Геройский шутер', true),
(5, 'StarCraft II', 'sc2', 'RTS от Blizzard', false);

-- 3. Игры пользователей (рейтинги)
INSERT INTO "UserGames" ("gameId", "userId") VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
(2, 1), (2, 3), (2, 5),
(3, 2), (3, 4),
(4, 1), (4, 3), (4, 5);

-- 4. Команды
INSERT INTO "Team" ("id", "name", "createdAt", "captainId") VALUES
(1, 'Team Alpha', '2024-02-01 10:00:00', 1),
(2, 'Dragons', '2024-02-05 12:30:00', 2),
(3, 'Prodigy', '2024-02-10 15:45:00', 3),
(4, 'Underdogs', '2024-02-15 09:20:00', 4);

-- 5. Участники команд
INSERT INTO "TeamMembers" ("playerId", "teamId", "role", "joinedAt") VALUES
(1, 1, 'CAPTAIN', '2024-02-01 10:00:00'),
(2, 1, 'MEMBER', '2024-02-01 10:05:00'),
(2, 2, 'CAPTAIN', '2024-02-05 12:30:00'),
(5, 2, 'MEMBER', '2024-02-05 12:35:00'),
(3, 3, 'CAPTAIN', '2024-02-10 15:45:00'),
(1, 3, 'MEMBER', '2024-02-10 15:50:00'),
(4, 4, 'CAPTAIN', '2024-02-15 09:20:00'),
(5, 4, 'MEMBER', '2024-02-15 09:25:00');

-- 6. Турниры
INSERT INTO "Tournament" ("id", "title", "description", "participantType", "access", "gameType", "status", "organizerId", "startDate", "registrationDeadline", "maxParticipants", "createdAt") VALUES
(1, 'Dota 2 Open Cup #1', 'Одиночный турнир для всех желающих', 'SOLO', 'OPEN', 1, 'REGISTRATION_OPEN', 6, '2025-03-15 14:00:00', '2025-03-10 23:59:59', 16, '2025-02-01 10:00:00'),
(2, 'CS2 Pro League', 'Пригласительный командный турнир', 'TEAM', 'INVITE', 2, 'IN_PROGRESS', 7, '2025-03-01 10:00:00', '2025-02-20 23:59:59', 8, '2025-01-15 12:00:00'),
(3, 'LoL Champion Cup', 'Одиночный турнир высокого уровня', 'SOLO', 'OPEN', 3, 'DRAFT', 6, '2025-04-20 16:00:00', '2025-04-15 23:59:59', 32, '2025-03-01 09:00:00'),
(4, 'Valorant Last Chance', 'Финальный турнир сезона', 'SOLO', 'OPEN', 4, 'FINISHED', 7, '2025-02-10 18:00:00', '2025-02-05 23:59:59', 8, '2025-01-20 14:00:00');

-- 7. Участники соло-турниров
INSERT INTO "TournamentSoloParticipant" ("tournamentId", "playerProfileId", "status", "seed", "joinedAt", "finalPlace") VALUES
(1, 1, 'REGISTERED', 1, '2025-02-05 12:00:00', NULL),
(1, 2, 'REGISTERED', 2, '2025-02-06 14:30:00', NULL),
(1, 3, 'REGISTERED', 3, '2025-02-07 09:15:00', NULL),
(1, 4, 'REGISTERED', 4, '2025-02-08 20:00:00', NULL),
(1, 5, 'REGISTERED', 5, '2025-02-09 11:45:00', NULL),
(4, 1, 'FINISHED', 1, '2025-01-25 10:00:00', 2),
(4, 2, 'FINISHED', 2, '2025-01-25 11:00:00', 4),
(4, 3, 'FINISHED', 3, '2025-01-26 09:00:00', 1),
(4, 4, 'FINISHED', 4, '2025-01-26 14:00:00', 3),
(4, 5, 'FINISHED', 5, '2025-01-27 16:30:00', 5);

-- 8. Участники командных турниров
INSERT INTO "TournamentTeamParticipant" ("tournamentId", "teamId", "status", "seed", "joinedAt", "finalPlace") VALUES
(2, 1, 'IN_PROGRESS', 1, '2025-02-21 10:00:00', NULL),
(2, 2, 'IN_PROGRESS', 2, '2025-02-21 10:00:00', NULL),
(2, 3, 'IN_PROGRESS', 3, '2025-02-21 10:00:00', NULL),
(2, 4, 'IN_PROGRESS', 4, '2025-02-21 10:00:00', NULL);

-- 9. Соло-матчи (для завершённого турнира #4)
INSERT INTO "MatchSolo" ("id", "tournamentId", "roundNumber", "player1Id", "player2Id", "winnerPlayerId", "status", "scheduledAt", "nextMatchId") VALUES
(1, 4, 1, 1, 2, 1, 'FINISHED', '2025-02-10 18:00:00', 5),
(2, 4, 1, 3, 4, 3, 'FINISHED', '2025-02-10 18:00:00', 5),
(3, 4, 1, 5, NULL, NULL, 'CANCELLED', '2025-02-10 18:00:00', NULL),
(4, 4, 2, 1, 3, 3, 'FINISHED', '2025-02-11 18:00:00', 6),
(5, 4, 2, 2, 4, 2, 'FINISHED', '2025-02-11 18:00:00', 6),
(6, 4, 3, 3, 1, 3, 'FINISHED', '2025-02-12 18:00:00', NULL),
(7, 4, 3, 2, 4, 2, 'FINISHED', '2025-02-12 16:00:00', NULL);

-- 10. Командные матчи (турнир #2, в процессе)
INSERT INTO "MatchTeam" ("id", "tournamentId", "roundNumber", "team1Id", "team2Id", "winnerTeamId", "status", "scheduledAt", "nextMatchId") VALUES
(1, 2, 1, 1, 2, 1, 'FINISHED', '2025-03-01 10:00:00', 3),
(2, 2, 1, 3, 4, 3, 'FINISHED', '2025-03-01 13:00:00', 3),
(3, 2, 2, 1, 3, NULL, 'SCHEDULED', '2025-03-08 15:00:00', NULL);