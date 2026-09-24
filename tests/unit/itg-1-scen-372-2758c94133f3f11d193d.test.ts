import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
} from '../../src/logic/input-validation-formatting';
import {
  retrieveReporterByUserId,
  updateReporterInMaster,
  persistReporterMasterChangeHistory,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-372: チームリーダーが既存報告者の名前を更新すると、変更履歴が記録されて成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('既存報告者の名前を更新し、変更履歴が記録されて成功する', () => {
    const teamLeaderId = 'TL001';
    const reporterId = 'RPT001';
    const currentName = '田中太郎';
    const newName = '田中花子';
    const currentEmail = 'tanaka@example.com';
    const currentDepartment = '営業部';
    const currentStatus = 'active';
    const changeHistoryId = 'CHG20250115001';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (validateReporterNameFormat as jest.Mock).mockReturnValue({
      isValid: true,
    });

    (retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId,
      reporterName: currentName,
      emailAddress: currentEmail,
      department: currentDepartment,
      status: currentStatus,
      teamId: 'team-001',
    });

    (updateReporterInMaster as jest.Mock).mockReturnValue({
      success: true,
      reporterId,
    });

    (persistReporterMasterChangeHistory as jest.Mock).mockReturnValue({
      changeHistoryId,
    });

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: newName,
      emailAddress: null,
      department: null,
      status: null,
      teamLeaderId,
      executionTimestamp,
    };

    const result: UpdateReporterOutput = updateReporter(input);

    expect(validateReporterNameFormat).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterName: newName,
      })
    );

    expect(retrieveReporterByUserId).toHaveBeenCalledWith(reporterId);

    expect(updateReporterInMaster).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId,
        reporterName: newName,
      })
    );

    expect(persistReporterMasterChangeHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId,
        changeType: 'reporterName',
        beforeValue: currentName,
        afterValue: newName,
        teamLeaderId,
        executionTimestamp,
      })
    );

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe(reporterId);
    expect(result.changeHistoryId).toBe(changeHistoryId);
    expect(result.message).toContain('正常に更新されました');
  });
});
