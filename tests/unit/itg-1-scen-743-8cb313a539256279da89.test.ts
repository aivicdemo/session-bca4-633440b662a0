jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));

import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-743: 本日既に提出済みの報告者は検知対象から除外される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('本日提出済み報告者R001を除外し、未提出者R002とR003のみを返す', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    mockedIsBusinessDay.mockResolvedValue(true);

    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(true);
    expect(result.reporters).toHaveLength(2);
    expect(result.reporters.map((r: any) => r.reporterId)).toEqual(['R002', 'R003']);
    expect(result.reporters.map((r: any) => r.reporterId)).not.toContain('R001');
    expect(result.totalCount).toBe(2);
    expect(result.message).toBeTruthy();
  });
});
