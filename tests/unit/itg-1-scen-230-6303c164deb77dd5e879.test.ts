import { detectNonSubmittedReportersAtDeadline, SubmissionStatusCheckFailureError } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-230: 提出期限の時刻が設定されていない場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submissionDeadlineTime が null の場合は SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: null,
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input as any)
    ).rejects.toThrow(SubmissionStatusCheckFailureError);

    try {
      await detectNonSubmittedReportersAtDeadline(input as any);
    } catch (error: any) {
      expect(error.message).toContain('日報提出状況の確認に失敗しました。');
    }
  });

  it('submissionDeadlineTime が空文字列の場合は SubmissionStatusCheckFailureError をスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow(SubmissionStatusCheckFailureError);

    try {
      await detectNonSubmittedReportersAtDeadline(input);
    } catch (error: any) {
      expect(error.message).toContain('日報提出状況の確認に失敗しました。');
    }
  });
});
