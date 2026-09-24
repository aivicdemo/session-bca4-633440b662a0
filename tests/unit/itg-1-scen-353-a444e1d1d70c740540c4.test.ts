jest.mock('../../src/logic/input-validation-formatting', () => ({
  validateEmailAddress: jest.fn(),
}));

import { registerReporter, InvalidEmailAddressFormat } from '../../src/logic/reporter-master-management';
import { validateEmailAddress } from '../../src/logic/input-validation-formatting';

const mockedValidateEmailAddress = validateEmailAddress as jest.Mock;

describe('SCEN-353: メールアドレスが空または形式が不正な場合、br-tx_7-004の制約1により「有効なメールアドレスを入力してください」エラーメッセージが返される', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('emailAddressパラメータが空文字列の場合、InvalidEmailAddressFormatエラーが発生し、success=false、reporterId=null、message=\"有効なメールアドレスを入力してください\"、changeHistoryId=nullが返される', async () => {
    mockedValidateEmailAddress.mockRejectedValue(
      new InvalidEmailAddressFormat('有効なメールアドレスを入力してください。')
    );

    const input = {
      userId: 'U001',
      reporterName: '田中太郎',
      emailAddress: '',
      teamLeaderId: 'TL001',
      executionTimestamp: new Date('2024-01-15T10:00:00+09:00'),
    };

    const result = await registerReporter(input);

    expect(result.success).toBe(false);
    expect(result.reporterId).toBeNull();
    expect(result.message).toBe('有効なメールアドレスを入力してください');
    expect(result.changeHistoryId).toBeNull();
    expect(mockedValidateEmailAddress).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: '' })
    );
  });
});
