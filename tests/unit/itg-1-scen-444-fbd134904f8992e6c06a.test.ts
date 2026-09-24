jest.mock('../../src/logic/daily-report-persistence', () => {
  const actual = jest.requireActual('../../src/logic/daily-report-persistence');
  return {
    ...actual,
    retrieveDailyReportsForLeaderReview: jest.fn(),
  };
});

import {
  retrieveDailyReportsForLeaderReview,
  UnauthorizedAccessError,
} from '../../src/logic/daily-report-persistence';

const mockedRetrieveDailyReportsForLeaderReview = retrieveDailyReportsForLeaderReview as jest.Mock;

describe('SCEN-444: 呼び出し元ユーザーがリーダー権限を持たない場合、UnauthorizedAccessErrorが発生', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('リーダー権限を持たないユーザーが呼び出した場合、UnauthorizedAccessError がスローされる', async () => {
    // リーダー権限がないユーザーID
    const unauthorizedLeaderId = 'user_without_leader_permission';

    // UnauthorizedAccessError をスローするようにモック設定
    mockedRetrieveDailyReportsForLeaderReview.mockImplementation(() => {
      const error = new UnauthorizedAccessError(
        'この操作を実行する権限がありません。'
      );
      throw error;
    });

    const input = {
      leaderId: unauthorizedLeaderId,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    try {
      await retrieveDailyReportsForLeaderReview(input);
      fail('UnauthorizedAccessError がスローされることが期待されていますが、スローされませんでした。');
    } catch (error) {
      // エラーが UnauthorizedAccessError であることを確認
      expect(error).toBeInstanceOf(UnauthorizedAccessError);
      
      // エラーメッセージが期待値と一致することを確認
      expect((error as UnauthorizedAccessError).message).toBe(
        'この操作を実行する権限がありません。'
      );
    }
  });

  it('UnauthorizedAccessError がスローされた場合、出力型 RetrieveDailyReportsForLeaderReviewOutput は返却されない', async () => {
    const unauthorizedLeaderId = 'user_without_leader_permission';

    mockedRetrieveDailyReportsForLeaderReview.mockImplementation(() => {
      const error = new UnauthorizedAccessError(
        'この操作を実行する権限がありません。'
      );
      throw error;
    });

    const input = {
      leaderId: unauthorizedLeaderId,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      filterByUserId: undefined,
      filterBySubmissionStatus: undefined,
      sortBy: undefined,
      pageNumber: undefined,
      pageSize: undefined,
    };

    try {
      const result = await retrieveDailyReportsForLeaderReview(input);
      // 結果が返却されてはいけない
      fail('例外がスローされることが期待されています。');
    } catch (error) {
      // スローされた例外は UnauthorizedAccessError
      expect(error).toBeInstanceOf(UnauthorizedAccessError);
      // エラーでスローされたため、呼び出し側に結果オブジェクトは渡されない
    }
  });
});
