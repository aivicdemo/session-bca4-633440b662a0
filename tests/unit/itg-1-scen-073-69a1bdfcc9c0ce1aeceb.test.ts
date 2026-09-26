import { runTx7Imp1Agent, Tx7Imp1AgentInput, Tx7Imp1AiClient } from '../../src/agents/tx-7-imp-1/orchestrator';

describe('SCEN-073: 人事異動情報ソースからデータが取得できない場合、PersonnelMovementDataNotFoundエラーが発生する', () => {
  it('personnelMovementDataが空配列の場合、PersonnelMovementDataNotFoundエラーが発生する', async () => {
    const executionTimestamp = new Date('2024-04-01T09:00:00+09:00');
    const aiClient: Tx7Imp1AiClient = {} as any;

    const resultPromise = runTx7Imp1Agent(
      {
        personnelMovementData: [],
        executionTimestamp,
      } as Tx7Imp1AgentInput,
      aiClient
    );

    await expect(resultPromise).rejects.toThrow('人事異動情報を取得できませんでした。');
  });
});
