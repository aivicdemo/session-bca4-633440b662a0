jest.mock('../../src/logic/business-day-deadline-judgment', () => ({
  isWithinSubmissionDeadline: jest.fn(),
}));

import { isWithinSubmissionDeadline } from '../../src/logic/business-day-deadline-judgment';
import { judgePromptNecessityAndMethod } from '../../src/logic/non-submission-prompt-decision';

const mockedIsWithinSubmissionDeadline = isWithinSubmissionDeadline as jest.Mock;

describe('SCEN-294: 超過時間がマイナス値（期限前）の場合、overdueDurationMinutesに負の値が設定される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('期限前（-30分）の場合、overdueDurationMinutesに-30が設定される', async () => {
    // 呼び出し先 isWithinSubmissionDeadline をスタブ化し、期限前判定を返す
    // 検知時刻16:30、期限17:00 => -30分
    mockedIsWithinSubmissionDeadline.mockResolvedValue({
      isWithinDeadline: true,
      overdueDurationMinutes: -30,
      deadlineTime: '17:00',
      detectionTime: '16:30',
    });

    const input = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T16:30:00Z',
      submissionDeadlineTime: '17:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    const result = await judgePromptNecessityAndMethod(input);

    // overdueDurationMinutes に負の値（-30）が設定される
    // 業務ルール br-tx_3-003 の計算式：minutesOverdue = (currentTime - reportDeadline) / 60
    // 検知時刻（16:30）から期限時刻（17:00）を引くと -30 分となり、期限前の状態を正確に表現する
    expect(result.overdueDurationMinutes).toBe(-30);

    // 期限前を前提とした値
    expect(result.isPromptNecessary).toBe(false);
    expect(result.promptPriority).toBe('low');
    expect(result.estimatedNonSubmissionReason).toBe('unknown');

    // 呼び出し確認
    expect(mockedIsWithinSubmissionDeadline).toHaveBeenCalledWith(
      expect.objectContaining({
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T16:30:00Z',
        submissionDeadlineTime: '17:00',
      })
    );
  });
});
