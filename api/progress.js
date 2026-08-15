import { getAllUsers, normalizeUsername, normalizeUser, readJsonBody, saveUser, sendError, sendJson } from './_store.js';

const getUserOrThrow = (users, username) => {
  const normalizedUsername = normalizeUsername(username);
  const user = users[normalizedUsername];

  if (!user) {
    const error = new Error('User tidak ditemukan.');
    error.statusCode = 404;
    throw error;
  }

  return normalizeUser(user, username);
};

export default async function handler(request, response) {
  try {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed.' });
      return;
    }

    const body = await readJsonBody(request);
    const username = body.username?.trim();

    if (!username) {
      sendJson(response, 400, { error: 'Username wajib diisi.' });
      return;
    }

    const users = await getAllUsers();
    const user = getUserOrThrow(users, username);
    const now = new Date().toISOString();

    if (body.action === 'reset') {
      const answeredCount = Object.keys(user.progress.answers || {}).length;
      if (answeredCount < 496 && user.role !== 'admin') {
        sendJson(response, 403, { error: 'Reset hanya diperbolehkan setelah menjawab semua 496 soal.' });
        return;
      }
      const savedUser = await saveUser({
        ...user,
        lastActivityAt: null,
        progress: { answers: {} },
      });

      sendJson(response, 200, {
        user: savedUser,
        users: {
          ...users,
          [savedUser.normalizedUsername]: savedUser,
        },
      });
      return;
    }

    if (body.action === 'answer') {
      if (!body.questionId || !Number.isInteger(body.selectedIndex) || typeof body.isCorrect !== 'boolean') {
        sendJson(response, 400, { error: 'Data jawaban tidak lengkap.' });
        return;
      }

      if (user.progress.answers && user.progress.answers[body.questionId]) {
        sendJson(response, 400, { error: 'Jawaban untuk soal ini sudah disubmit dan tidak bisa diganti.' });
        return;
      }

      const answeredAt = body.answeredAt ?? now;
      const savedUser = await saveUser({
        ...user,
        lastActivityAt: answeredAt,
        progress: {
          ...user.progress,
          answers: {
            ...user.progress.answers,
            [body.questionId]: {
              selectedIndex: body.selectedIndex,
              isCorrect: body.isCorrect,
              answeredAt,
            },
          },
        },
      });

      sendJson(response, 200, {
        user: savedUser,
        users: {
          ...users,
          [savedUser.normalizedUsername]: savedUser,
        },
      });
      return;
    }

    sendJson(response, 400, { error: 'Action tidak dikenali.' });
  } catch (error) {
    sendError(response, error);
  }
}
