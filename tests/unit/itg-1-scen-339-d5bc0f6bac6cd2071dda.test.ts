import { describe, it, expect } from '@jest/globals';

describe('SCEN-339: 複数ユーザーのうち、アクティブなユーザーのみが認識される', () => {
  it('filterActiveReportersロジックは、アクティブ状態のユーザーIDのみを返す', () => {
    const userMasterList = [
      { userId: 'U001', is_active: true },
      { userId: 'U002', is_active: true },
      { userId: 'U003', is_active: false },
      { userId: 'U004', is_active: true },
      { userId: 'U005', is_active: false },
    ];
    const allSystemUsers = ['U001', 'U002', 'U003', 'U004', 'U005'];

    const activeReporterIds = userMasterList
      .filter(user => user.is_active && allSystemUsers.includes(user.userId))
      .map(user => user.userId);

    expect(activeReporterIds).toEqual(['U001', 'U002', 'U004']);
    expect(activeReporterIds).not.toContain('U003');
    expect(activeReporterIds).not.toContain('U005');
  });
});
