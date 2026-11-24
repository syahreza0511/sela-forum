import { useDispatch, useSelector } from 'react-redux';
import { Trophy } from 'lucide-react';
import { EmptyNotice, ErrorNotice, Loading } from '../components/Primitives.jsx';
import { RankList } from '../components/RankList.jsx';
import { loadLeaderboard } from '../state/forum.js';

export function LeaderboardPage() {
  const dispatch = useDispatch();
  const { status, items, error } = useSelector((state) => state.forum.leaderboard);

  return (
    <div className="detail-layout leaderboard">
      <header className="page-heading rank-heading">
        <span className="icon-tile tile-gold"><Trophy size={26} aria-hidden="true" /></span>
        <div>
          <h1>Leaderboard</h1>
          <p>Peringkat kontributor berdasarkan skor dari forum.</p>
        </div>
      </header>
      {(status === 'idle' || status === 'loading') && items.length === 0 && <Loading label="Memuat leaderboard…" />}
      {status === 'error' && <ErrorNotice message={error} onRetry={() => dispatch(loadLeaderboard())} />}
      {status === 'ready' && items.length === 0 && <EmptyNotice title="Peringkat belum tersedia" icon={Trophy} />}
      {items.length > 0 && (
        <section className="detail-card rank-card" aria-label="Peringkat kontributor">
          <div className="rank-header"><span>Peringkat</span><span>Kontributor</span><span>Skor</span></div>
          <RankList entries={items} />
        </section>
      )}
    </div>
  );
}
