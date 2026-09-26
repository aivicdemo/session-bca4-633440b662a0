import {
  judgePromptNecessityAndMethod,
  JudgePromptNecessityAndMethodInput,
  InvalidDeadlineConfiguration,
} from '../../src/logic/non-submission-prompt-decision';

describe('SCEN-287: 提出期限の時刻が25時などの不正な値の場合、InvalidDeadlineConfigurationエラーが発生する', () => {

  it('submissionDeadlineTime が "25:00" の場合、InvalidDeadlineConfiguration エラーがスローされる', async () => {
    const input: JudgePromptNecessityAndMethodInput = {
      userId: 'user-001',
      targetDate: '2024-01-15',
      detectionDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '25:00',
      previousReminderSentCount: 0,
      previousReminderSentDateTime: null,
    };

    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow(InvalidDeadlineConfiguration);
    await expect(judgePromptNecessityAndMethod(input)).rejects.toThrow('提出期限の設定が不正です。');
  });
});
