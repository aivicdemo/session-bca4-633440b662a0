import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  UnauthorizedLeaderAccess,
} from '../../src/logic/daily-report-management-view';
import * as reportPersistenceModule from '../../src/logic/daily-report-persistence';

describe('SCEN-587: 自身のチーム以外の検知ログにアクセスしようとすると、UnauthorizedLeaderAccessエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リーダーAがリーダーBのチームの検知ログにアクセスするとUnauthorizedLeaderAccessエラーが発生する', async () => {
    const detectionLogIdTeamB = 'log-team-b-001';
    const leaderIdTeamA = 'leader-a';

    // モック: リーダーAのチームに属さない検知ログ（リーダーBのチーム）を返す
    jest.spyOn(reportPersistenceModule, 'retrieveNonSubmissionDetectionLogsByDate' as any).mockResolvedValue([
      {
        detectionLogId: detectionLogIdTeamB,
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:30:00Z',
        nonSubmittedReporters: [
          {
            userId: 'USER-999',
            userName: 'テストユーザー',
            emailAddress: 'test@example.com',
          },
        ],
      },
    ] as any);

    // エラーが発生することを確認
    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId: detectionLogIdTeamB,
        leaderId: leaderIdTeamA,
      });
      fail('Expected UnauthorizedLeaderAccess to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedLeaderAccess);
      expect((error as Error).message).toBe('このログへのアクセス権限がありません。');
    }
  });
});
