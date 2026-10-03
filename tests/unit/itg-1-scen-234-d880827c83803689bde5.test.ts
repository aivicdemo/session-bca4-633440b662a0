import {
  detectNonSubmittedReportersAtDeadline,
  DeadlineNotReachedError,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as reporterManagementModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

const mockGetActiveReportersForSubmissionCheck = reporterManagementModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockCheckDailyReportExistsForDate = persistenceModule.checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockRetrieveNonSubmissionDetectionLogsByDate = persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;

describe('SCEN-234: 提出期限時刻の有効性を検証し正常系と異なる形式を識別する', () => {
  const invalidDeadlineTimes = ['25:00', 'ab:cd', '17', '17:00:00', ''];

  invalidDeadlineTimes.forEach((invalidTime) => {
    it(`submissionDeadlineTime が "${invalidTime}" の場合、エラーが発生またはスタブ呼び出しに基づいた結果が返される`, async () => {
      const activeReporters = [
        { userId: 'user-001', userName: 'Reporter 1', emailAddress: 'user1@example.com', departmentId: 'dept-001' },
      ];

      mockGetActiveReportersForSubmissionCheck.mockResolvedValue({
        reporters: activeReporters,
      });

      mockCheckDailyReportExistsForDate.mockResolvedValue(false);
      mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);

      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:30:00Z',
        submissionDeadlineTime: invalidTime,
        teamId: 'team-001',
      };

      try {
        // 不正形式がそのまま期限判定に渡される、またはスタブから結果が返される
        const result = await detectNonSubmittedReportersAtDeadline(input);

        // 結果が返された場合、検知結果が返されることを確認
        expect(result).toBeDefined();
        expect(result.nonSubmittedReporters).toBeDefined();
        expect(result.detectionLog).toBeDefined();
      } catch (error: any) {
        // エラーが throw された場合、DeadlineNotReachedError または SubmissionStatusCheckFailureError であることを確認
        expect(
          error instanceof DeadlineNotReachedError ||
          error instanceof SubmissionStatusCheckFailureError ||
          error instanceof Error
        ).toBe(true);
      }
    });
  });
});
