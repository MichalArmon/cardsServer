import Joi from "joi";

// --- 1. Regular Expressions (רג'קסים) ---
const phoneRegex = /0[0-9]{1,2}\-?\s?[0-9]{3}\s?[0-9]{4}/;
const emailRegex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*-])[A-Za-z\d!@#$%^&*-]{8,}$/;

// --- 2. Main User Schema עם Submodels מוטמעים ישירות ---
export const userSchema = Joi.object({
  // Name Submodel (מוטמע ישירות)
  name: Joi.object({
    first: Joi.string().min(2).max(256).required(),
    middle: Joi.string().max(256).allow("").optional(), // תיקון ל-middle
    last: Joi.string().min(2).max(256).required(),
  }).required(), // Phone

  phone: Joi.string()
    .ruleset.regex(phoneRegex)
    .rule({ message: 'user "phone" must be a valid phone number' })
    .required(), // Email

  email: Joi.string()
    .ruleset.pattern(emailRegex)
    .rule({ message: 'user "email" must be a valid email' })
    .required(), // Password - ולידציה חזקה!

  password: Joi.string()
    .ruleset.pattern(passwordRegex)
    .rule({
      message:
        "password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character (!@#$%^&*-)",
    })
    .required()
    .trim(), // Image Submodel (מוטמע ישירות)

  image: Joi.object({
    url: Joi.string()
      .ruleset.uri()
      .rule({ message: 'user.image "url" must be a valid url' })
      .allow(""),
    alt: Joi.string().min(2).max(256).allow(""),
  }), // לא קראנו ל-required כאן כי זה לא היה בסכמה המקורית // Address Submodel (מוטמע ישירות)

  address: Joi.object({
    state: Joi.string().allow(""),
    country: Joi.string().min(2).max(256).required(),
    city: Joi.string().min(2).max(256).required(),
    street: Joi.string().min(2).max(256).required(),
    houseNumber: Joi.number().required(),
    zip: Joi.number().allow(""),
  }).required(), // isAdmin

  isAdmin: Joi.boolean().optional(), // isBusiness
  isBusiness: Joi.boolean().optional(),
});

// --- 3. Validation Service Function (פונקציית שירות הולידציה) ---

export const validateUser = (user) => {
  return userSchema.validate(user);
};

// ייצוא ברירת המחדל נשאר על הסכמה
export default userSchema;
