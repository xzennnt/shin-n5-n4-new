import { createUser, getAllUsers, normalizeUsername, normalizeUser, readJsonBody, saveUser, deleteUser, sendError, sendJson } from './_store.js';

export default async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const users = await getAllUsers();
      const safeUsers = Object.fromEntries(
        Object.entries(users).map(([k, v]) => {
          const { password, ...safeUser } = v;
          return [k, safeUser];
        })
      );
      sendJson(response, 200, { users: safeUsers });
      return;
    }

    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      const username = body.username?.trim();
      const password = body.password?.trim();

      if (!username || !password) {
        sendJson(response, 400, { error: 'Username dan password wajib diisi.' });
        return;
      }

      const normalizedUsername = normalizeUsername(username);
      
      if (normalizedUsername === 'xzennt' && password !== 'kuro27') {
        sendJson(response, 401, { error: 'Password admin salah.' });
        return;
      }

      const users = await getAllUsers();
      const existingUser = users[normalizedUsername];
      
      if (existingUser && existingUser.password !== password) {
        sendJson(response, 401, { error: 'Password salah.' });
        return;
      }

      const now = new Date().toISOString();
      const user = existingUser
        ? {
            ...normalizeUser(existingUser, username, password),
            lastLoginAt: now,
          }
        : createUser(username, password);

      const savedUser = await saveUser(user);
      const { password: _, ...safeSavedUser } = savedUser;

      const nextUsers = {
        ...users,
        [normalizedUsername]: savedUser,
      };

      const safeNextUsers = Object.fromEntries(
        Object.entries(nextUsers).map(([k, v]) => {
          const { password, ...safeUser } = v;
          return [k, safeUser];
        })
      );

      sendJson(response, 200, {
        user: safeSavedUser,
        users: safeNextUsers,
      });
      return;
    }

    if (request.method === 'DELETE') {
      const body = await readJsonBody(request);
      const username = body.username?.trim();
      const adminUsername = body.adminUsername?.trim();
      const adminPassword = body.adminPassword?.trim();

      if (!username) {
        sendJson(response, 400, { error: 'Username yang akan dihapus wajib diisi.' });
        return;
      }

      const normalizedAdmin = normalizeUsername(adminUsername);
      if (normalizedAdmin !== 'xzennt' || adminPassword !== 'kuro27') {
        sendJson(response, 403, { error: 'Akses ditolak. Hanya admin yang bisa menghapus user.' });
        return;
      }

      await deleteUser(username);

      const users = await getAllUsers();
      const safeUsers = Object.fromEntries(
        Object.entries(users).map(([k, v]) => {
          const { password, ...safeUser } = v;
          return [k, safeUser];
        })
      );

      sendJson(response, 200, { success: true, users: safeUsers });
      return;
    }

    sendJson(response, 405, { error: 'Method not allowed.' });
  } catch (error) {
    sendError(response, error);
  }
}
