jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  judgeSchedulerExecutionTiming: jest.fn(),
}));
jest.mock('../../src/logic/reporter-master-management', () => ({
  getActiveReportersForSubmissionCheck: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  detectNonSubmittedReportersAtDeadline: jest.fn(),
}));
jest.mock('../../src/logic/non-submission-prompt-decision', () => ({
  judgePromptNecessityAndMethod: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-reminder-notification', () => ({
  sendLeaderNonSubmissionPromptNotification: jest.fn(),
}));
jest.mock('../../src/logic/daily-report-persistence', () => ({
  retrieveNonSubmissionDetectionLogsByDate: jest.fn(),
}));

import { runTx5Imp1Agent } from '../../src/agents/tx-5-imp-1/orchestrator';
import { judgeSchedulerExecutionTiming } from '../../src/logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../src/logic/reporter-master-management';
import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../src/logic/daily-report-reminder-notification';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';

const mockedJudgeSchedulerExecutionTiming = judgeSchedulerExecutionTiming as jest.Mock;
const mockedGetActiveReportersForSubmissionCheck = getActiveReportersForSubmissionCheck as jest.Mock;
const mockedDetectNonSubmittedReportersAtDeadline = detectNonSubmittedReportersAtDeadline as jest.Mock;
const mockedJudgePromptNecessityAndMethod = judgePromptNecessityAndMethod as jest.Mock;
const mockedSendLeaderNonSubmissionPromptNotification = sendLeaderNonSubmissionPromptNotification as jest.Mock;
const mockedRetrieveNonSubmissionDetectionLogsByDate = retrieveNonSubmissionDetectionLogsByDate as jest.Mock;

describe('SCEN-053: 日報提出状況の確認処理が失敗して未提出・遅延判定に進めない', () => {
  const targetDate = '2024-01-15';
  const executionContext = { scheduledAt: '09:00:00', executedBy: 'scheduler-system' };

  const ACTIVE_REPORTERS = [
    { reporterId: 'R001', userId: 'U001', reporterName: 'Reporter A', emailAddress: 'r001@example.com', department: 'Sales', status: 'active' },
    { reporterId: 'R002', userId: 'U002', reporterName: 'Reporter B', emailAddress: 'r002@example.com', department: 'Sales', status: 'active' },
    { reporterId: 'R003', userId: 'U003', reporterName: 'Reporter C', emailAddress: 'r003@example.com', department: 'Dev', status: 'active' },
    { reporterId: 'R004', userId: 'U004', reporterName: 'Reporter D', emailAddress: 'r004@example.com', department: 'Dev', status: 'active' },
    { reporterId: 'R005', userId: 'U005', reporterName: 'Reporter E', emailAddress: 'r005@example.com', department: 'Admin', status: 'active' },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    mockedJudgeSchedulerExecutionTiming.mockResolvedValue({
      shouldExecute: true,
      isBusinessDay: true,
      isWithinExecutionWindow: true,
    });

    mockedGetActiveReportersForSubmissionCheck.mockResolvedValue({
      success: true,
      reporters: ACTIVE_REPORTERS,
      totalCount: 5,
    });

    const submissionCheckError = new Error('SubmissionStatusCheckFailure');
    (submissionCheckError as any).code = 'SubmissionStatusCheckFailure';
    mockedDetectNonSubmittedReportersAtDeadline.mockRejectedValue(submissionCheckError);

    mockedJudgePromptNecessityAndMethod.mockResolvedValue({
      success: true,
      promptResults: [],
    });

    mockedSendLeaderNonSubmissionPromptNotification.mockResolvedValue({
      success: true,
      notificationsSent: [],
    });

    mockedRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue({
      success: true,
      logs: [],
    });
  });

  it('日報提出状況の確認処理（detectNonSubmittedReportersAtDeadline）が例外を発生させた場合、executionStatusがfailureになる', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.executionStatus).toBe('failure');
  });

  it('エラーが発生した場合、errorDetailsが null でなく、step=detectNonSubmittedReportersAtDeadlineを含む', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.errorDetails).not.toBeNull();
    expect(Array.isArray(result.errorDetails)).toBe(true);
    const detectionError = result.errorDetails.find((e: any) => e.step === 'detectNonSubmittedReportersAtDeadline');
    expect(detectionError).toBeDefined();
  });

  it('エラーコードが SubmissionStatusCheckFailure であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    const detectionError = result.errorDetails.find((e: any) => e.step === 'detectNonSubmittedReportersAtDeadline');
    expect(detectionError.errorCode).toBe('SubmissionStatusCheckFailure');
  });

  it('エラーメッセージが「日報提出状況の確認に失敗しました。システムログを確認してください。」であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    const detectionError = result.errorDetails.find((e: any) => e.step === 'detectNonSubmittedReportersAtDeadline');
    expect(detectionError.errorMessage).toBe('日報提出状況の確認に失敗しました。システムログを確認してください。');
  });

  it('nonSubmittedReporters が空配列であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.nonSubmittedReporters).toEqual([]);
  });

  it('delayedReporters が空配列であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.delayedReporters).toEqual([]);
  });

  it('promptNotificationsSent が空配列であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.promptNotificationsSent).toEqual([]);
  });

  it('leaderNotificationSent が false であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.leaderNotificationSent).toBe(false);
  });

  it('detectionLogId が null または未生成であること', async () => {
    const mockAiClient: any = {};
    const result = await runTx5Imp1Agent({ targetDate, executionContext }, mockAiClient);

    expect(result.detectionLogId == null).toBe(true);
  });
});
