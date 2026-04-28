INSERT INTO "GameTypes" ("name", "code", "description", "isActive", "imageUrl", "maxPlayers")
VALUES
('Dota 2', 'DOTA2', '5v5 MOBA tournament game', TRUE, 'dota2.jpg', 5),
('Counter-Strike 2', 'CS2', '5v5 tactical FPS tournament game', TRUE, 'cs2.jpg', 5),
('Valorant', 'VAL', '5v5 tactical shooter tournament game', TRUE, 'valorant.jpg', 5),
('League of Legends', 'LOL', '5v5 MOBA strategy tournament game', TRUE, 'lol.jpg', 5),
('Rocket League', 'RL', '3v3 car football tournament game', TRUE, 'rocketleague.jpg', 3),
('Chess', 'CHESS', '1v1 classic board game', TRUE, 'chess.jpg', 1),
('Table Tennis', 'TT', '1v1 fast racket sport', TRUE, 'tabletennis.jpg', 1),
('EA SPORTS FC', 'FC25', '1v1 football simulation game', TRUE, 'fc25.jpg', 1)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = TRUE,
    "imageUrl" = EXCLUDED."imageUrl",
    "maxPlayers" = EXCLUDED."maxPlayers";