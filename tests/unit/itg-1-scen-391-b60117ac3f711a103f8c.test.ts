jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
}));

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  TargetDateInvalidError,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.MockedFunction<any>;

describe('SCEN-391: 指定日付が営業日でない場合、TargetDateInvalidError を返す', () => {
  const targetDate = new Date('2024-01-07T00:00:00Z');
  const teamLeaderId = 'TL001';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedIsBusinessDay.mockResolvedValue(false);
  });

  it('TargetDateInvalidError をスロー、エラー文言は「提出対象日付は営業日かつ本日以前である必要があります。」', async () => {
    const error = await expect(
      getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      })
    ).rejects.toThrow();

    try {
      await getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(TargetDateInvalidError);
      expect(err.message).toBe('提出対象日付は営業日かつ本日以前である必要があります。');
    }

    expect(mockedIsBusinessDay).toHaveBeenCalledWith(targetDate);
  });
});
