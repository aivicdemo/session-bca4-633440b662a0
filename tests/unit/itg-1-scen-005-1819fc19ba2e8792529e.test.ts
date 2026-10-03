import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  ...jest.requireActual<typeof import('../../src/logic/business-day-deadline-judgment')>('../../src/logic/business-day-deadline-judgment'),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
}));
jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
}));
jest.mock('../../src/logic/daily-report-submission', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-submission')>('../../src/logic/daily-report-submission'),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-non-submission-detection')>('../../src/logic/daily-report-non-submission-detection'),
}));

import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as submissionModule from '../../src/logic/daily-report-submission';
import * as nonSubmissionModule from '../../src/logic/daily-report-non-submission-detection';

const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '1', emailAddress: 'r1@example.com', department: 'A', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '2', emailAddress: 'r2@example.com', department: 'A', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '3', emailAddress: 'r3@example.com', department: 'A', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '4', emailAddress: 'r4@example.com', department: 'A', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '5', emailAddress: 'r5@example.com', department: 'A', status: 'active' },
];

describe('SCEN-005: 日報提出に失敗', () => {
  const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = { timezone: 'Asia/Tokyo', locale: 'ja-JP' };

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue({
      shouldExecute: true, isBusinessDay: true, isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null, executionReason: 'test',
    });

    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      success: true, reporters: REPORTERS as any, totalCount: 5, message: 'OK',
    });

    jest.spyOn(authModule, 'authenticateAndAuthorizeReporterAccess').mockResolvedValue({
      isAccessGranted: true, userId: 'U001', denialReason: null,
    });

    let submitCount = 0;
    jest.spyOn(submissionModule, 'submitDailyReport').mockImplementation((input: any) => {
      submitCount++;
      if (submitCount === 2) {
        const err = new Error('日報の提出に失敗しました。システム管理者に連絡してください。');
        (err as any).name = 'DailyReportSubmissionError';
        return Promise.reject(err);
      }
      return Promise.resolve({
        dailyReportId: `DR-${input.userId}`, userId: input.userId, reportDate: '2024-01-15',
        submissionTimestamp: new Date().toISOString(), submissionStatus: 'submitted',
        notificationTriggered: true, completionMessage: 'OK',
      });
    });

    jest.spyOn(nonSubmissionModule, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      success: true, nonSubmittedReporters: [], totalDetected: 0, detectionLog: {
        detectionLogId: 'DL005',
        targetDate: '2024-01-15',
        detectionDateTime: new Date().toISOString(),
        totalReportersCount: 5,
        nonSubmittedCount: 0,
        submittedCount: 5,
      },
      detectionTimestamp: new Date().toISOString(),
    });
  });

  it('executionStatusがfailureで、DailyReportSubmissionErrorが記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({ executionTimestamp, targetDate, systemContext }, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.reportsSubmitted).toBeLessThanOrEqual(1);
    expect(result.errors!.some(e => e.errorCode === 'DailyReportSubmissionError')).toBe(true);
  });
});
