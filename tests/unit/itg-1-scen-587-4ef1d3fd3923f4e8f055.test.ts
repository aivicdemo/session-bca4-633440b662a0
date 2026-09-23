import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  retrieveNonSubmissionDetectionDetails,
  UnauthorizedLeaderAccess,
} from '../../src/logic/daily-report-management-view';
import { retrieveNonSubmissionDetectionLogsByDate } from '../../src/logic/daily-report-persistence';
import { retrieveReporterByUserId } from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-587: 自身のチーム以外の検知ログにアクセスしようとすると、UnauthorizedLeaderAccess エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('自身のチーム以外の検知ログにアクセスするとUnauthorizedLeaderAccessエラーが発生する', async () => {
    // リーダーBのチーム検知ログにリーダーAがアクセスを試みる
    const detectionLogId = 'log-team-b-001';
    const leaderId = 'leader-a';

    // スタブ準備：検知ログは存在するが、別チーム（営業部B）に属する
    jest.mocked(retrieveNonSubmissionDetectionLogsByDate).mockResolvedValue([
      {
        detectionLogId: 'log-team-b-001',
        targetDate: '2024-01-15',
        detectionDateTime: '2024-01-15T09:30:00Z',
        nonSubmittedReporters: [
          { userId: 'USER-003', name: '田中次郎', team: '営業部B' },
        ],
      },
    ]);

    // スタブ準備：リーダーAの所属チームは営業部（営業部Bではない）
    jest.mocked(retrieveReporterByUserId).mockResolvedValue({ team: '営業部' });

    // 期待動作：UnauthorizedLeaderAccess エラーが発生すること
    try {
      await retrieveNonSubmissionDetectionDetails({
        detectionLogId,
        leaderId,
      });
      // エラーが発生しない場合はテスト失敗
      throw new Error('UnauthorizedLeaderAccessエラーが発生すべきですが、発生しませんでした。');
    } catch (error) {
      // エラーが UnauthorizedLeaderAccess であることを確認
      if (!(error instanceof UnauthorizedLeaderAccess)) {
        throw error;
      }
      // エラー文言が『このログへのアクセス権限がありません。』であることを確認
      expect(error.message).toBe('このログへのアクセス権限がありません。');
    }
  });
});
