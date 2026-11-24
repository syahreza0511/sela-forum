import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import { Hash, LayoutGrid, MessageCircle, Plus, Search, Trophy } from 'lucide-react';
import { Hero } from '../components/Hero.jsx';
import { Author, EmptyNotice, ErrorNotice, Loading, TopicTag } from '../components/Primitives.jsx';
import { RankList } from '../components/RankList.jsx';
import { VoteBar } from '../components/VoteBar.jsx';
import { excerpt, topicName } from '../lib/format.js';
import { loadFeed, loadLeaderboard, searchChanged, selectTopics } from '../state/forum.js';

function ThreadCard({ thread, owner }) {
  const path = `/diskusi/${encodeURIComponent(thread.id)}`;
  const preview = excerpt(thread.body);

  return (
    <article className="thread-card">
      <TopicTag category={thread.category} />
      <h3><Link to={path}>{thread.title}</Link></h3>
      {preview && <p className="thread-excerpt">{preview}</p>}
      <footer className="thread-footer">
        <Author user={owner} date={thread.createdAt} compact />
        <div className="thread-actions">
          <Link className="comment-count" to={path} aria-label={`${thread.totalComments} komentar`}>
            <MessageCircle size={17} aria-hidden="true" /><span>{thread.totalComments}</span>
          </Link>
          <VoteBar threadId={thread.id} item={thread} />
        </div>
      </footer>
    </article>
  );
}

function TopicFilters({ topics, selected, onSelect }) {
  return (
    <div className="filters" aria-label="Filter kategori">
      <button type="button" className="filter" aria-pressed={!selected} onClick={() => onSelect('')}>
        <LayoutGrid size={15} aria-hidden="true" /> Semua
      </button>
      {topics.map(({ name }) => (
        <button key={name} type="button" className="filter" aria-pressed={selected === name} onClick={() => onSelect(name)}>
          <Hash size={14} aria-hidden="true" /> {name}
        </button>
      ))}
    </div>
  );
}

function FeedAside({ topics, selected, onSelect }) {
  const dispatch = useDispatch();
  const leaderboard = useSelector((state) => state.forum.leaderboard);

  return (
    <aside className="feed-aside" aria-label="Ringkasan forum">
      {!!topics.length && (
        <section className="aside-card">
          <h2><span className="icon-tile"><Hash size={18} aria-hidden="true" /></span> Kategori</h2>
          <ul className="topic-list">
            {topics.slice(0, 6).map(({ name, count }) => (
              <li key={name}>
                <button type="button" aria-pressed={selected === name} onClick={() => onSelect(selected === name ? '' : name)}>
                  <span>#{name}</span><span className="topic-count" aria-label={`${count} diskusi`}>{count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="aside-card">
        <h2><span className="icon-tile tile-gold"><Trophy size={17} aria-hidden="true" /></span> Kontributor teratas</h2>
        {leaderboard.status === 'loading' && <Loading label="Memuat peringkat…" />}
        {leaderboard.status === 'error' && <ErrorNotice message="Peringkat gagal dimuat." onRetry={() => dispatch(loadLeaderboard())} />}
        {leaderboard.items.length > 0 && <RankList entries={leaderboard.items.slice(0, 3)} compact />}
        <Link className="aside-link" to="/leaderboard">Lihat leaderboard</Link>
      </section>
    </aside>
  );
}

export function FeedPage() {
  const dispatch = useDispatch();
  const [params, setParams] = useSearchParams();
  const feed = useSelector((state) => state.forum.feed);
  const search = useSelector((state) => state.forum.search);
  const topics = useSelector(selectTopics);
  const selected = params.get('kategori') || '';
  const query = search.trim().toLowerCase();
  const threads = feed.items
    .filter((thread) => !selected || topicName(thread.category).toLowerCase() === selected)
    .filter((thread) => thread.title.toLowerCase().includes(query))
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
  const loading = feed.status === 'idle' || feed.status === 'loading';

  function selectTopic(name) {
    const next = new URLSearchParams(params);

    if (name) {
      next.set('kategori', name);
    } else {
      next.delete('kategori');
    }

    setParams(next);
  }

  function resetFilters() {
    dispatch(searchChanged(''));
    setParams({});
  }

  return (
    <>
      <Hero />
      <div className="feed-grid">
        <section className="feed" aria-labelledby="threads-title">
          <div className="section-heading">
            <div>
              <h2 id="threads-title">{query ? 'Hasil pencarian' : 'Diskusi terbaru'}</h2>
              {feed.status === 'ready' && <p aria-live="polite">{threads.length} diskusi</p>}
            </div>
            <Link className="button button-primary" to="/buat"><Plus size={18} aria-hidden="true" /> Buat diskusi</Link>
          </div>
          <TopicFilters topics={topics} selected={selected} onSelect={selectTopic} />
          {loading && !feed.items.length && <Loading label="Memuat diskusi…" />}
          {feed.status === 'error' && <ErrorNotice message={feed.error} onRetry={() => dispatch(loadFeed())} />}
          {feed.status === 'ready' && threads.length === 0 && (
            <EmptyNotice title="Belum ada diskusi yang cocok" icon={Search}>
              {(query || selected) && <button className="button button-outline" type="button" onClick={resetFilters}>Hapus filter dan pencarian</button>}
            </EmptyNotice>
          )}
          <div className="thread-list">
            {threads.map((thread) => <ThreadCard key={thread.id} thread={thread} owner={feed.users[thread.ownerId]} />)}
          </div>
        </section>
        <FeedAside topics={topics} selected={selected} onSelect={selectTopic} />
      </div>
    </>
  );
}
