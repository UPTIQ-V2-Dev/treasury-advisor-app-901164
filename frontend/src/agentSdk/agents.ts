import { z, type ZodSchema } from 'zod';

type TriggerEvent =
    | {
          type: 'async';
          name: string;
          description: string;
      }
    | {
          type: 'sync';
          name: string;
          description: string;
          outputSchema: ZodSchema;
      };

export type AgentConfig = {
    id: string;
    name: string;
    description: string;
    triggerEvents: TriggerEvent[];
    config: {
        appId: string;
        accountId: string;
        widgetKey: string;
    };
};

export const AGENT_CONFIGS: AgentConfig[] = [
    {
        id: '37cff143-f7d2-4204-878f-020620e7697e',
        name: 'Treasury Solution Advisor',
        description: 'An AI agent designed to analyze spending patterns and recommend optimal treasury products.',
        triggerEvents: [
            {
                type: 'sync',
                name: 'Bank-Statement-Uploaded',
                description: 'Analyze uploaded bank statements and recommend treasury products',
                outputSchema: z.object({
                    recommendations: z.array(
                        z.object({
                            productType: z.string(),
                            confidence: z.number(),
                            potentialSavings: z.number(),
                            reasoning: z.string()
                        })
                    ),
                    analysisInsights: z.object({
                        cashFlowPattern: z.string(),
                        avgBalance: z.number(),
                        volatility: z.string()
                    })
                })
            }
        ],
        config: {
            appId: 'd6e8f2b5-0865-485a-a63e-d083fad36462',
            accountId: '55f2743c-dc89-44ef-b653-4a1c11cca5aa',
            widgetKey: 'EN0WR1DfmOnYTFwUzQjPEICvgXYdVDbOAzo12Xmj'
        }
    }
];
