jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
}));

import {
  getActiveReportersForSubmissionCheck,
  isReporterActiveAndValid,
  ActiveReporterInfo,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;
const mockedIsReporterActiveAndValid = isReporterActiveAndValid as jest.Mock;

describe('SCEN-390: 営業日かつ本日以前の指定日付で、有効な報告者が複数存在する場合、提出対象の報告者一覧と件数を正常に返す', () => {
  const targetDate = new Date('2024-01-15T00:00:00Z');
  const teamLeaderId = 'TL001';

  const mockReporters: ActiveReporterInfo[] = [
    {
      reporterId: 'RPT-001',
      userId: 'U001',
      reporterName: '報告者1',
      emailAddress: 'reporter1@example.com',
      department: '営業部',
      status: 'active',
    },
    {
      reporterId: 'RPT-002',
      userId: 'U002',
      reporterName: '報告者2',
      emailAddress: 'reporter2@example.com',
      department: '営業部',
      status: 'active',
    },
    {
      reporterId: 'RPT-003',
      userId: 'U003',
      reporterName: '報告者3',
      emailAddress: 'reporter3@example.com',
      department: '開発部',
      status: 'active',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedIsBusinessDay.mockResolvedValue(true);
    mockedIsReporterActiveAndValid.mockImplementation((input: any) =>
      Promise.resolve(true)
    );
  });

  it('success=true、reporters配列に3件以上5件以下の要素、totalCount がreporters配列の要素数と一致', async () => {
    mockedIsReporterActiveAndValid.mockImplementation(async (input: any) => {
      return mockReporters.some((r) => r.reporterId === input.reporterId);
    });

    const result: GetActiveReportersForSubmissionCheckOutput = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    expect(result.success).toBe(true);
    expect(result.reporters.length).toBeGreaterThanOrEqual(3);
    expect(result.reporters.length).toBeLessThanOrEqual(5);
    expect(result.totalCount).toBe(result.reporters.length);
    expect(typeof result.message).toBe('string');

    result.reporters.forEach((reporter) => {
      expect(reporter).toHaveProperty('reporterId');
      expect(reporter).toHaveProperty('userId');
      expect(reporter).toHaveProperty('reporterName');
      expect(reporter).toHaveProperty('emailAddress');
      expect(reporter).toHaveProperty('department');
      expect(reporter).toHaveProperty('status');
    });
  });
});
