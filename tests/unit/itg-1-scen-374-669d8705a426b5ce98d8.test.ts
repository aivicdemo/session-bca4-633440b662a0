import {
  updateReporter,
  UpdateReporterInput,
  UpdateReporterOutput,
  DuplicateEmailAddressError,
} from '../../src/logic/reporter-master-management';
import {
  validateReporterNameFormat,
  validateEmailAddress,
  detectDuplicateEmailAddress,
} from '../../src/logic/input-validation-formatting';
import {
  retrieveReporterByUserId,
  updateReporterInMaster,
} from '../../src/logic/user-master-persistence';

jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-master-persistence');

describe('SCEN-374: 更新後のメールアドレスが同一チーム内の別の有効な報告者と重複すると、DuplicateEmailAddressErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('メールアドレスが同一チーム内で重複している場合、DuplicateEmailAddressErrorが発生する', () => {
    const teamId = 'team-001';
    const teamLeaderId = 'leader-001';
    const reporterId = 'reporter-001';
    const duplicateEmail = 'reporter-b@example.com';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (validateReporterNameFormat as jest.Mock).mockReturnValue({
      isValid: true,
    });

    (validateEmailAddress as jest.Mock).mockReturnValue({
      isValid: true,
    });

    (retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId,
      reporterName: 'Reporter A',
      emailAddress: 'reporter-a@example.com',
      department: '営業部',
      status: 'active',
      teamId,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue({
      hasDuplicate: true,
      conflictingReporterId: 'reporter-002',
    });

    (updateReporterInMaster as jest.Mock).mockReturnValue({
      success: true,
    });

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: 'Reporter A',
      emailAddress: duplicateEmail,
      department: '営業部',
      status: 'active',
      teamLeaderId,
      executionTimestamp,
    };

    expect(() => {
      updateReporter(input);
    }).toThrow(DuplicateEmailAddressError);

    // detectDuplicateEmailAddress が正しいパラメータで呼び出されたことを確認
    expect(detectDuplicateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        emailAddress: duplicateEmail,
        teamId,
      })
    );
  });

  test('メールアドレスが重複している場合、エラーハンドリング出力が返されることもある', () => {
    const teamId = 'team-001';
    const teamLeaderId = 'leader-001';
    const reporterId = 'reporter-001';
    const duplicateEmail = 'reporter-b@example.com';
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    (validateReporterNameFormat as jest.Mock).mockReturnValue({
      isValid: true,
    });

    (validateEmailAddress as jest.Mock).mockReturnValue({
      isValid: true,
    });

    (retrieveReporterByUserId as jest.Mock).mockReturnValue({
      reporterId,
      reporterName: 'Reporter A',
      emailAddress: 'reporter-a@example.com',
      department: '営業部',
      status: 'active',
      teamId,
    });

    (detectDuplicateEmailAddress as jest.Mock).mockReturnValue({
      hasDuplicate: true,
      conflictingReporterId: 'reporter-002',
    });

    const input: UpdateReporterInput = {
      reporterId,
      reporterName: 'Reporter A',
      emailAddress: duplicateEmail,
      department: '営業部',
      status: 'active',
      teamLeaderId,
      executionTimestamp,
    };

    try {
      const result: UpdateReporterOutput = updateReporter(input);
      // エラーハンドリングされた場合の検証
      expect(result.success).toBe(false);
      expect(result.reporterId).toBeNull();
      expect(result.message).toContain('既に別の報告者に割り当てられています');
      expect(result.changeHistoryId).toBeNull();
    } catch (error) {
      // 例外をスローする場合はここでキャッチ
      expect(error).toBeInstanceOf(DuplicateEmailAddressError);
    }
  });
});
