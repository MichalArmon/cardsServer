import { cardSchema, updateCardSchema } from "./cardValidationSchema.js";

/**
 * מאמת אובייקט כרטיס ליצירה (Create) באמצעות סכמת הרישום המלאה.
 *
 * @param {object} card - אובייקט הכרטיס ליצירה.
 * @returns {object} - תוצאת הולידציה של Joi (value ו-error).
 */
export const validateCard = (card) => {
  return cardSchema.validate(card);
};

/**
 * מאמת אובייקט כרטיס לעדכון (Update) באמצעות סכמת העדכון החלקית.
 *
 * @param {object} card - אובייקט הכרטיס לעדכון (נתונים חלקיים).
 * @returns {object} - תוצאת הולידציה של Joi (value ו-error).
 */
export const validateUpdateCard = (card) => {
  return updateCardSchema.validate(card);
};
