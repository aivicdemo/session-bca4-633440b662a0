import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  sendUserInformationApprovalNotification,
  validateEmailAddressForDelivery,
  buildNotificationContent,
  recordEmailSendingHistory,
} from '../../src/logic/email-notification-management';
import type {
  SendUserInformationApprovalNotificationInput,
  SendUserInformationApprovalNotificationOutput,
} from '../../src/logic/email-notification-management';

jest.mock('../../src/logic/email-notification-management');

const mockModule = require('../../src/logic/email-notification-management');
const mockValidateEmailAddressForDelivery = mockModule.validateEmailAddressForDelivery as jest.MockedFunction<typeof validateEmailAddressForDelivery>;
const mockBuildNotificationContent = mockModule.buildNotificationContent as jest.MockedFunction<typeof buildNotificationContent>;
const mockRecordEmailSendingHistory = mockModule.recordEmailSendingHistory as jest.MockedFunction<typeof recordEmailSendingHistory>;

describe('SCEN-552: 却下理由が指定された場合、却下結果をリーダーにメール送信する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('却下理由が指定された場合、却下結果をリーダーにメール送信する', async () => {
    const input: SendUserInformationApprovalNotificationInput = {
      leaderUserId: 'leader-001',
      leaderEmailAddress: 'leader@example.com',
      reporterUserId: 'reporter-001',
      reporterName: '山田太郎',
      approvalStatus: 'rejected',
      rejectionReason: '記入内容が不十分です',
      approvalTimestamp: '2024-01-15T14:30:00Z',
      confirmingLeaderUserId: 'leader-002',
    };

    mockValidateEmailAddressForDelivery.mockResolvedValue({
      isValid: true,
      reason: null,
      errorCode: null,
    });

    mockBuildNotificationContent.mockResolvedValue({
      subject: '【却下】ユーザー情報が却下されました',
      body: 'ユーザー情報が却下されました。却下理由：記入内容が不十分です',
    });

    mockRecordEmailSendingHistory.mockResolvedValue({
      success: true,
      emailSendingHistoryId: 'history-001',
      recordedAt: '2024-01-15T14:30:05Z',
      errorMessage: null,
    });

    const result: SendUserInformationApprovalNotificationOutput = await sendUserInformationApprovalNotification(input);

    expect(result.success).toBe(true);
    expect(result.emailSendingHistoryId).toBe('history-001');
    expect(result.sentAt).toBe('2024-01-15T14:30:05Z');
    expect(result.errorMessage).toBeNull();
    expect(result.adminNotificationSent).toBe(false);

    expect(mockValidateEmailAddressForDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: 'leader@example.com',
        recipientType: 'leader',
      })
    );

    expect(mockBuildNotificationContent).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'user_information_approval',
        approvalStatus: 'rejected',
        rejectionReason: '記入内容が不十分です',
        reporterName: '山田太郎',
      })
    );

    expect(mockRecordEmailSendingHistory).toHaveBeenCalled();
  });
});
