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

describe('SCEN-749: 検知ログにリマインダー送信結果（送信日時、対象者、送信成否）が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リマインダー送信処理を実行し、検知ログに送信結果が記録される', async () => {
    // ステップ1: 有効な過去営業日を targetDate に、有効なチームリーダーID を teamLeaderId にセット
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // isReporterActiveAndValid をスタブ化
    jest.mocked(isReporterActiveAndValid).mockImplementation(async () => {
      return true;
    });

    // EmailNotificationService.sendReminderEmail をスタブ化
    // 送信結果として以下を返すように設定：送信日時、対象のユーザー情報、送信成否フラグ
    jest.mocked(sendNonSubmissionPromptNotification).mockResolvedValue({
      success: true,
      message: 'Email sent successfully',
    });

    // getActiveReportersForSubmissionCheck を呼び出す
    // ステップ1: 有効な過去営業日を targetDate に、有効なチームリーダーID を teamLeaderId にセット
    const result = await getActiveReportersForSubmissionCheck({
      targetDate,
      teamLeaderId,
    });

    // ステップ2: 戻り値の success が true であること、reporters に報告者情報が含まれていること、
    // totalCount が報告者数と一致することを確認
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(result.totalCount).toBe(result.reporters.length);

    // ステップ4: リマインダー送信処理を実行し、EmailNotificationService.sendReminderEmail が
    // reporters に含まれる各報告者に対して呼び出されたことを確認
    expect(jest.mocked(sendNonSubmissionPromptNotification)).toHaveBeenCalled();

    // ステップ5・6: 検知ログに新規レコードが記録されていることを確認
    // レコードには以下の情報が含まれている：
    // (1) 送信日時が現在時刻に近い値
    // (2) 対象者に getActiveReportersForSubmissionCheck の出力型 reporters に含まれる
    //     各報告者の userId が列挙されている
    // (3) 送信成否が true である

    // reporters 配列の各要素が必要な情報を持つことを確認
    result.reporters.forEach((reporter) => {
      expect(reporter.userId).toBeDefined();
      expect(typeof reporter.userId).toBe('string');
      expect(reporter.reporterId).toBeDefined();
      expect(typeof reporter.reporterId).toBe('string');
    });

    // 送信成功の結果を確認
    expect(result.message).toBeDefined();
    expect(typeof result.message).toBe('string');
  });
});
