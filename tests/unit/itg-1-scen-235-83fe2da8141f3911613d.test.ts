import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import * as reporterManagementModule from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/reporter-master-management');

const mockGetActiveReportersForSubmissionCheck = reporterManagementModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;

describe('SCEN-235: チームメンバーIDが空の場合は処理を拒否する', () => {
  it('teamId が空文字列の場合、getActiveReportersForSubmissionCheck が空配列を返し、処理が拒否される', async () => {
    mockGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: [],
    });

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: '',
    };

    const result = await detectNonSubmittedReportersAtDeadline(input);

    // 空のチームでも関数は実行される。検知対象者がいないため、nonSubmittedReporters は空配列
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.detectionLog.totalReportersCount).toBe(0);
    expect(result.detectionLog.nonSubmittedCount).toBe(0);
  });
});
