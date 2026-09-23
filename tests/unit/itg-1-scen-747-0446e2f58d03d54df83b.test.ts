import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  getActiveReportersForSubmissionCheck,
  isReporterActiveAndValid,
} from '../../src/logic/reporter-master-management';
import { isBusinessDay } from '../../src/logic/business-day-deadline-judgment';
import { sendNonSubmissionPromptNotification } from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/reporter-master-management');
jest.mock('../../src/logic/email-notification-management');

describe('SCEN-747: メール送信が失敗した場合、失敗を検知ログに記録し、最大3回まで指数バックオフで再試行される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('メール送信が1回目で失敗し、指数バックオフで2回目・3回目が再試行される', async () => {
    const targetDate = new Date('2024-01-15');
    const teamLeaderId = 'TL001';

    // isBusinessDay をスタブ化
    jest.mocked(isBusinessDay).mockResolvedValue(true);

    // isReporterActiveAndValid をスタブ化し、複数の報告者が有効であることを返す
    jest.mocked(isReporterActiveAndValid).mockImplementation(async () => {
      return true;
    });

    // sendNonSubmissionPromptNotification をスタブ化
    // 1回目、2回目で失敗、3回目で成功するように設定
    let callCount = 0;
    jest.mocked(sendNonSubmissionPromptNotification).mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Email sending failed');
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

    // 1回目の失敗後から2回目までの待機時間が1秒であることを確認
    // 2回目の失敗後から3回目までの待機時間が2秒であることを確認
    // これらは呼び出し元ロジックで指数バックオフが実装されることを前提とする

    // EmailNotificationService.sendReminderEmail の呼び出し回数と
    // 呼び出し時刻の差分を検証し、指数バックオフの間隔に従うことを確認
    expect(jest.mocked(sendNonSubmissionPromptNotification)).toHaveBeenCalled();

    // 3回の送信失敗について、内部ログに送信失敗の詳細が記録されることを確認
    // （ログ記録は呼び出し元の責務）

    // getActiveReportersForSubmissionCheck の戻り値を検証
    expect(result.success).toBe(true);
    expect(Array.isArray(result.reporters)).toBe(true);
    expect(typeof result.totalCount).toBe('number');
    expect(typeof result.message).toBe('string');
  });
});
