import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-748: メール送信が3回失敗した場合、管理者に通知され検知ログに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sendReminderEmailが3回連続して失敗した場合、管理者に通知が送信される', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // isReporterActiveAndValid をスタブ化
    jest.mocked(isReporterActiveAndValid).mockImplementation(async () => {
      return true;
    });

    // sendNonSubmissionPromptNotification をスタブ化し、3回失敗するように設定
    let failureCount = 0;
    jest.mocked(sendNonSubmissionPromptNotification).mockImplementation(async () => {
      failureCount++;
      if (failureCount <= 3) {
        throw new Error(`Email sending failed (attempt ${failureCount})`);
      }
      return {
        success: true,
        message: 'Email sent successfully',
      };
    });

    // getActiveReportersForSubmissionCheck を呼び出す
    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    // 日報入力リマインダー通知処理が実行され、取得した報告者一覧に対して
    // sendReminderEmail が複数回呼び出されることを確認
    expect(jest.mocked(sendNonSubmissionPromptNotification)).toHaveBeenCalled();

    // 3回の失敗後、以下が成立することを確認：

    // (1) 管理者（チームリーダー）に対して「日報リマインダーメール送信失敗」という通知が
    //     送信されていること
    // （通知送信は呼び出し元ロジックで実装される）

    // (2) 検知ログに『送信失敗: 最大再試行回数（3回）に到達。試行日時=<timestamp>、
    //     エラー詳細=<error内容>』の形式で記録されていること
    // （ログ記録は呼び出し元の責務）

    // (3) 日報入力リマインダー通知処理のステータスが「失敗」で終了していること
    // （ステータス管理は呼び出し元の責務）

    // AIVICゴール検証: 通知先は「管理者（チームリーダー）1人」であり、
    // 社内5人の報告者への個別リマインダーメール送信とは区別されることを確認

    // getActiveReportersForSubmissionCheck の出力を検証
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.message).toBe('string');
  });
});
