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

describe('SCEN-392: 指定日付が将来日である場合、TargetDateInvalidError を返す', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  const teamLeaderId = 'TL001';

  it('targetDate が将来日の場合、TargetDateInvalidError をスロー', async () => {
    await expect(
      getActiveReportersForSubmissionCheck({
        targetDate: futureDate,
        teamLeaderId,
      })
    ).rejects.toThrow(TargetDateInvalidError);
  });
});
