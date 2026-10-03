jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
  isBusinessDay: jest.fn(),
}));

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  ActiveReporterInfo,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../src/logic/reporter-master-management';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = businessDayModule.isBusinessDay as jest.MockedFunction<typeof businessDayModule.isBusinessDay>;

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
    jest.clearAllMocks();

    mockedIsBusinessDay.mockResolvedValue(true);
  });

  it('success=true、reporters配列に3件以上5件以下の要素、各要素がActiveReporterInfo構造を満たし、totalCount が要素数と一致、message が成功テキストを返す', async () => {
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
      expect(typeof reporter.reporterId).toBe('string');
      expect(reporter).toHaveProperty('userId');
      expect(typeof reporter.userId).toBe('string');
      expect(reporter).toHaveProperty('reporterName');
      expect(typeof reporter.reporterName).toBe('string');
      expect(reporter).toHaveProperty('emailAddress');
      expect(typeof reporter.emailAddress).toBe('string');
      expect(reporter).toHaveProperty('department');
      expect(typeof reporter.department).toBe('string');
      expect(reporter).toHaveProperty('status');
      expect(typeof reporter.status).toBe('string');
    });
  });
});
