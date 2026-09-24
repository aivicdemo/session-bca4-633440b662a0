jest.mock('../../src/logic/daily-report-non-submission-detection', () => ({
  generateNonSubmissionDetectionResult: jest.fn(),
}));

import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  GenerateNonSubmissionDetectionResultOutput,
  NonSubmissionDetectionLog,
  DashboardDisplayData,
  PromptNotificationData,
} from '../../src/logic/daily-report-non-submission-detection';

const mockedGenerateNonSubmissionDetectionResult = generateNonSubmissionDetectionResult as jest.Mock;

describe('SCEN-271: 未提出者リストが空配列で検知ログの未提出数が0のとき、管理画面表示用データと催促通知用データが整形される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('空配列の未提出者リストと検知ログから、整形されたダッシュボード表示データと催促通知データが生成される', async () => {
    // テスト用の検知ログオブジェクト
    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'DL-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T09:00:00Z',
      totalReportersCount: 5,
      nonSubmittedCount: 0,
      submittedCount: 5,
    };

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [],
      detectionLog,
      detectionTimestamp: '2024-01-15T09:00:00Z',
    };

    // Mock の設定：空配列の未提出者と整形済みデータを返す
    const mockResult: GenerateNonSubmissionDetectionResultOutput = {
      dashboardDisplayData: {
        nonSubmittedReportersForDisplay: [],
        detectionLogForDisplay: {
          detectionLogId: 'DL-001',
          targetDate: '2024-01-15',
          detectionDateTime: '2024-01-15T09:00:00Z',
          totalReportersCount: 5,
          nonSubmittedCount: 0,
          submittedCount: 5,
        },
        summaryStatistics: {
          nonSubmissionRate: 0,
          detectionExecutedAt: '2024-01-15T09:00:00Z',
        },
      },
      promptNotificationData: {
        nonSubmittedReportersForNotification: [],
        notificationContext: {
          detectionLogId: 'DL-001',
          targetDate: '2024-01-15',
          detectionTimestamp: '2024-01-15T09:00:00Z',
        },
      },
    };

    mockedGenerateNonSubmissionDetectionResult.mockResolvedValue(mockResult);

    // 関数を呼び出す
    const result = await generateNonSubmissionDetectionResult(input);

    // dashboardDisplayData フィールドが存在することを検証
    expect(result.dashboardDisplayData).toBeDefined();

    // dashboardDisplayData の構造を検証
    const dashboardData: DashboardDisplayData = result.dashboardDisplayData;
    expect(dashboardData.nonSubmittedReportersForDisplay).toBeDefined();
    expect(Array.isArray(dashboardData.nonSubmittedReportersForDisplay)).toBe(true);
    expect(dashboardData.nonSubmittedReportersForDisplay.length).toBe(0);

    expect(dashboardData.detectionLogForDisplay).toBeDefined();
    expect(dashboardData.detectionLogForDisplay.detectionLogId).toBe('DL-001');
    expect(dashboardData.detectionLogForDisplay.targetDate).toBe('2024-01-15');
    expect(dashboardData.detectionLogForDisplay.detectionDateTime).toBe('2024-01-15T09:00:00Z');
    expect(dashboardData.detectionLogForDisplay.totalReportersCount).toBe(5);
    expect(dashboardData.detectionLogForDisplay.nonSubmittedCount).toBe(0);
    expect(dashboardData.detectionLogForDisplay.submittedCount).toBe(5);

    expect(dashboardData.summaryStatistics).toBeDefined();
    expect(dashboardData.summaryStatistics.nonSubmissionRate).toBe(0);
    expect(dashboardData.summaryStatistics.detectionExecutedAt).toBe('2024-01-15T09:00:00Z');

    // promptNotificationData フィールドが存在することを検証
    expect(result.promptNotificationData).toBeDefined();

    // promptNotificationData の構造を検証
    const notificationData: PromptNotificationData = result.promptNotificationData;
    expect(notificationData.nonSubmittedReportersForNotification).toBeDefined();
    expect(Array.isArray(notificationData.nonSubmittedReportersForNotification)).toBe(true);
    expect(notificationData.nonSubmittedReportersForNotification.length).toBe(0);

    expect(notificationData.notificationContext).toBeDefined();
    expect(notificationData.notificationContext.detectionLogId).toBe('DL-001');
    expect(notificationData.notificationContext.targetDate).toBe('2024-01-15');
    expect(notificationData.notificationContext.detectionTimestamp).toBe('2024-01-15T09:00:00Z');

    // エラーが発生しないことを検証
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();

    // Mock 関数が正しく呼ばれたことを検証
    expect(mockedGenerateNonSubmissionDetectionResult).toHaveBeenCalledWith(input);
  });

  it('nonSubmittedCount が 0 で nonSubmittedReporters が空配列の場合、未提出率は 0 になる', async () => {
    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'DL-002',
      targetDate: '2024-01-16',
      detectionDateTime: '2024-01-16T09:00:00Z',
      totalReportersCount: 10,
      nonSubmittedCount: 0,
      submittedCount: 10,
    };

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: [],
      detectionLog,
      detectionTimestamp: '2024-01-16T09:00:00Z',
    };

    const mockResult: GenerateNonSubmissionDetectionResultOutput = {
      dashboardDisplayData: {
        nonSubmittedReportersForDisplay: [],
        detectionLogForDisplay: {
          detectionLogId: 'DL-002',
          targetDate: '2024-01-16',
          detectionDateTime: '2024-01-16T09:00:00Z',
          totalReportersCount: 10,
          nonSubmittedCount: 0,
          submittedCount: 10,
        },
        summaryStatistics: {
          nonSubmissionRate: 0,
          detectionExecutedAt: '2024-01-16T09:00:00Z',
        },
      },
      promptNotificationData: {
        nonSubmittedReportersForNotification: [],
        notificationContext: {
          detectionLogId: 'DL-002',
          targetDate: '2024-01-16',
          detectionTimestamp: '2024-01-16T09:00:00Z',
        },
      },
    };

    mockedGenerateNonSubmissionDetectionResult.mockResolvedValue(mockResult);

    const result = await generateNonSubmissionDetectionResult(input);

    expect(result.dashboardDisplayData.summaryStatistics.nonSubmissionRate).toBe(0);
    expect(mockedGenerateNonSubmissionDetectionResult).toHaveBeenCalledWith(input);
  });
});
