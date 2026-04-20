import { getWords, getWordById as apiGetWordById } from './openspeakApi';

export async function getRandomWord(difficulty = null) {
  const params = { limit: 50 };
  if (difficulty) params.difficulty = difficulty;
  const res = await getWords(params);
  if (!res.data.length) return null;
  return res.data[Math.floor(Math.random() * res.data.length)];
}

export async function getWordById(id) {
  return apiGetWordById(id);
}

export async function searchWords(prefix, limit = 20) {
  if (!prefix?.trim()) return [];
  const res = await getWords({ search: prefix.trim(), limit });
  return res.data;
}

export async function getWordsByDifficulty(difficulty, limit = 20) {
  const res = await getWords({ difficulty, limit });
  return res.data;
}
