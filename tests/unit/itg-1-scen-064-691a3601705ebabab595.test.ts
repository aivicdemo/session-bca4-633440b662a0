import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx6Imp1Agent,
  type Tx6Imp1AiClient,
  type Tx6Imp1AgentInput,
} from '../../src/agents/tx-6-imp-1/orchestrator';

jest.mock('../../src/logic/user-authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-authentication-authorization')>('../../src/logic/user-authentication-authorization'),
}));

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
}));

jest.mock('../../src/logic/user-information-input-confirmation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-information-input-confirmation')>('../../src/logic/user-information-input-confirmation'),
}));

jest.mock('../../src/logic/reporter-master-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/reporter-master-management')>('../../src/logic/reporter-master-management'),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
}));

jest.mock('../../src/logic/email-notification-management', () => ({
  ...jest.requireActual<typeof import('../../src/logic/email-notification-management')>('../../src/logic/email-notification-management'),
}));

jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-non-submission-detection')>('../../src/logic/daily-report-non-submission-detection'),
}));

jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-reminder-notification')>('../../src/logic/daily-report-reminder-notification'),
}));

jest.mock('../../src/logic/daily-report-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/daily-report-persistence')>('../../src/logic/daily-report-persistence'),
}));

describe('SCEN-064: 承認済みユーザー情報をメール送信できない場合、EmailNotificationFailureErrorが発生し出力に失敗通知が含まれる', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      invokeModel: jest.fn(),
    };
  });

  it('should return partial_success when email notification fails for some users', async () => {
    const leaderUserId = 'leader001';
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const targetDate = new Date('2024-01-15');

    const userInformationSubmissions = [
      {
        userId: 'user001',
        userName: '田中太郎',
        email: 'tanaka@example.com',
        department: '営業部',
        role: '報告者',
      },
      {
        userId: 'user002',
        userName: '鈴木花子',
        email: 'suzuki@example.com',
        department: '営業部',
        role: '報告者',
      },
      {
        userId: 'user003',
        userName: '佐藤次郎',
        email: 'sato@example.com',
        department: 'IT部',
        role: '報告者',
      },
      {
        userId: 'user004',
        userName: '伊藤美咲',
        email: 'ito@example.com',
        department: '営業部',
        role: '報告者',
      },
      {
        userId: 'user005',
        userName: '渡辺健一',
        email: 'watanabe@example.com',
        department: '管理部',
        role: '報告者',
      },
    ];

    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    const result = await runTx6Imp1Agent(input, mockAiClient);

    expect(result).toBeDefined();
    expect(result.executionStatus).toBe('partial_failure');
    expect(result.notificationSendingResult.approvalNotificationsSent).toBe(3);
    expect(result.notificationSendingResult.failedNotifications.length).toBe(1);
    expect(result.notificationSendingResult.failedNotifications[0].userId).toBeDefined();
    expect(result.notificationSendingResult.failedNotifications[0].type).toBe('approval_notification');
    expect(result.notificationSendingResult.failedNotifications[0].reason).toContain('送信に失敗');
    expect(result.userInformationProcessingResult.approved).toBe(5);
    expect(result.userInformationProcessingResult.errors).toEqual([]);
  });
});
