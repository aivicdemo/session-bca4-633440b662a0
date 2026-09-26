import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/business-day-deadline-judgment');
jest.mock('../../src/logic/daily-report-persistence');
jest.mock('../../src/logic/daily-report-non-submission-detection');
jest.mock('../../src/logic/daily-report-reminder-notification');

import { retrieveLeaderDashboardData, DataRetrievalFailedError } from '../../src/logic/daily-report-management-view';
import type { RetrieveLeaderDashboardDataInput } from '../../src/logic/daily-report-management-view';

describe('SCEN-568: リーダーメールアドレスが空または登録されていない場合に例外がスローされる', () => {
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

    mockAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({ leaderId: 'valid-leader-001', isAuthorized: true });
    mockJudgeBusinessDayAndDeadline.mockResolvedValue(true);
    mockRetrieveDailyReportsForLeaderReview.mockResolvedValue([]);
    mockRetrieveNonSubmissionDetectionLogsByDate.mockResolvedValue([]);
    mockRetrieveEmailSendingHistoryByDateRange.mockResolvedValue([]);
    mockValidateAndDeliverLeaderNotification.mockResolvedValue({
      isValid: false,
      failureReason: 'メールアドレスが登録されていません',
    });
  });

  it('メール配信検証でメールアドレスが登録されていないと判定された場合、DataRetrievalFailedError がスローされる', async () => {
    const input: RetrieveLeaderDashboardDataInput = {
      leaderId: 'valid-leader-001',
      targetDate: '2025-01-15',
    };

    await expect(retrieveLeaderDashboardData(input)).rejects.toThrow(DataRetrievalFailedError);
  });
});
