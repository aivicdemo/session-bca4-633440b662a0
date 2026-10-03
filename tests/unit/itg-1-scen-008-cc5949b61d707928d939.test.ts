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

const REPORTERS = Array.from({ length: 5 }, (_, i) => ({
  reporterId: `R${i + 1}`, userId: `U${i + 1}`, reporterName: `${i + 1}`,
  emailAddress: `r${i + 1}@example.com`, department: 'A', status: 'active',
}));

describe('SCEN-008: 催促メール送信に失敗', () => {
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
        { userId: 'U004', reporterId: 'R004', reporterName: '4', emailAddress: 'r4@example.com', lastSubmittedDate: null } as any,
        { userId: 'U005', reporterId: 'R005', reporterName: '5', emailAddress: 'r5@example.com', lastSubmittedDate: null } as any,
      ], totalDetected: 2, detectionLog: {
        detectionLogId: 'DL008',
        targetDate: '2024-01-15',
        detectionDateTime: new Date().toISOString(),
        totalReportersCount: 5,
        nonSubmittedCount: 2,
        submittedCount: 3,
      }, detectionTimestamp: new Date().toISOString(),
    });

    const promptErr = new Error('未提出者への催促送信に失敗しました。メール送信状態を確認してください。');
    (promptErr as any).name = 'NonSubmissionPromptError';
    jest.spyOn(notificationModule, 'sendLeaderNonSubmissionPromptNotification').mockRejectedValue(promptErr);
  });

  it('executionStatusがpartial_successで、promptsSentが0', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({ executionTimestamp, targetDate, systemContext }, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.promptsSent).toBe(0);
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.leaderNotificationsSent).toBe(3);
    expect(result.errors!.some(e => e.errorCode === 'NonSubmissionPromptError')).toBe(true);
  });
});
