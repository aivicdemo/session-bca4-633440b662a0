import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-239: 提出期限の時刻形式が不正な場合は処理を拒否する', () => {
  const invalidDeadlineTimes = ['25:00', '17-00', 'abc:00', '', null];

  invalidDeadlineTimes.forEach((invalidTime) => {
    it(`submissionDeadlineTime が "${invalidTime}" の場合、エラーが throw される`, async () => {
      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:01:00Z',
        submissionDeadlineTime: invalidTime as any,
        teamId: 'team-001',
      };

      await expect(
        detectNonSubmittedReportersAtDeadline(input)
      ).rejects.toThrow();
    });
  });
});
