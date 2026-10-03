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

const REPORTERS = [
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: 'A', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: 'A', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: 'A', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: 'A', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: 'A', status: 'active' },
];

describe('SCEN-004: 日報生成に失敗し、生成エラーが記録', () => {
  const executionTimestamp = new Date('2024-01-15T17:05:00+09:00');
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

    jest.spyOn(submissionModule, 'submitDailyReport').mockImplementation((input: any) => {
      if (input.userId === 'U005') {
        const err = new Error('日報の生成に失敗しました。入力内容を確認してください。');
        (err as any).name = 'DailyReportGenerationError';
        return Promise.reject(err);
      }
      return Promise.resolve({
        dailyReportId: `DR-${input.userId}`, userId: input.userId, reportDate: '2024-01-15',
        submissionTimestamp: new Date().toISOString(), submissionStatus: 'submitted',
        notificationTriggered: true, completionMessage: 'OK',
      });
    });

    jest.spyOn(notificationModule, 'sendLeaderSubmissionNotification').mockResolvedValue({
      success: true, notificationId: 'N1', sentAt: new Date(), deliveryMethod: 'email', errorDetails: null,
    });

    jest.spyOn(nonSubmissionModule, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      success: true, nonSubmittedReporters: [
        { userId: 'U004', reporterId: 'R004', reporterName: '4', emailAddress: 'r4@example.com', lastSubmittedDate: null } as any,
        { userId: 'U005', reporterId: 'R005', reporterName: '5', emailAddress: 'r5@example.com', lastSubmittedDate: null } as any,
      ], totalDetected: 2, detectionLog: {
        detectionLogId: 'DL004',
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

  it('executionStatusがpartial_successで、エラーが記録される', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({ executionTimestamp, targetDate, systemContext }, mockAiClient);

    expect(result.executionStatus).toBe('partial_success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(3);
    expect(result.nonSubmittedReporters.length).toBe(2);
    expect(result.errors!.some(e => e.errorCode === 'DailyReportGenerationError')).toBe(true);
  });
});
