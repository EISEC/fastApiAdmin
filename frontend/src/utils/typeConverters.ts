import type { DynamicModelField } from '../types/dynamicModel.types';
import type { FieldSchema, FieldType } from '../store/dynamicModelsStore';

/**
 * Конвертирует DynamicModelField в FieldSchema
 */
export function convertToFieldSchema(field: DynamicModelField, index: number): FieldSchema {
  return {
    id: `field_${index}`,
    name: field.name,
    label: field.label,
    type: field.type as FieldType,
    required: field.required,
    options: field.options,
    validation: field.validation,
    default_value: field.default_value,
    help_text: field.help_text,
    order: field.order || index,
  };
}

/**
 * Конвертирует FieldSchema в DynamicModelField
 */
export function convertToDynamicModelField(field: FieldSchema): DynamicModelField {
  return {
    name: field.name,
    type: field.type,
    label: field.label,
    required: field.required,
    default_value: field.default_value,
    help_text: field.help_text,
    options: field.options,
    validation: field.validation,
    order: field.order,
  };
}

/**
 * Конвертирует массив DynamicModelField в FieldSchema[]
 */
export function convertFieldsToSchema(fields: DynamicModelField[]): FieldSchema[] {
  return fields.map((field, index) => convertToFieldSchema(field, index));
}

/**
 * Конвертирует массив FieldSchema в DynamicModelField[]
 */
export function convertFieldsFromSchema(fields: FieldSchema[]): DynamicModelField[] {
  return fields.map(convertToDynamicModelField);
} 