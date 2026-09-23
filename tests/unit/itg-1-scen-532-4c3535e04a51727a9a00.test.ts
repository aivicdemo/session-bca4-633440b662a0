import { jest } from '@jest/globals';
import {
  sendNonSubmissionPromptNotification,
  InvalidPromptTargetListError,
} from '../../src/logic/email-notification-management';

describe('SCEN-532: 催促対象者リストが空またはnullのとき、InvalidPromptTargetListErrorが発生する', () => {
  it('should throw InvalidPromptTargetListError when nonSubmittedReporters is an empty array', async () => {
    const leaderUserId = 'leader001';
    const leaderEmailAddress = 'leader@example.com';
    const detectionLogId = 'log-20240115-001';
    const promptReason = '定時リマインダー';
    const targetDate = '2024-01-15';

    // 空配列を渡す
    const emptyReportersList: any[] = [];

    // 呼び出し結果がエラーをスローするか確認
    await expect(
      sendNonSubmissionPromptNotification({
        nonSubmittedReporters: emptyReportersList,
        leaderUserId,
        leaderEmailAddress,
        detectionLogId,
        promptReason,
        targetDate,
      })
    ).rejects.toThrow(InvalidPromptTargetListError);

    // エラーメッセージを検証
    await expect(
      sendNonSubmissionPromptNotification({
        nonSubmittedReporters: emptyReportersList,
        leaderUserId,
        leaderEmailAddress,
        detectionLogId,
        promptReason,
        targetDate,
      })
    ).rejects.toThrow('催促対象者リストが空です。');
  });
});
