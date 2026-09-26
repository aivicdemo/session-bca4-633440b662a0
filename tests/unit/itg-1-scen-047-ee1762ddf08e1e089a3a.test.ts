import { runTx4Imp1Agent, Tx4Imp1AiClient } from '../../src/agents/tx-4-imp-1/orchestrator';

describe('SCEN-047: 一部の報告者が日報を未提出の場合、nonSubmittedReportersに詳細情報が含まれ催促メールが送信される', () => {
  it('should handle partial submission with detailed non-submitted reporter info and send prompt notifications', async () => {
    const targetDate = '2024-01-15';
    const leaderUserId = 'leader-001';
    const teamId = 'team-A';

    const mockAiClient: Tx4Imp1AiClient = {
      judgeBusinessDayAndDeadline: jest.fn().mockResolvedValue({
        isBusinessDay: true,
        deadline: '2024-01-15T17:00:00+09:00',
      }),
      getActiveReportersForSubmissionCheck: jest.fn().mockResolvedValue([
        { userId: 'user-001', userName: 'reporter-001', reporterName: '報告者1' },
        { userId: 'user-002', userName: 'reporter-002', reporterName: '報告者2' },
        { userId: 'user-003', userName: 'reporter-003', reporterName: '報告者3' },
        { userId: 'user-004', userName: 'reporter-004', reporterName: '報告者4' },
        { userId: 'user-005', userName: 'reporter-005', reporterName: '報告者5' },
      ]),
      retrieveDailyReportsForLeaderReview: jest.fn().mockResolvedValue({
        reports: [
          { userId: 'user-001', submissionTimestamp: '2024-01-15T16:00:00+09:00' },
          { userId: 'user-002', submissionTimestamp: '2024-01-15T16:10:00+09:00' },
          { userId: 'user-003', submissionTimestamp: '2024-01-15T16:20:00+09:00' },
        ],
      }),
      detectNonSubmittedReportersAtDeadline: jest.fn().mockResolvedValue({
        nonSubmittedReporters: [
          { userId: 'user-004', userName: 'reporter-004', reporterName: '田中太郎', lastSubmissionDate: '2024-01-14' },
          { userId: 'user-005', userName: 'reporter-005', reporterName: '鈴木花子', lastSubmissionDate: null },
        ],
        detectionLogId: 'log-20240115-001',
      }),
      judgePromptNecessityAndMethod: jest.fn().mockResolvedValue({
        isPromptRequired: true,
      }),
      sendLeaderNonSubmissionPromptNotification: jest.fn().mockResolvedValue({
        sent: true,
      }),
      sendNonSubmissionPromptNotification: jest.fn().mockResolvedValue({
        sent: 2,
      }),
      retrieveLeaderDashboardData: jest.fn().mockResolvedValue({
        progressSummary: '提出率：60%（3/5）、未提出者：2名（田中太郎、鈴木花子）',
      }),
    };

    const result = await runTx4Imp1Agent(
      { targetDate, leaderUserId, teamId },
      mockAiClient
    );

    expect(result.executionStatus).toBe('success');
    expect(result.targetDate).toBe('2024-01-15');
    expect(result.submittedReportCount).toBe(3);
    expect(result.nonSubmittedReporterCount).toBe(2);

    expect(result.nonSubmittedReporters).toHaveLength(2);
    expect(result.nonSubmittedReporters[0]).toEqual({
      userId: 'user-004',
      userName: 'reporter-004',
      reporterName: '田中太郎',
      lastSubmissionDate: '2024-01-14',
    });
    expect(result.nonSubmittedReporters[1]).toEqual({
      userId: 'user-005',
      userName: 'reporter-005',
      reporterName: '鈴木花子',
      lastSubmissionDate: null,
    });

    expect(result.promptNotificationsSent).toBe(2);
    expect(result.promptNotificationsFailed).toBe(0);
    expect(result.progressSummary).toContain('提出率：60%（3/5）、未提出者：2名（田中太郎、鈴木花子）');
    expect(result.leaderNotificationSent).toBe(true);
    expect(result.detectionLogId).toBe('log-20240115-001');
    expect(result.executionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.errors === undefined || result.errors.length === 0).toBe(true);
  });
});
