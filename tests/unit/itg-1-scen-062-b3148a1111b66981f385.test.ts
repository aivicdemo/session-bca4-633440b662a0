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

describe('SCEN-062: 提出ユーザー情報に必須項目不足・形式不正・重複メールアドレスが含まれる場合、UserInformationValidationErrorが発生する', () => {
  let mockAiClient: any;

  beforeEach(() => {
    mockAiClient = {
      invokeModel: jest.fn(),
    };
  });

  it('should throw UserInformationValidationError when required fields are missing', async () => {
    const leaderUserId = 'leader001';
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const targetDate = new Date('2024-01-15');

    const userInformationSubmissions: any = [
      {
        userId: 'user001',
        userName: null,
        email: null,
        department: '営業部',
        role: '報告者',
      },
    ];

    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    await expect(runTx6Imp1Agent(input, mockAiClient)).rejects.toThrow();
  });

  it('should throw UserInformationValidationError when email format is invalid', async () => {
    const leaderUserId = 'leader001';
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const targetDate = new Date('2024-01-15');

    const userInformationSubmissions = [
      {
        userId: 'user001',
        userName: '田中太郎',
        email: 'invalid-email-without-at-sign',
        department: '営業部',
        role: '報告者',
      },
    ];

    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    await expect(runTx6Imp1Agent(input, mockAiClient)).rejects.toThrow();
  });

  it('should throw UserInformationValidationError when email addresses are duplicated', async () => {
    const leaderUserId = 'leader001';
    const executionTimestamp = new Date('2024-01-15T10:00:00Z');
    const targetDate = new Date('2024-01-15');

    const userInformationSubmissions = [
      {
        userId: 'user001',
        userName: '田中太郎',
        email: 'duplicate@example.com',
        department: '営業部',
        role: '報告者',
      },
      {
        userId: 'user002',
        userName: '鈴木花子',
        email: 'duplicate@example.com',
        department: '営業部',
        role: '報告者',
      },
    ];

    const input: Tx6Imp1AgentInput = {
      leaderUserId,
      userInformationSubmissions,
      executionTimestamp,
      targetDate,
    };

    await expect(runTx6Imp1Agent(input, mockAiClient)).rejects.toThrow();
  });
});
