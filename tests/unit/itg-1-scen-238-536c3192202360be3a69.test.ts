import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import * as reporterManagementModule from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/reporter-master-management');

const mockGetActiveReportersForSubmissionCheck = reporterManagementModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;

describe('SCEN-238: チームに報告者が登録されていない場合は検知対象がない', () => {
  it('getActiveReportersForSubmissionCheck が空配列を返す場合、nonSubmittedReporters は空配列で返される', async () => {
    mockGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: [],
    });

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.detectionLog.totalReportersCount).toBe(0);
  });
});
