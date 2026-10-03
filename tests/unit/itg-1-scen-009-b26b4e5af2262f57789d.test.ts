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

describe('SCEN-009: 5名中3名が提出、2名未提出で催促が送信', () => {
  const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = { timezone: 'Asia/Tokyo', locale: 'ja-JP' };

  const REPORTERS = [
    { reporterId: 'reporter1', userId: 'reporter1', reporterName: 'reporter1', emailAddress: 'r1@example.com', department: 'A', status: 'active' },
    { reporterId: 'reporter2', userId: 'reporter2', reporterName: 'reporter2', emailAddress: 'r2@example.com', department: 'A', status: 'active' },
    { reporterId: 'reporter3', userId: 'reporter3', reporterName: 'reporter3', emailAddress: 'r3@example.com', department: 'A', status: 'active' },
    { reporterId: 'reporter4', userId: 'reporter4', reporterName: 'reporter4', emailAddress: 'r4@example.com', department: 'A', status: 'active' },
    { reporterId: 'reporter5', userId: 'reporter5', reporterName: 'reporter5', emailAddress: 'r5@example.com', department: 'A', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue({
      shouldExecute: true, isBusinessDay: true, isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null, executionReason: 'test',
    });

    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      success: true, reporters: REPORTERS as any, totalCount: 5, message: 'OK',
    });

    jest.spyOn(authModule, 'authenticateAndAuthorizeReporterAccess').mockImplementation((input: any) => {
      if (['reporter4', 'reporter5'].includes(input.userId)) {
        const err = new Error('認証失敗');
        (err as any).name = 'ReporterAuthenticationError';
        return Promise.reject(err);
      }
      return Promise.resolve({ isAccessGranted: true, userId: input.userId, denialReason: null });
    });

    jest.spyOn(submissionModule, 'submitDailyReport').mockResolvedValue({
      dailyReportId: 'DR-x', userId: 'U001', reportDate: '2024-01-15',
      submissionTimestamp: new Date().toISOString(), submissionStatus: 'submitted',
      notificationTriggered: true, completionMessage: 'OK',
    });

    jest.spyOn(notificationModule, 'sendLeaderSubmissionNotification').mockResolvedValue({
      success: true, notificationId: 'N1', sentAt: new Date(), deliveryMethod: 'email', errorDetails: null,
    });

    jest.spyOn(nonSubmissionModule, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      success: true, nonSubmittedReporters: [
        { userId: 'reporter4', reporterId: 'reporter4', reporterName: 'reporter4', emailAddress: 'r4@example.com', lastSubmittedDate: null } as any,
        { userId: 'reporter5', reporterId: 'reporter5', reporterName: 'reporter5', emailAddress: 'r5@example.com', lastSubmittedDate: null } as any,
      ], totalDetected: 2, detectionLog: {
        detectionLogId: 'DL009',
        targetDate: '2024-01-15',
        detectionDateTime: new Date().toISOString(),
        totalReportersCount: 5,
        nonSubmittedCount: 2,
        submittedCount: 3,
      }, detectionTimestamp: new Date().toISOString(),
    });

    jest.spyOn(notificationModule, 'sendLeaderNonSubmissionPromptNotification').mockResolvedValue({
      success: true, notificationId: 'N2', sentAt: new Date(), deliveryMethod: 'email',
      nonSubmittedReporterCount: 2, errorDetails: null,
    });
  });

  it('executionStatusがpartial_successで、提出3名、催促2名', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({ executionTimestamp, targetDate, systemContext }, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters.length).toBe(2);
    expect(result.promptsSent).toBe(2);
    expect(result.leaderNotificationsSent).toBe(3);
    expect(result.errors ?? []).toEqual([]);
  });
});
