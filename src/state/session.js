import { createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api.js';

const storageKey = 'sela.forum.token';
let token = null;

try {
  token = globalThis.sessionStorage?.getItem(storageKey) || null;
} catch {
  // Continue with an in-memory session when storage is blocked.
}

function saveToken(value) {
  token = value;

  try {
    if (value) {
      globalThis.sessionStorage?.setItem(storageKey, value);
    } else {
      globalThis.sessionStorage?.removeItem(storageKey);
    }
  } catch {
    // The current tab can still use the in-memory token.
  }
}

const session = createSlice({
  name: 'session',
  initialState: { user: null, status: token ? 'restoring' : 'idle', error: null },
  reducers: {
    sessionStarted(state, { payload }) {
      state.status = payload;
      state.error = null;
    },
    sessionReady(state, { payload }) {
      state.user = payload;
      state.status = 'idle';
    },
    sessionFailed(state, { payload }) {
      state.error = payload;
      state.status = 'idle';
    },
    sessionEnded(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

const { sessionStarted, sessionReady, sessionFailed, sessionEnded } = session.actions;

export const sessionReducer = session.reducer;

function publicProfile({ id, name, avatar }) {
  return { id, name, avatar };
}

export const signOut = () => (dispatch) => {
  saveToken(null);
  dispatch(sessionEnded());
};

export const restoreSession = () => async (dispatch) => {
  const saved = token;

  if (!saved) {
    return;
  }

  try {
    const { user } = await api.profile(saved);
    if (token === saved) {
      dispatch(sessionReady(publicProfile(user)));
    }
  } catch (error) {
    if (token === saved) {
      if (error.status === 401) {
        dispatch(signOut());
      } else {
        dispatch(sessionFailed('Sesi belum bisa dipulihkan. Silakan masuk kembali.'));
      }
    }
  }
};

export const authenticate = (mode, credentials) => async (dispatch, getState) => {
  if (getState().session.status !== 'idle') {
    return false;
  }

  dispatch(sessionStarted(mode));

  try {
    if (mode === 'register') {
      await api.register(credentials);
    }

    const { email, password } = credentials;
    const { token: issuedToken } = await api.login({ email, password });
    const { user } = await api.profile(issuedToken);

    saveToken(issuedToken);
    dispatch(sessionReady(publicProfile(user)));
    return true;
  } catch (error) {
    dispatch(sessionFailed(error.message));
    return false;
  }
};

export async function withSession(request, dispatch, getState) {
  const activeToken = token;

  if (!activeToken || !getState().session.user) {
    throw new Error('Silakan masuk untuk melanjutkan.');
  }

  try {
    return await request(activeToken);
  } catch (error) {
    if (error.status === 401 && token === activeToken) {
      dispatch(signOut());
      throw new Error('Sesi berakhir. Silakan masuk kembali.');
    }

    throw error;
  }
}
