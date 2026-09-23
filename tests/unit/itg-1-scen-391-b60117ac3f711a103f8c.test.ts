import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  GetActiveReportersForSubmissionCheckInput,
  TargetDateInvalidError,
} from '../../src/logic/reporter-master-management';
import {
  isBusinessDay,
} from '../../src/logic/business-day-deadline-judgment';

jest.mock('../../src/logic/business-day-deadline-judgment.ts', () => ({
  isBusinessDay: jest.fn(),
}));

jest.mock('../../src/logic/reporter-master-management.ts', () => ({
  isReporterActiveAndValid: jest.fn(),
}));

describe('SCEN-391: 指定日付が営業日でない場合、TargetDateInvalidErrorを返す', () => {
  let mockIsBusinessDay: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIsBusinessDay = require('../../src/logic/business-day-deadline-judgment.ts').isBusinessDay as jest.Mock;

    // 営業日ではない（日曜日など）
    // @ts-ignore
    mockIsBusinessDay.mockResolvedValue(false);
  });

  it('指定日付が営業日でない場合、TargetDateInvalidErrorが発生する', async () => {
    const input: GetActiveReportersForSubmissionCheckInput = {
      targetDate: new Date('2024-01-07'), // 日曜日
      teamLeaderId: 'TL001',
    };

    try {
      await getActiveReportersForSubmissionCheck(input);
      fail('TargetDateInvalidError should be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TargetDateInvalidError);
      expect((error as Error).message).toContain('提出対象日付は営業日かつ本日以前である必要があります。');
    }
  });
});
