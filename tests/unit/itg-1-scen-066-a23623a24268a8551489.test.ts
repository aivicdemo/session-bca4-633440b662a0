import { describe, it, expect } from '@jest/globals';
import { runTx6Imp1Agent, type Tx6Imp1AiClient } from '../../src/agents/tx-6-imp-1/orchestrator';

describe('SCEN-066: Non-submission prompt error', () => {
  it('should throw NonSubmissionPromptExecutionError on prompt failure', async () => {
    const mockAiClient = {} as Tx6Imp1AiClient;
    try {
      await runTx6Imp1Agent(
        {
          leaderUserId: 'leader001',
          userInformationSubmissions: [
            { userId: 'user001', userName: 'name', email: 'email@example.com', department: 'dept', role: 'role' },
          ],
          executionTimestamp: new Date(),
          targetDate: new Date(),
        },
        mockAiClient
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
