import { configureStore, createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { forumReducer } from './forum.js';
import { sessionReducer } from './session.js';
import { votesReducer } from './votes.js';

const requests = createSlice({
  name: 'requests',
  initialState: 0,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(isPending, (count) => count + 1)
      .addMatcher(isFulfilled, (count) => Math.max(0, count - 1))
      .addMatcher(isRejected, (count) => Math.max(0, count - 1));
  },
});

export const store = configureStore({
  reducer: {
    forum: forumReducer,
    session: sessionReducer,
    votes: votesReducer,
    requests: requests.reducer,
  },
});
