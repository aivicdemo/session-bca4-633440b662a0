jest.mock('../../src/logic/input-validation-formatting');
jest.mock('../../src/logic/user-authentication-authorization');
jest.mock('../../src/logic/user-master-persistence');

import { registerReporter } from '../../src/logic/reporter-master-management';
import { validateReporterNameFormat, validateEmailAddress, detectDuplicateEmailAddress } from '../../src/logic/input-validation-formatting';
import { validateUserAccountActiveStatus } from '../../src/logic/user-authentication-authorization';
import { registerReporterToMaster, persistReporterMasterChangeHistory } from '../../src/logic/user-master-persistence';

const mockedValidateReporterNameFormat = validateReporterNameFormat as jest.Mock;
const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;
const mockedDetectDuplicateEmailAddress = detectDuplicateEmailAddress as jest.Mock;
const mockedValidateUserAccountActiveStatus = validateUserAccountActiveStatus as jest.Mock;
const mockedRegisterReporterToMaster = registerReporterToMaster as jest.Mock;
const mockedPersistReporterMasterChangeHistory = persistReporterMasterChangeHistory as jest.Mock;

describe('SCEN-343: 休職のメンバーの場合、br-tx_7-002により更新操作が決定される', () => {
  const userId = 'user-on-leave-001';
  const reporterName = '山田太郎';
  const emailAddress = 'yamada@example.com';
  const teamLeaderId = 'leader-001';
  const executionTimestamp = new Date();

  beforeEach(() => {
    jest.resetAllMocks();

    mockedValidateReporterNameFormat.mockResolvedValue({ isValid: true });
    mockedValidateEmailAddress.mockResolvedValue({ isValid: true });
    mockedDetectDuplicateEmailAddress.mockResolvedValue(false);
    mockedValidateUserAccountActiveStatus.mockResolvedValue(true);
    mockedRegisterReporterToMaster.mockResolvedValue({
      reporterId: 'reporter-001',
      status: '休職中',
    });
    mockedPersistReporterMasterChangeHistory.mockResolvedValue({
      changeHistoryId: 'history-20250115-001',
    });
  });

  it('休職メンバーの場合、更新操作が決定され、success=true、reporterId=reporter-001、changeHistoryId=history-20250115-001を返す', async () => {
    const input = {
      userId,
      reporterName,
      emailAddress,
      teamLeaderId,
      executionTimestamp,
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(true);
    expect(result.reporterId).toBe('reporter-001');
    expect(result.message).toBe('休職中のメンバーの報告者ステータスを更新しました。');
    expect(result.changeHistoryId).toBe('history-20250115-001');
    expect(mockedRegisterReporterToMaster).toHaveBeenCalled();
    expect(mockedPersistReporterMasterChangeHistory).toHaveBeenCalled();
  });
});
