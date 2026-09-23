import { detectNonSubmittedReportersAtDeadline } from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-233: 提出期限時刻が24時間形式でない場合は処理できない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submissionDeadlineTime が "25:00" の場合はエラーをスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '25:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });

  it('submissionDeadlineTime が "abc:00" の場合はエラーをスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: 'abc:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });

  it('submissionDeadlineTime が "17" の場合はエラーをスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });

  it('submissionDeadlineTime が "17:00:00" の場合はエラーをスロー', async () => {
    const input = {
      targetDate: '2024-01-15',
      currentDateTime: '2024-01-15T17:00:00Z',
      submissionDeadlineTime: '17:00:00',
      teamId: 'team-001',
    };

    await expect(
      detectNonSubmittedReportersAtDeadline(input)
    ).rejects.toThrow();
  });
});
