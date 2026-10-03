import { updateReporter } from '../../src/logic/reporter-master-management';
import * as inputValidation from '../../src/logic/input-validation-formatting';
import * as persistence from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting', () => ({
  ...jest.requireActual<typeof import('../../src/logic/input-validation-formatting')>('../../src/logic/input-validation-formatting'),
  validateReporterNameFormat: jest.fn(),
  validateEmailAddress: jest.fn(),
  detectDuplicateEmailAddress: jest.fn(),
}));

jest.mock('../../src/logic/user-master-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/user-master-persistence')>('../../src/logic/user-master-persistence'),
  retrieveReporterByUserId: jest.fn(),
  updateReporterInMaster: jest.fn(),
  persistReporterMasterChangeHistory: jest.fn(),
}));

describe('SCEN-379: すべての更新項目が任意で指定されない場合、現在の値が保持されて成功する', () => {
  const mockRetrieveReporterByUserId = persistence.retrieveReporterByUserId as jest.MockedFunction<typeof persistence.retrieveReporterByUserId>;
  const mockUpdateReporterInMaster = persistence.updateReporterInMaster as jest.MockedFunction<typeof persistence.updateReporterInMaster>;
  const mockPersistReporterMasterChangeHistory = persistence.persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistence.persistReporterMasterChangeHistory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('すべての更新項目が指定されない場合、現在の値が保持されて成功する', async () => {
    mockRetrieveReporterByUserId.mockResolvedValue({
      success: true,
      reporter: {
        reporterId: 'R001',
        userId: 'user-001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
        department: '営業部',
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      message: undefined
    });

    mockUpdateReporterInMaster.mockResolvedValue({
      success: true,
      reporterId: 'R001',
      message: 'Success'
    });

    mockPersistReporterMasterChangeHistory.mockResolvedValue({
      success: true,
      changeHistoryId: 'CH12345',
      message: 'Success'
    });

    const input = {
      reporterId: 'R001',
      teamLeaderId: 'L001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('R001');
    expect(result.message).toBe('報告者情報の更新が成功しました。');
    expect(result.changeHistoryId).toBe('CH12345');

    expect(mockUpdateReporterInMaster).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'R001',
        reporterName: '山田太郎',
        emailAddress: 'yamada@example.com',
        department: '営業部',
        status: 'active'
      })
    );

    expect(mockPersistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: 'R001',
        leaderUserId: 'L001',
        operationTimestamp: new Date('2025-01-15T09:00:00Z')
      })
    );
  });
});
