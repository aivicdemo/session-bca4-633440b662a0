import {
  detectNonSubmittedReportersAtDeadline,
  SubmissionStatusCheckFailureError,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-236: システムの現在日時が取得できない場合は処理を拒否する', () => {
  it('currentDateTime が null の場合、SubmissionStatusCheckFailureError が throw される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: null as any,
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });

  it('currentDateTime が空文字列の場合、エラーが throw される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });

  it('currentDateTime が無効な日時形式の場合、エラーが throw される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: 'invalid-date',
      submissionDeadlineTime: '17:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });
});
