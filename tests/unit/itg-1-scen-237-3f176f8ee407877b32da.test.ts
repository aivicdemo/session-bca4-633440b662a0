import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';
import * as reporterManagementModule from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/daily-report-persistence';

jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/daily-report-persistence');

const mockGetActiveReportersForSubmissionCheck = reporterManagementModule.getActiveReportersForSubmissionCheck as jest.MockedFunction<any>;
const mockCheckDailyReportExistsForDate = persistenceModule.checkDailyReportExistsForDate as jest.MockedFunction<any>;
const mockRetrieveNonSubmissionDetectionLogsByDate = persistenceModule.retrieveNonSubmissionDetectionLogsByDate as jest.MockedFunction<any>;
const mockUpdateNonSubmissionDetectionLogWithReminderStatus = persistenceModule.updateNonSubmissionDetectionLogWithReminderStatus as jest.MockedFunction<any>;

describe('SCEN-237: 登録済み報告者リストから未提出者を正しくフィルタリングして返す', () => {
  it('登録済み5名のうち提出していない2名を正確に返す', async () => {
    const activeReporters = [
      { userId: 'user-001', userName: 'Reporter 1', emailAddress: 'user1@example.com', departmentId: 'dept-001' },
      { userId: 'user-002', userName: 'Reporter 2', emailAddress: 'user2@example.com', departmentId: 'dept-001' },
      { userId: 'user-003', userName: 'Reporter 3', emailAddress: 'user3@example.com', departmentId: 'dept-001' },
      { userId: 'user-004', userName: 'Reporter 4', emailAddress: 'user4@example.com', departmentId: 'dept-001' },
      { userId: 'user-005', userName: 'Reporter 5', emailAddress: 'user5@example.com', departmentId: 'dept-001' },
    ];

    mockGetActiveReportersForSubmissionCheck.mockResolvedValue({
      reporters: activeReporters,
    });

    // user-001, user-002, user-003 は提出済み、user-004, user-005 は未提出
    mockCheckDailyReportExistsForDate.mockImplementation(async (input: any) => {
      return ['user-001', 'user-002', 'user-003'].includes(input.userId);
    });

    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockUpdateNonSubmissionDetectionLogWithReminderStatus.mockResolvedValue({ success: true });

    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    const result = await detectNonSubmittedReportersAtDeadline(input);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters.map((r: any) => r.userId)).toEqual(['user-004', 'user-005']);
    expect(result.detectionLog.totalReportersCount).toBe(5);
    expect(result.detectionLog.nonSubmittedCount).toBe(2);
    expect(result.detectionLog.targetDate).toBe('2024-01-15');
    expect(result.detectionTimestamp).toBe('2024-01-15T17:30:00Z');
  });
});
