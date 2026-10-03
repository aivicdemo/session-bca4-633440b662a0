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
  { reporterId: 'R001', userId: 'U001', reporterName: '報告者1', emailAddress: 'r001@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R002', userId: 'U002', reporterName: '報告者2', emailAddress: 'r002@example.com', department: '営業部', status: 'active' },
  { reporterId: 'R003', userId: 'U003', reporterName: '報告者3', emailAddress: 'r003@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R004', userId: 'U004', reporterName: '報告者4', emailAddress: 'r004@example.com', department: '開発部', status: 'active' },
  { reporterId: 'R005', userId: 'U005', reporterName: '報告者5', emailAddress: 'r005@example.com', department: '総務部', status: 'active' },
];

describe('SCEN-001: 業務終了時刻判定成功・報告者5名全員が提出・リーダー通知完了', () => {
  const executionTimestamp = new Date('2024-01-15T17:00:00+09:00');
  const targetDate = new Date('2024-01-15T00:00:00+09:00');
  const systemContext = {
    timezone: 'Asia/Tokyo',
    locale: 'ja-JP',
    auth: { isAuthenticated: true },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(businessDayModule, 'judgeSchedulerExecutionTiming').mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
      nextScheduledExecutionTime: null,
      executionReason: '営業日の実行時刻内',
    });

    jest.spyOn(reporterMasterModule, 'getActiveReportersForSubmissionCheck').mockResolvedValue({
      success: true,
      reporters: REPORTERS,
      totalCount: REPORTERS.length,
      message: '対象報告者を取得しました。',
    });

    jest.spyOn(authModule, 'authenticateAndAuthorizeReporterAccess').mockImplementation((input: any) =>
      Promise.resolve({
        isAccessGranted: true,
        userId: input.userId,
        denialReason: null,
      })
    );

    jest.spyOn(submissionModule, 'submitDailyReport').mockImplementation((input: any) =>
      Promise.resolve({
        dailyReportId: `DR-${input.userId}`,
        userId: input.userId,
        reportDate: '2024-01-15',
        submissionTimestamp: '2024-01-15T17:03:00+09:00',
        submissionStatus: 'submitted',
        notificationTriggered: true,
        completionMessage: '日報を提出しました。',
      })
    );

    jest.spyOn(notificationModule, 'sendLeaderSubmissionNotification').mockImplementation((input: any) =>
      Promise.resolve({
        success: true,
        notificationId: `NOTIF-${input.reporterId}`,
        sentAt: new Date('2024-01-15T17:04:00+09:00'),
        deliveryMethod: 'email',
        errorDetails: null,
      })
    );

    jest.spyOn(nonSubmissionModule, 'detectNonSubmittedReportersAtDeadline').mockResolvedValue({
      success: true,
      nonSubmittedReporters: [],
      totalDetected: 0,
      detectionLog: {
        detectionLogId: 'DL001',
        targetDate: '2024-01-15',
        detectionDateTime: new Date().toISOString(),
        totalReportersCount: 5,
        nonSubmittedCount: 0,
        submittedCount: 5,
      },
      detectionTimestamp: new Date().toISOString(),
    });
  });

  it('報告者5名全員が入力を促され、提出・通知が完結し、催促が発生しない', async () => {
    const mockAiClient: any = {};
    const result = await runTx1Imp1Agent({
      executionTimestamp,
      targetDate,
      systemContext,
    }, mockAiClient);

    expect(result.executionStatus).toBe('success');
    expect(result.reportersPrompted).toBe(5);
    expect(result.reportsSubmitted).toBe(5);
    expect(result.nonSubmittedReporters).toEqual([]);
    expect(result.promptsSent).toBe(0);
    expect(result.leaderNotificationsSent).toBe(5);
    expect(result.errors ?? []).toEqual([]);
  });
});
