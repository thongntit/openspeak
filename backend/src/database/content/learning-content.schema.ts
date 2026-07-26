import * as Joi from 'joi';
import {
  LearningCardSource,
  LearningContentManifest,
  LearningDeckSource,
} from './learning-content.types';

export const stableLearningContentKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredText = Joi.string().trim().min(1).required();
const contentType = Joi.string().valid('vocab', 'grammar', 'tip').required();
const learningLevel = Joi.string()
  .valid('beginner', 'intermediate', 'advanced')
  .required();
const stableKey = Joi.string()
  .pattern(stableLearningContentKeyPattern)
  .required();
const sortOrder = Joi.number().integer().positive().required();

export const learningContentManifestSchema =
  Joi.object<LearningContentManifest>({
    schemaVersion: Joi.number().valid(1).required(),
    namespace: Joi.string().valid('starter').required(),
    contentVersion: requiredText,
    deckFiles: Joi.array()
      .items(
        Joi.string()
          .trim()
          .pattern(/\.json$/)
          .required(),
      )
      .min(5)
      .max(8)
      .unique()
      .required(),
  }).unknown(false);

export const learningCardSourceSchema = Joi.object<LearningCardSource>({
  contentKey: stableKey,
  type: contentType,
  level: learningLevel,
  front: requiredText,
  answer: requiredText,
  explanation: requiredText,
  example: requiredText,
  options: Joi.array()
    .items(Joi.string().trim().min(1).required())
    .min(2)
    .max(6)
    .unique()
    .optional(),
  sortOrder,
}).unknown(false);

export const learningDeckSourceSchema = Joi.object<LearningDeckSource>({
  slug: stableKey,
  name: requiredText,
  description: requiredText,
  type: contentType,
  level: learningLevel,
  sortOrder,
  isPublished: Joi.boolean().required(),
  cards: Joi.array().items(learningCardSourceSchema).min(20).max(50).required(),
}).unknown(false);
