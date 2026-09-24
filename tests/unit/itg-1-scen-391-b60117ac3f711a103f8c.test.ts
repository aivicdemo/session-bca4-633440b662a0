jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
}));

import {
  getActiveReportersForSubmissionCheck,
  TargetDateInvalidError,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-391: 指定日付が営業日でない場合、TargetDateInvalidError を返す', () => {
  const targetDate = new Date('2024-01-07T00:00:00Z');
  const teamLeaderId = 'TL001';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedIsBusinessDay.mockResolvedValue(false);
  });

  it('TargetDateInvalidError をスロー、エラー文言は「提出対象日付は営業日かつ本日以前である必要があります。」', async () => {
    await expect(
      getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      })
    ).rejects.toThrow(TargetDateInvalidError);

    expect(mockedIsBusinessDay).toHaveBeenCalledWith(targetDate);
  });
});
