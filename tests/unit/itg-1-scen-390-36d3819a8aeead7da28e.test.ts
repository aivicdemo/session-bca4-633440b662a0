import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  GetActiveReportersForSubmissionCheckOutput,
  ActiveReporterInfo,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import {
  isBusinessDay,
  IsBusinessDayInput,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isBusinessDay: jest.fn(),
}));

jest.mock('../../src/logic/reporter-master-management.ts', () => ({
  isReporterActiveAndValid: jest.fn(),
}));

describe('SCEN-390: 営業日かつ本日以前の指定日付で、有効な報告者が複数存在する場合、提出対象の報告者一覧と件数を正常に返す', () => {
  let mockIsBusinessDay: jest.Mock;
  let mockIsReporterActiveAndValid: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsBusinessDay = require('../../src/logic/business-day-deadline-judgment.ts').isBusinessDay as jest.Mock;
    mockIsReporterActiveAndValid = require('../../src/logic/reporter-master-management.ts').isReporterActiveAndValid as jest.Mock;

    // @ts-ignore
    mockIsBusinessDay.mockResolvedValue(true);

    // 複数の報告者（3件）が有効を返す
    // @ts-ignore
    mockIsReporterActiveAndValid
      // @ts-ignore
      .mockResolvedValueOnce(true)
      // @ts-ignore
      .mockResolvedValueOnce(true)
      // @ts-ignore
      .mockResolvedValueOnce(true);
  });

  it('営業日の指定で有効な報告者が複数存在する場合、success=true、複数件の報告者一覧を返す', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate: new Date('2024-01-15'),
      teamLeaderId: 'leader-001',
    };

    const result = await getActiveReportersForSubmissionCheck(input);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.reporters).toBeDefined();
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(result.reporters.length).toBeGreaterThanOrEqual(3);
    expect(result.reporters.length).toBeLessThanOrEqual(5);
    expect(result.totalCount).toBe(result.reporters.length);
    expect(result.totalCount).toBeGreaterThanOrEqual(3);
    expect(result.totalCount).toBeLessThanOrEqual(5);
    expect(result.message).toBeDefined();

    // 各報告者がActiveReporterInfo型であることを確認
    result.reporters.forEach((reporter: ActiveReporterInfo) => {
      expect(reporter).toBeDefined();
      // BasicActiveReporterInfo型の属性を確認
      expect(typeof reporter).toBe('object');
    });
  });
});
