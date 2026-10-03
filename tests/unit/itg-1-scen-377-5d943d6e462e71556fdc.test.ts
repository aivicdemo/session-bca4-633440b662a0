import { updateReporter, UnauthorizedUpdateError } from '../../src/logic/reporter-master-management';
import * as persistenceModule from '../../src/logic/user-master-persistence';
import * as validationModule from '../../src/logic/input-validation-formatting';

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveReporterByUserId: jest.fn(),
  updateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

describe('SCEN-377: 実行ユーザーがチームリーダー権限を持たないか異なるチームの報告者を更新しようとすると、UnauthorizedUpdateErrorが発生する', () => {
  const mockRetrieveReporterByUserId = persistenceModule.retrieveReporterByUserId as jest.MockedFunction<typeof persistenceModule.retrieveReporterByUserId>;
  const mockUpdateReporterInMaster = persistenceModule.updateReporterInMaster as jest.MockedFunction<typeof persistenceModule.updateReporterInMaster>;
  const mockPersistReporterMasterChangeHistory = persistenceModule.persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistenceModule.persistReporterMasterChangeHistory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異なるチームの報告者を更新しようとするとUnauthorizedUpdateErrorが発生', async () => {
    mockRetrieveReporterByUserId.mockResolvedValue({
      success: true,
      reporter: {
        reporterId: 'reporter-C',
        userId: 'user-C',
        reporterName: 'Name C',
        emailAddress: 'c@example.com',
        department: '営業部B',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      message: undefined
    });

    const input = {
      reporterId: 'reporter-C',
      reporterName: 'Updated Name',
      teamLeaderId: 'leader-A',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.message).toBe('この操作を実行する権限がありません。');
    expect(result.changeHistoryId).toBe(null);

    expect(mockUpdateReporterInMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });

  it('存在しない報告者IDを指定するとUnauthorizedUpdateErrorが発生', async () => {
    mockRetrieveReporterByUserId.mockResolvedValue({
      success: false,
      reporter: null,
      message: undefined
    });

    const input = {
      reporterId: 'reporter-nonexistent',
      reporterName: 'Updated Name',
      teamLeaderId: 'leader-A',
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.changeHistoryId).toBe(null);

    expect(mockUpdateReporterInMaster).not.toHaveBeenCalled();
    expect(mockPersistReporterMasterChangeHistory).not.toHaveBeenCalled();
  });
});
