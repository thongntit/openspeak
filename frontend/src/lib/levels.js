export const LEVEL_LABEL = { beg: 'Beginner', int: 'Intermediate', adv: 'Advanced' };

export const LONG_TO_SHORT = {
  beginner: 'beg',
  intermediate: 'int',
  advanced: 'adv',
};

export function toShortLevel(level) {
  return LONG_TO_SHORT[level] ?? level;
}
