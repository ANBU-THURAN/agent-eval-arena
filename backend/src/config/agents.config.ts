export const AGENT_MODELS = [
  {
    id: 'model-gemini-pro',
    name: 'gemini-2.5-pro',
    provider: 'gemini',
    apiEndpoint: 'https://generativelanguage.googleapis.com',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
  },
  {
    id: 'model-gemini-flash',
    name: 'gemini-2.5-flash',
    provider: 'gemini',
    apiEndpoint: 'https://generativelanguage.googleapis.com',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
  },
] as const;

export const AGENTS = [
  {
    id: 'agent-gemini-flash-1',
    name: 'Gemini Flash Trader Alpha',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-2',
    name: 'Gemini Flash Trader Beta',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-3',
    name: 'Gemini Flash Trader Gamma',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-4',
    name: 'Gemini Flash Trader Delta',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-5',
    name: 'Gemini Flash Trader Epsilon',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-6',
    name: 'Gemini Flash Trader Zeta',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-7',
    name: 'Gemini Flash Trader Eta',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-8',
    name: 'Gemini Flash Trader Theta',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-9',
    name: 'Gemini Flash Trader Iota',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
  {
    id: 'agent-gemini-flash-10',
    name: 'Gemini Flash Trader Kappa',
    modelId: 'model-gemini-flash',
    provider: 'gemini',
  },
] as const;
