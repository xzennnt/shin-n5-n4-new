import { Redis } from '@upstash/redis';

// MOCKED — in-memory fallback, data lost on container sleep
const store = new Map();
const memoryRedis = {
  hgetall: async (hash) => {
    return store.get(hash) || {};
  },
  hset: async (hash, data) => {
    const existing = store.get(hash) || {};
    store.set(hash, { ...existing, ...data });
    return 'OK';
  },
  hdel: async (hash, field) => {
    const existing = store.get(hash) || {};
    delete existing[field];
    store.set(hash, existing);
    return 1;
  }
};

const USERS_HASH = 'shin-nihongo:users';
const ADMIN_USERNAME = 'xzennt';

let redisClient = null;

export const getRedis = () => {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (url && token) {
    redisClient = new Redis({
      url: url,
      token: token,
    });
  } else {
    console.warn('WARNING: UPSTASH_REDIS or KV_REST env vars missing. Using in-memory store. Data will be lost on Vercel!');
    redisClient = memoryRedis;
  }

  return redisClient;
};

export const normalizeUsername = (value = '') => value.trim().toLowerCase();

export const createEmptyProgress = () => ({ answers: {} });

export const createUser = (username, password) => {
  const normalizedUsername = normalizeUsername(username);
  const now = new Date().toISOString();

  return {
    username: username.trim(),
    normalizedUsername,
    password: password || '',
    role: normalizedUsername === ADMIN_USERNAME ? 'admin' : 'student',
    registeredAt: now,
    lastLoginAt: now,
    lastActivityAt: null,
    progress: createEmptyProgress(),
  };
};

export const normalizeUser = (user, fallbackUsername, fallbackPassword) => {
  const parsedUser = typeof user === 'string' ? JSON.parse(user) : user;
  const username = parsedUser?.username ?? fallbackUsername;
  const normalizedUsername = normalizeUsername(username);

  return {
    ...createUser(username, fallbackPassword || parsedUser?.password),
    ...parsedUser,
    username,
    normalizedUsername,
    role: normalizedUsername === ADMIN_USERNAME ? 'admin' : 'student',
    progress: parsedUser?.progress ?? { answers: parsedUser?.answers ?? {} },
  };
};

export const readJsonBody = async (request) => {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  let rawBody = '';
  for await (const chunk of request) {
    rawBody += chunk;
  }

  return rawBody ? JSON.parse(rawBody) : {};
};

export const getAllUsers = async () => {
  const redis = getRedis();
  const records = (await redis.hgetall(USERS_HASH)) ?? {};

  return Object.entries(records).reduce((users, [key, value]) => {
    const user = normalizeUser(value, key);
    users[user.normalizedUsername] = user;
    return users;
  }, {});
};

export const saveUser = async (user) => {
  const redis = getRedis();
  const normalizedUsername = normalizeUsername(user.username);
  const normalizedUser = normalizeUser(user, normalizedUsername);

  await redis.hset(USERS_HASH, {
    [normalizedUsername]: JSON.stringify(normalizedUser),
  });

  return normalizedUser;
};

export const deleteUser = async (username) => {
  const redis = getRedis();
  const normalizedUsername = normalizeUsername(username);
  await redis.hdel(USERS_HASH, normalizedUsername);
};

export const sendJson = (response, statusCode, payload) => {
  response.status(statusCode).json(payload);
};

export const sendError = (response, error) => {
  const statusCode = error.statusCode ?? 500;
  sendJson(response, statusCode, {
    error: statusCode === 500 ? 'Internal server error.' : error.message,
  });
};
