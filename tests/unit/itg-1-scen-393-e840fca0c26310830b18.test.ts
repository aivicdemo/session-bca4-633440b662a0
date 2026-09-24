jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isBusinessDay: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  isReporterActiveAndValid: jest.fn(),
}));

import {
  getActiveReportersForSubmissionCheck,
  NoActiveReportersError,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';

const mockedIsBusinessDay = isBusinessDay as jest.Mock;

describe('SCEN-393: 指定日付に有効な報告者が1件も存在しない場合、NoActiveReportersError を返す', () => {
  const targetDate = new Date('2024-01-15T00:00:00Z');
  const teamLeaderId = 'TL001';

  beforeEach(() => {
    jest.resetAllMocks();
    mockedIsBusinessDay.mockResolvedValue(true);
  });

  it('NoActiveReportersError をスロー、エラー文言は「指定日付に日報提出対象の有効な報告者が存在しません。」', async () => {
    await expect(
      getActiveReportersForSubmissionCheck({
        targetDate,
        teamLeaderId,
      })
    ).rejects.toThrow(NoActiveReportersError);

    expect(mockedIsBusinessDay).toHaveBeenCalledWith(targetDate);
  });
});
