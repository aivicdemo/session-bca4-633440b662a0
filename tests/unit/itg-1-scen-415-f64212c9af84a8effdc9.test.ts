jest.mock('../../src/logic/user-authentication-authorization', () => ({
  authenticateAndAuthorizeLeaderAccess: jest.fn(),
}));

import {
  retrieveUserInformationConfirmationStatus,
  UserInformationConfirmationRecord,
} from '../../src/logic/user-information-input-confirmation';
import { authenticateAndAuthorizeLeaderAccess } from '../../src/logic/user-authentication-authorization';

const mockedAuthenticateAndAuthorizeLeaderAccess = authenticateAndAuthorizeLeaderAccess as jest.MockedFunction<any>;

describe('SCEN-415: チームリーダーが有効な権限を持つ場合、未承認・承認済み・承認期限超過のユーザー情報を正常に取得できる', () => {
  const leaderUserId = 'leader-001';
  const retrievalTimestamp = new Date('2026-09-25T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チームリーダーが有効な権限を持つ場合、正常にユーザー情報一覧を取得できる', async () => {
    // Arrange: スタブ設定
    mockedAuthenticateAndAuthorizeLeaderAccess.mockResolvedValue({
      isAccessGranted: true,
      userId: leaderUserId,
    });

    const pendingApprovalRecords: UserInformationConfirmationRecord[] = [
      {
        userInformationId: 'user-info-001',
        reporterId: 'reporter-001',
        reporterName: 'ユーザーA',
        emailAddress: 'userA@example.com',
        fullName: 'User A Full',
        department: 'Engineering',
        submissionTimestamp: new Date('2026-09-24T09:00:00Z'),
        confirmationStatus: 'pending',
        approvalDeadline: new Date('2026-09-27T23:59:59Z'),
      },
      {
        userInformationId: 'user-info-002',
        reporterId: 'reporter-002',
        reporterName: 'ユーザーB',
        emailAddress: 'userB@example.com',
        fullName: 'User B Full',
        department: 'Sales',
        submissionTimestamp: new Date('2026-09-24T10:00:00Z'),
        confirmationStatus: 'pending',
        approvalDeadline: new Date('2026-09-27T23:59:59Z'),
      },
    ];

    const approvedRecords: UserInformationConfirmationRecord[] = [
      {
        userInformationId: 'user-info-003',
        reporterId: 'reporter-003',
        reporterName: 'ユーザーC',
        emailAddress: 'userC@example.com',
        fullName: 'User C Full',
        department: 'HR',
        submissionTimestamp: new Date('2026-09-20T09:00:00Z'),
        confirmationStatus: 'approved',
        approvalDeadline: new Date('2026-09-23T23:59:59Z'),
      },
      {
        userInformationId: 'user-info-004',
        reporterId: 'reporter-004',
        reporterName: 'ユーザーD',
        emailAddress: 'userD@example.com',
        fullName: 'User D Full',
        department: 'Finance',
        submissionTimestamp: new Date('2026-09-21T09:00:00Z'),
        confirmationStatus: 'approved',
        approvalDeadline: new Date('2026-09-24T23:59:59Z'),
      },
      {
        userInformationId: 'user-info-005',
        reporterId: 'reporter-005',
        reporterName: 'ユーザーE',
        emailAddress: 'userE@example.com',
        fullName: 'User E Full',
        department: 'Marketing',
        submissionTimestamp: new Date('2026-09-22T09:00:00Z'),
        confirmationStatus: 'approved',
        approvalDeadline: new Date('2026-09-25T23:59:59Z'),
      },
    ];

    const expiredApprovalRecords: UserInformationConfirmationRecord[] = [
      {
        userInformationId: 'user-info-006',
        reporterId: 'reporter-006',
        reporterName: 'ユーザーF',
        emailAddress: 'userF@example.com',
        fullName: 'User F Full',
        department: 'Operations',
        submissionTimestamp: new Date('2026-09-19T09:00:00Z'),
        confirmationStatus: 'expired',
        approvalDeadline: new Date('2026-09-22T23:59:59Z'),
      },
    ];


    // Act
    const result = await retrieveUserInformationConfirmationStatus({
      leaderUserId,
      retrievalTimestamp,
    });

    // Assert
    expect(result.success).toBe(true);

    // pendingApprovals が2件を含む
    expect(result.pendingApprovals).toHaveLength(2);
    expect(result.pendingApprovals[0].reporterName).toBe('ユーザーA');
    expect(result.pendingApprovals[1].reporterName).toBe('ユーザーB');

    // approvedRecords が3件を含む
    expect(result.approvedRecords).toHaveLength(3);
    expect(result.approvedRecords[0].reporterName).toBe('ユーザーC');
    expect(result.approvedRecords[1].reporterName).toBe('ユーザーD');
    expect(result.approvedRecords[2].reporterName).toBe('ユーザーE');

    // expiredApprovals が1件を含む
    expect(result.expiredApprovals).toHaveLength(1);
    expect(result.expiredApprovals[0].reporterName).toBe('ユーザーF');

    // totalCount が6件
    expect(result.totalCount).toBe(6);
  });
});
