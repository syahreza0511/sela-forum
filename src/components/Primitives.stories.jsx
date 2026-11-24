import { fn } from 'storybook/test';
import { ErrorNotice, Loading } from './Primitives.jsx';

export default {
  title: 'Forum/Status permintaan',
  component: ErrorNotice,
};

export const GagalMemuat = {
  args: {
    message: 'Daftar diskusi gagal dimuat.',
    onRetry: fn(),
  },
};

export const MemuatDiskusi = {
  render: () => <Loading label="Memuat diskusi…" />,
};
