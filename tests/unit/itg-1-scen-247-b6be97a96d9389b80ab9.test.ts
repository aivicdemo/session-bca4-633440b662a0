import { jest } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
} from '../../src/logic/daily-report-non-submission-detection';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterModule from '../../src/logic/reporter-master-management';
import * as dailyReportModule from '../../src/logic/daily-report-persistence';

describe('SCEN-247: リーダーのメールアドレスが登録されていない場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject with appropriate error when team leader email address is not registered', async () => {
    // Arrange
    const targetDate = '2024-01-15';
    const currentDateTime = '2024-01-15T17:30:00Z';
    const submissionDeadlineTime = '17:00';
    const teamId = 'team-001';

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate,
      currentDateTime,
      submissionDeadlineTime,
      teamId,
    };

    // Create 5 reporters: 3 with email, 2 without email
    // This represents reporters with varying email registration status
    const reporters = [
      { userId: 'rep-001', userName: 'Reporter 1', emailAddress: 'rep1@example.com', teamId },
      { userId: 'rep-002', userName: 'Reporter 2', emailAddress: 'rep2@example.com', teamId },
      { userId: 'rep-003', userName: 'Reporter 3', emailAddress: 'rep3@example.com', teamId },
      { userId: 'rep-004', userName: 'Reporter 4', emailAddress: null, teamId },
      { userId: 'rep-005', userName: 'Reporter 5', emailAddress: null, teamId },
    ];

    // Create submission records for 2 reporters with email
    const submissionRecords = [
      { userId: 'rep-001', date: targetDate },
      { userId: 'rep-002', date: targetDate },
    ];

    // Mock judgeSchedulerExecutionTiming to pass deadline check
    jest
      .spyOn(businessDayModule, 'judgeSchedulerExecutionTiming' as any)
      .mockResolvedValue(true);

    // Mock getActiveReportersForSubmissionCheck to return 5 reporters
    jest
      .spyOn(reporterModule, 'getActiveReportersForSubmissionCheck' as any)
      .mockResolvedValue(reporters);

    // Mock checkDailyReportExistsForDate to return submission records
    jest
      .spyOn(dailyReportModule, 'checkDailyReportExistsForDate' as any)
      .mockResolvedValue(submissionRecords);

    // Mock downstream functions to track if they are called
    const retrieveLogSpy = jest
      .spyOn(dailyReportModule, 'retrieveNonSubmissionDetectionLogsByDate' as any)
      .mockResolvedValue([]);
    const updateLogSpy = jest
      .spyOn(dailyReportModule, 'updateNonSubmissionDetectionLogWithReminderStatus' as any)
      .mockResolvedValue({});

    // Act & Assert
    // The function should throw an error because leader email is not registered
    // The error message should indicate leader email is not set
    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow(
      'リーダーのメールアドレスを設定してください'
    );

    // Verify that downstream functions are NOT called
    expect(retrieveLogSpy).not.toHaveBeenCalled();
    expect(updateLogSpy).not.toHaveBeenCalled();
  });
});
