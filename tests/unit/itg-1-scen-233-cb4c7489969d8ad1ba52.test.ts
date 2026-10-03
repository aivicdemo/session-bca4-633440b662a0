import {
  detectNonSubmittedReportersAtDeadline,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-233: 提出期限時刻が24時間形式でない場合は処理できない', () => {
  it('submissionDeadlineTime に24時間形式でない値（25:00）を入力すると、エラーが throw される', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '25:00',
      teamId: 'team-001',
    };

    // 期待結果: 24時間形式に違反する場合、エラーが throw される
    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });

  it('submissionDeadlineTime に不正な形式値を複数入力しても、すべてエラーが throw される', async () => {
    const invalidFormats = ['25:00', 'abc:00', '99:99', '-1:00'];

    for (const format of invalidFormats) {
      const input = {
        targetDate: '2024-01-15',
        currentDateTime: '2024-01-15T17:00:00Z',
        submissionDeadlineTime: format,
        teamId: 'team-001',
      };

      await expect(
        detectNonSubmittedReportersAtDeadline(input)
      ).rejects.toThrow();
    }
  });
});
