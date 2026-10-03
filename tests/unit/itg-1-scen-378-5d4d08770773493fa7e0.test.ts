import { updateReporter, PersistenceError } from '../../src/logic/reporter-master-management';
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

describe('SCEN-378: 報告者マスタまたは変更履歴テーブルへの書き込みに失敗すると、PersistenceErrorが発生する', () => {
  const mockValidateReporterNameFormat = inputValidation.validateReporterNameFormat as jest.MockedFunction<typeof inputValidation.validateReporterNameFormat>;
  const mockValidateEmailAddress = inputValidation.validateEmailAddress as jest.MockedFunction<typeof inputValidation.validateEmailAddress>;
  const mockDetectDuplicateEmailAddress = inputValidation.detectDuplicateEmailAddress as jest.MockedFunction<typeof inputValidation.detectDuplicateEmailAddress>;
  const mockRetrieveReporterByUserId = persistence.retrieveReporterByUserId as jest.MockedFunction<typeof persistence.retrieveReporterByUserId>;
  const mockUpdateReporterInMaster = persistence.updateReporterInMaster as jest.MockedFunction<typeof persistence.updateReporterInMaster>;
  const mockPersistReporterMasterChangeHistory = persistence.persistReporterMasterChangeHistory as jest.MockedFunction<typeof persistence.persistReporterMasterChangeHistory>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('報告者マスタ更新に失敗すると、PersistenceErrorが発生し、successがfalseで返される', async () => {
    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '新しい名前',
      errorCode: null
    });
    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'new@example.com',
      errorCode: null
    });
    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'new@example.com',
      errorCode: null
    });
    mockRetrieveReporterByUserId.mockResolvedValue({
      success: true,
      reporter: {
        reporterId: 'RPT001',
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
    mockUpdateReporterInMaster.mockRejectedValue(new Error('Database write failed'));

    const input = {
      reporterId: 'RPT001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '部署B',
      status: 'inactive',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.changeHistoryId).toBe(null);
    expect(result.message).toBe('報告者情報の更新に失敗しました。');
  });

  it('変更履歴テーブル永続化に失敗すると、PersistenceErrorが発生し、successがfalseで返される', async () => {
    mockValidateReporterNameFormat.mockResolvedValue({
      isValid: true,
      validatedReporterName: '新しい名前',
      errorCode: null
    });
    mockValidateEmailAddress.mockResolvedValue({
      isValid: true,
      validatedEmailAddress: 'new@example.com',
      errorCode: null
    });
    mockDetectDuplicateEmailAddress.mockResolvedValue({
      isDuplicate: false,
      validatedEmailAddress: 'new@example.com',
      errorCode: null
    });
    mockRetrieveReporterByUserId.mockResolvedValue({
      success: true,
      reporter: {
        reporterId: 'RPT001',
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
      reporterId: 'RPT001',
      message: 'Success'
    });
    mockPersistReporterMasterChangeHistory.mockRejectedValue(new Error('Change history persistence failed'));

    const input = {
      reporterId: 'RPT001',
      reporterName: '新しい名前',
      emailAddress: 'new@example.com',
      department: '部署B',
      status: 'inactive',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z'),
    };

    const result = await updateReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBe(null);
    expect(result.changeHistoryId).toBe(null);
    expect(result.message).toBe('報告者情報の更新に失敗しました。');
  });
});
