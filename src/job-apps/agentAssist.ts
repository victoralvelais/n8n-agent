import { JobApplication } from './userProfile.js';
import { config } from 'dotenv';

config()

const AI_ENDPOINT = process.env.AI_ENDPOINT;

export async function getAIAnswer(question: string, options?: string[], multiselect?: boolean) {
  if (!AI_ENDPOINT) throw new Error('AI_ENDPOINT not set in .env');
  const { systemPrompt, userPrompt } = buildPrompt(question, options, multiselect);
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });

  const data = await response.json();
  
  const extractFirstValue = (obj) => Object.values(obj)[0];
  const parseJsonSafely = (str: string) => JSON.parse(str.trim());

  let answer;
  const output = data.output;

  try {
    const processOutput = (value) => (typeof value === 'object' && value !== null)
      ? extractFirstValue(value)
      : value;

    answer = typeof output === 'string' 
      ? processOutput(parseJsonSafely(output))
      : processOutput(output);
  } catch (error) {
    // console.error('Error processing answer:', error);
    answer = String(output || '');
  }

  return { answer };
}

const buildPrompt = (question: string, options?: string[], multiselect?: boolean) => {
  const systemPrompt = `You are a helpful online form filling assistant. Evaluate the inputs provided, think about what information they're asking the user, and select the best answer from the user's profile. Your answer should be succinctly a string message or array of strings`;

  const userPrompt = `Help me fill out this job application form. I've filled out my profile. Select the best response to this question, only providing the value I should input: ${question}${options ? `\n\nAnswer Options: ${options.join(', ')}` : ''}${multiselect ? '\n\n*This quesiton is multi-select, so choose as many as relevant to the user as a string array answer*' : ''}\n\nUser Profile: ${JSON.stringify(JobApplication)}`;

  return { systemPrompt, userPrompt };
}