import {
  CategorySchema,
  FeeScheduleSubtypeSchema,
  FootnotesSubtypeSchema,
  RelationTypeSchema,
} from '../types/annotation.types.js';
import type { Category, Subtype, RelationType } from '../types/annotation.types.js';
import type { AnnotationError, RelationError } from '../types/error.types.js';
import type { Result } from '../types/result.types.js';
import { success, failure } from '../types/result.types.js';

/**
 * Validates that a category string is a valid Category Literal
 */
export function validateCategory(category: string): Result<Category, AnnotationError> {
  const result = CategorySchema.safeParse(category);
  if (!result.success) {
    return failure({
      type: 'InvalidCategory',
      category,
      validOptions: CategorySchema.options,
      message: `Invalid category '${category}'. Valid options: ${CategorySchema.options.join(', ')}`,
    });
  }
  return success(result.data);
}

/**
 * Validates that a subtype is valid for a given category
 */
export function validateSubtypeForCategory(
  category: Category,
  subtype: string
): Result<Subtype, AnnotationError> {
  if (category === 'fee_schedule') {
    const result = FeeScheduleSubtypeSchema.safeParse(subtype);
    if (!result.success) {
      return failure({
        type: 'InvalidSubtype',
        subtype,
        category,
        validOptions: FeeScheduleSubtypeSchema.options,
        message: `Invalid subtype '${subtype}' for category 'fee_schedule'. Valid options: ${FeeScheduleSubtypeSchema.options.join(', ')}`,
      });
    }
    return success(result.data);
  }

  if (category === 'footnotes') {
    const result = FootnotesSubtypeSchema.safeParse(subtype);
    if (!result.success) {
      return failure({
        type: 'InvalidSubtype',
        subtype,
        category,
        validOptions: FootnotesSubtypeSchema.options,
        message: `Invalid subtype '${subtype}' for category 'footnotes'. Valid options: ${FootnotesSubtypeSchema.options.join(', ')}`,
      });
    }
    return success(result.data);
  }

  // TypeScript exhaustiveness check ensures all categories handled
  const _exhaustive: never = category;
  throw new Error(`Unhandled category: ${_exhaustive}`);
}

/**
 * Validates that a relation type string is a valid RelationType Literal
 */
export function validateRelationType(relationType: string): Result<RelationType, RelationError> {
  const result = RelationTypeSchema.safeParse(relationType);
  if (!result.success) {
    return failure({
      type: 'InvalidRelationType',
      relationType,
      validOptions: RelationTypeSchema.options,
      message: `Invalid relation type '${relationType}'. Valid options: ${RelationTypeSchema.options.join(', ')}`,
    });
  }
  return success(result.data);
}

/**
 * Gets valid subtypes for a given category
 */
export function getValidSubtypesForCategory(category: Category): readonly string[] {
  if (category === 'fee_schedule') {
    return FeeScheduleSubtypeSchema.options;
  }
  if (category === 'footnotes') {
    return FootnotesSubtypeSchema.options;
  }
  // TypeScript exhaustiveness check
  const _exhaustive: never = category;
  throw new Error(`Unhandled category: ${_exhaustive}`);
}
