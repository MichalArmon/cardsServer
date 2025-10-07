import userSchema from "./userValidationSchema.js";

/**
 * פונקציה המאמתת אובייקט משתמש (User) באמצעות סכמת Joi.
 * הפונקציה מחזירה את תוצאת הולידציה של Joi.
 *
 * @param {object} user - אובייקט המשתמש לאימות.
 * @returns {object} - תוצאת הולידציה של Joi (value ו-error).
 */
export const validateUser = (user) => {
  // Joi.validate מחזיר אובייקט עם שני מאפיינים: error ו-value
  return userSchema.validate(user);
};
