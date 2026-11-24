import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../lib/api.js';
import { withSession } from './session.js';

export function voteKey({ threadId, commentId }) {
  return commentId ? `${threadId}/${commentId}` : threadId;
}

export function applyViewerVote(item, userId, value) {
  const up = (item.upVotesBy || []).filter((id) => id !== userId);
  const down = (item.downVotesBy || []).filter((id) => id !== userId);

  if (value === 1) {
    up.push(userId);
  }
  if (value === -1) {
    down.push(userId);
  }

  return { up, down };
}

export const changeVote = createAsyncThunk(
  'votes/change',
  async (choice, { dispatch, getState }) => {
    await withSession((token) => api.vote(choice, token), dispatch, getState);
  },
  {
    condition: (choice, { getState }) => (
      Boolean(getState().session.user) && !getState().votes[voteKey(choice)]?.pending
    ),
  },
);

const votes = createSlice({
  name: 'votes',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(changeVote.pending, (state, { meta }) => {
        const key = voteKey(meta.arg);
        state[key] = {
          confirmed: state[key]?.confirmed || {},
          pending: { userId: meta.arg.userId, value: meta.arg.value },
          error: null,
        };
      })
      .addCase(changeVote.fulfilled, (state, { meta }) => {
        const entry = state[voteKey(meta.arg)];
        entry.confirmed[meta.arg.userId] = meta.arg.value;
        entry.pending = null;
      })
      .addCase(changeVote.rejected, (state, { error, meta }) => {
        const entry = state[voteKey(meta.arg)];
        entry.pending = null;
        entry.error = error.message;
      });
  },
});

export const votesReducer = votes.reducer;
