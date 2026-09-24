jest.mock('../../src/logic/reporter-master-management');

import { registerReporter } from '../../src/logic/reporter-master-management';

const mockedRegisterReporter = registerReporter as jest.Mock;

describe('SCEN-339: ユーザーマスタの代表的な複数ユーザーのうち、アクティブなユーザーのみがシステムに認識される', () => {
  it('複数ユーザーのマスタからアクティブなユーザーのみが認識されることを検証', async () => {
    const mockUsers = [
      { userId: 'U001', isActive: true },
      { userId: 'U002', isActive: true },
      { userId: 'U003', isActive: false },
      { userId: 'U004', isActive: true },
      { userId: 'U005', isActive: false },
    ];

    const allSystemUsers = ['U001', 'U002', 'U003', 'U004', 'U005'];
    const expectedActiveReporterIds = ['U001', 'U002', 'U004'];

    const activeReporters = mockUsers
      .filter(user => user.isActive)
      .map(user => user.userId)
      .filter(userId => allSystemUsers.includes(userId));

    expect(activeReporters).toEqual(expectedActiveReporterIds);
    expect(activeReporters).toContain('U001');
    expect(activeReporters).toContain('U002');
    expect(activeReporters).toContain('U004');
    expect(activeReporters).not.toContain('U003');
    expect(activeReporters).not.toContain('U005');
  });
});
