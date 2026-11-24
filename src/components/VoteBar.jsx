import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { applyViewerVote, changeVote, voteKey } from '../state/votes.js';
import { loginLink } from './Shell.jsx';

export function VoteBar({ threadId, commentId, item }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const viewer = useSelector((state) => state.session.user);
  const choice = { threadId, commentId };
  const transaction = useSelector((state) => state.votes[voteKey(choice)]);

  let votes = { up: item.upVotesBy || [], down: item.downVotesBy || [] };

  for (const [userId, value] of Object.entries(transaction?.confirmed || {})) {
    votes = applyViewerVote({ upVotesBy: votes.up, downVotesBy: votes.down }, userId, value);
  }

  if (transaction?.pending) {
    const { userId, value } = transaction.pending;
    votes = applyViewerVote({ upVotesBy: votes.up, downVotesBy: votes.down }, userId, value);
  }

  const current = votes.up.includes(viewer?.id) ? 1 : votes.down.includes(viewer?.id) ? -1 : 0;

  function castVote(value) {
    dispatch(changeVote({ ...choice, userId: viewer.id, value: current === value ? 0 : value }));
  }

  function renderControl(value, Icon, label) {
    return viewer ? (
      <button
        aria-label={label}
        aria-pressed={current === value}
        disabled={Boolean(transaction?.pending)}
        className="vote-control"
        type="button"
        onClick={() => castVote(value)}
      ><Icon size={16} aria-hidden="true" /></button>
    ) : (
      <Link className="vote-control" aria-label={`Masuk untuk ${label.toLowerCase()}`} to={loginLink(location)}>
        <Icon size={16} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="vote-area">
      <div className="vote-bar" aria-label="Voting">
        {renderControl(1, ChevronUp, 'Upvote')}
        <span className="vote-score" aria-label={`${votes.up.length - votes.down.length} skor vote`}>
          {votes.up.length - votes.down.length}
        </span>
        {renderControl(-1, ChevronDown, 'Downvote')}
      </div>
      {transaction?.error && <p className="vote-error" role="alert">Vote gagal. {transaction.error}</p>}
    </div>
  );
}
