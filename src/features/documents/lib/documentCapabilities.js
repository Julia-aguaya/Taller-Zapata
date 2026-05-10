/**
 * documentCapabilities.js
 * Document capabilities and validation rules by category
 */

/**
 * Document categories that require an issue date
 */
export const CATEGORIES_REQUIRING_DATE = [
  'policy',
  'claim',
  'invoice',
  'receipt',
  'report',
  'contract',
];

/**
 * Document categories that can be shown to customers
 */
export const VISIBLE_TO_CUSTOMER_CATEGORIES = [
  'policy',
  'invoice',
  'receipt',
  'report',
];

/**
 * Document types that can be marked as principal
 */
export const PRINCIPAL_DOCUMENT_TYPES = [
  'policy',
  'claim',
  'invoice',
];

/**
 * Check if a category requires an issue date
 */
export function requiresIssueDate(category) {
  if (!category) return false;
  return CATEGORIES_REQUIRING_DATE.includes(category.toLowerCase());
}

/**
 * Check if a category is visible to customer
 */
export function isVisibleToCustomer(category) {
  if (!category) return false;
  return VISIBLE_TO_CUSTOMER_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Check if a document type can be marked as principal
 */
export function canBePrincipal(type) {
  if (!type) return false;
  return PRINCIPAL_DOCUMENT_TYPES.includes(type.toLowerCase());
}

/**
 * Get allowed file extensions for upload
 */
export function getAllowedExtensions() {
  return ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
}

/**
 * Get max file size in bytes (10MB)
 */
export function getMaxFileSize() {
  return 10 * 1024 * 1024;
}

/**
 * Validate file extension
 */
export function isValidFileExtension(filename) {
  if (!filename) return false;
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return getAllowedExtensions().includes(ext);
}

/**
 * Validate file size
 */
export function isValidFileSize(size) {
  if (!size || size <= 0) return false;
  return size <= getMaxFileSize();
}

/**
 * Validate document metadata
 */
export function validateDocumentMetadata(metadata) {
  const errors = {};
  
  if (!metadata.name?.trim()) {
    errors.name = 'El nombre del documento es requerido';
  }
  
  if (!metadata.category) {
    errors.category = 'La categoría es requerida';
  }
  
  if (requiresIssueDate(metadata.category) && !metadata.issueDate) {
    errors.issueDate = 'La fecha de emisión es requerida para esta categoría';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get available categories for a case type
 */
export function getCategoriesForCaseType(caseType) {
  const baseCategories = [
    { value: 'policy', label: 'Póliza' },
    { value: 'claim', label: 'Sinistro' },
    { value: 'invoice', label: 'Factura' },
    { value: 'receipt', label: 'Recibo' },
    { value: 'report', label: 'Informe' },
    { value: 'contract', label: 'Contrato' },
    { value: 'photo', label: 'Foto' },
    { value: 'other', label: 'Otro' },
  ];
  
  if (caseType === 'lawyer') {
    return [
      ...baseCategories,
      { value: 'expediente', label: 'Expediente' },
      { value: 'resolution', label: 'Resolución' },
    ];
  }
  
  return baseCategories;
}