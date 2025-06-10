CREATE TABLE "users"
(
    id BIGSERIAL PRIMARY KEY,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    avatar TEXT NOT NULL,
    bio TEXT
);

CREATE TABLE "conversations"
(
    id BIGSERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL
);

CREATE TABLE "conversation_participants"
(
    user_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, conversation_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    -- ON DELETE CASCADE = Delete all related records
);

CREATE TABLE "messages"
(
    id BIGSERIAL PRIMARY KEY,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT,
    user_id BIGINT NOT NULL,
    conversation_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);