import { Avatar } from './Primitives.jsx';

const number = new Intl.NumberFormat('id-ID');

export function RankList({ entries, compact = false }) {
  return (
    <ol className={`rank-list${compact ? ' rank-compact' : ''}`}>
      {entries.map(({ user, score }, index) => (
        <li key={user.id}>
          <span className={`rank-number rank-${index + 1}`}>{index + 1}</span>
          <Avatar user={user} size={compact ? 'small' : 'medium'} />
          <span className="rank-name">{user.name}</span>
          <span className="rank-score">{number.format(score)}<span className="sr-only"> poin</span></span>
        </li>
      ))}
    </ol>
  );
}
