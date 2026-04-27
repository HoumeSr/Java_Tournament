-- Тестовые категории для главной страницы и форм.
-- Безопасно для повторного запуска: code уникальный.
INSERT INTO "GameTypes" ("name", "code", "description", "isActive", "imageUrl", "maxPlayers") VALUES
('Dota 2', 'DOTA2', 'Командные турниры 5 на 5', TRUE, NULL, 5),
('Counter-Strike 2', 'CS2', 'Командные турниры 5 на 5', TRUE, NULL, 5),
('Valorant', 'VALORANT', 'Командные турниры 5 на 5', TRUE, NULL, 5),
('League of Legends', 'LOL', 'Командные турниры 5 на 5', TRUE, NULL, 5),
('EA SPORTS FC', 'FC', 'Соло-турниры по футболу', TRUE, NULL, 1),
('Rocket League', 'ROCKET', 'Командные турниры 3 на 3', TRUE, NULL, 3),
('Шахматы', 'CHESS', 'Соло-турниры по шахматам', TRUE, NULL, 1),
('Настольный теннис', 'TABLE_TENNIS', 'Соло-турниры по теннису', TRUE, NULL, 1)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = TRUE,
    "imageUrl" = NULL,
    "maxPlayers" = EXCLUDED."maxPlayers";
