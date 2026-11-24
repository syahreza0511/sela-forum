import { RankList } from './RankList.jsx';

const entries = [
  { user: { id: 's1', name: 'Maya Putri' }, score: 1450 },
  { user: { id: 's2', name: 'Raka Akbar' }, score: 260 },
  { user: { id: 's3', name: 'Nina Dewi' }, score: 170 },
];

export default {
  title: 'Forum/Peringkat',
  component: RankList,
  args: { entries },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 540 }}>
        <Story />
      </div>
    ),
  ],
};

export const HalamanLeaderboard = {};

export const RingkasanForum = {
  args: { compact: true },
};
