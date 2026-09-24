import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedReportersAtDeadlineInput,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';
import * as persistence from '../../src/logic/daily-report-persistence';
import * as deadlineJudgment from '../../src/logic/business-day-deadline-judgment';
import * as reporterMaster from '../../src/logic/reporter-master-management';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');

describe('SCEN-231: 日報データベースが一時的に取得できない場合は警告を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return SubmissionStatusCheckFailureError when database access fails temporarily', () => {
    const mockJudgeScheduler = jest.spyOn(deadlineJudgment, 'judgeSchedulerExecutionTiming' as any);
    mockJudgeScheduler.mockReturnValue(true);

    const mockGetReporters = jest.spyOn(reporterMaster, 'getActiveReportersForSubmissionCheck' as any);
    mockGetReporters.mockReturnValue([
      { userId: 'reporter1', userName: 'Reporter 1', emailAddress: 'reporter1@example.com', departmentId: 'dept-1' },
      { userId: 'reporter2', userName: 'Reporter 2', emailAddress: 'reporter2@example.com', departmentId: 'dept-1' },
    ]);

    const mockCheckReport = jest.spyOn(persistence, 'checkDailyReportExistsForDate' as any);
    mockCheckReport.mockRejectedValue(new Error('Database connection timeout'));

    const input: DetectNonSubmittedReportersAtDeadlineInput = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    expect(() => detectNonSubmittedReportersAtDeadline(input)).toThrow(
      SubmissionStatusCheckFailureError
    );
  });
});
