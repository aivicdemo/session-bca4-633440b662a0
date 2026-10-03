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
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-reminder-notification')>('../../src/logic/daily-report-reminder-notification'),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-non-submission-detection')>('../../src/logic/daily-report-non-submission-detection'),
}));

import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as businessDayModule from '../../src/logic/business-day-deadline-judgment';
import * as reporterMasterModule from '../../src/logic/reporter-master-management';
import * as authModule from '../../src/logic/user-authentication-authorization';
import * as submissionModule from '../../src/logic/daily-report-submission';
import * as notificationModule from '../../src/logic/daily-report-reminder-notification';
import * as nonSubmissionModule from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-007: 未提出者検知に失敗', () => {
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
      success: true, reporters: [
        { reporterId: 'R001', userId: 'U001', reporterName: '1', emailAddress: 'r1@example.com', department: 'A', status: 'active' },
        { reporterId: 'R002', userId: 'U002', reporterName: '2', emailAddress: 'r2@example.com', department: 'A', status: 'active' },
      ] as any, totalCount: 2, message: 'OK',
    });

    jest.spyOn(authModule, 'authenticateAndAuthorizeReporterAccess').mockResolvedValue({
      isAccessGranted: true, userId: 'U001', denialReason: null,
    });

    jest.spyOn(submissionModule, 'submitDailyReport').mockResolvedValue({
      dailyReportId: 'DR-x', userId: 'U001', reportDate: '2024-01-15',
      submissionTimestamp: new Date().toISOString(), submissionStatus: 'submitted',
      notificationTriggered: true, completionMessage: 'OK',
    });

    jest.spyOn(notificationModule, 'sendLeaderSubmissionNotification').mockResolvedValue({
      success: true, notificationId: 'N1', sentAt: new Date(), deliveryMethod: 'email', errorDetails: null,
    });

    const detErr = new Error('未提出者の検知に失敗しました。システム管理者に連絡してください。');
    (detErr as any).name = 'NonSubmissionDetectionError';
    jest.spyOn(nonSubmissionModule, 'detectNonSubmittedReportersAtDeadline').mockRejectedValue(detErr);
  });

  it('executionStatusがfailureで、NonSubmissionDetectionErrorが記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({ executionTimestamp, targetDate, systemContext }, mockAiClient);

    expect(result.executionStatus).toBe('failure');
    expect(result.promptsSent).toBe(0);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.errors!.some(e => e.errorCode === 'NonSubmissionDetectionError')).toBe(true);
  });
});
