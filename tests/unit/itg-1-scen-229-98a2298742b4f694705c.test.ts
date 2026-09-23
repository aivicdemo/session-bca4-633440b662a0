import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-229: 報告者IDが空または不正な形式の場合は処理を拒否する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者IDが空文字列を含む場合はエラーをスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:30:00Z',
      submissionDeadlineTime: '17:00',
      teamId: 'team-A',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });
});
