import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { retrieveLeaderDashboardData } from '../../src/logic/daily-report-management-view';
import type { RetrieveLeaderDashboardDataInput } from '../../src/logic/daily-report-management-view';

describe('SCEN-569: リーダーメールアドレスの形式が不正である場合、例外がスローされる', () => {
  let mockAuthenticateAndAuthorizeLeaderAccess: any;
  let mockJudgeBusinessDayAndDeadline: any;
  let mockRetrieveDailyReportsForLeaderReview: any;
  let mockRetrieveNonSubmissionDetectionLogsByDate: any;
  let mockRetrieveEmailSendingHistoryByDateRange: any;
  let mockValidateAndDeliverLeaderNotification: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const authModule = require('../../src/logic/user-authentication-authorization');
    const judgmentModule = require('../../src/logic/business-day-deadline-judgment');
    const persistenceModule = require('../../src/logic/daily-report-persistence');
    const detectionModule = require('../../src/logic/daily-report-non-submission-detection');
    const notificationModule = require('../../src/logic/daily-report-reminder-notification');

    mockAuthenticateAndAuthorizeLeaderAccess = authModule.authenticateAndAuthorizeLeaderAccess;
    mockJudgeBusinessDayAndDeadline = judgmentModule.judgeBusinessDayAndDeadline;
    mockRetrieveDailyReportsForLeaderReview = persistenceModule.retrieveDailyReportsForLeaderReview;
    mockRetrieveNonSubmissionDetectionLogsByDate = detectionModule.retrieveNonSubmissionDetectionLogsByDate;
    mockRetrieveEmailSendingHistoryByDateRange = notificationModule.retrieveEmailSendingHistoryByDateRange;
    mockValidateAndDeliverLeaderNotification = notificationModule.validateAndDeliverLeaderNotification;

    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      leaderId: 'leader-001',
      isAuthorized: true,
    });
    mockJudgeBusinessDayAndDeadline.mockResolvedValue(true);
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);

    mockValidateAndDeliverLeaderNotification.mockImplementation(() => {
      const error = new Error('メールアドレスの形式が無効です。正しいアドレスを入力してください。');
      throw error;
    });
  });

  it('メール配信検証でメールアドレス形式が不正と判定された場合、例外がスローされる', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(
      'メールアドレスの形式が無効です。正しいアドレスを入力してください。'
    );
  });

  it('メール配信検証関数が呼び出された時点で形式検証エラーが発生する', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'leader-001',
      targetDate: '2026-09-24',
    };

    try {
      await retrieveLeaderDashboardData(input);
    } catch {
      // Expected error
    }

    expect(mockValidateAndDeliverLeaderNotification).toHaveBeenCalled();
  });
});
