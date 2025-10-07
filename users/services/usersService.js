import _ from "lodash";
import { generateToken } from "../../auth/providers/jwtProvider.js";
import { comparePassword, generatePassword } from "../helpers/bcrypt.js";
import {
  createUser,
  getUserByEmail,
  getAllUsersFromDb,
  updateUserInDb,
  deleteUserInDb, // <--- ייבוא פונקציית המחיקה
} from "./usersDataService.js";
import {
  validateUser,
  validateUpdateUser,
} from "../validation/userValidationService.js";

// --- 1. יצירת משתמש חדש (הרשמה) ---
export const createNewUser = async (user) => {
  const { error, value } = validateUser(user);
  if (error) {
    console.log(
      "Joi Validation Error in User Service:",
      error.details[0].message
    );

    throw new Error(error.details[0].message);
  }

  try {
    let hashPass = generatePassword(user.password);
    user.password = hashPass;
    const newUser = await createUser(user);
    const DTOuser = _.pick(newUser, ["email", "name", "_id"]);
    return DTOuser;
  } catch (error) {
    throw new Error(error.message);
  }
};

// --- 2. כניסת משתמש (LOGIN) ---
export const login = async (email, password) => {
  try {
    const user = await getUserByEmail(email);
    if (comparePassword(password, user?.password)) {
      return generateToken(user);
    }
    throw new Error("password incorrect");
  } catch (error) {
    throw new Error(error.message);
  }
};

// --- 3. שליפת כל המשתמשים (לאדמין) ---
export const getAllUsers = async () => {
  try {
    const users = await getAllUsersFromDb();
    return users;
  } catch (error) {
    throw new Error(error.message);
  }
};

// --- 4. עדכון משתמש (UPDATE USER) ---
export const updateUser = async (userId, userData, requestingUser) => {
  // בדיקת הרשאה: רק הבעלים או אדמין
  if (userId !== requestingUser._id.toString() && !requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Only the user or an admin can update this profile."
    );
  } // ולידציה

  const { error, value } = validateUpdateUser(userData);

  if (error) {
    throw new Error(error.details[0].message);
  } // הצפנת סיסמה אם עודכנה

  if (value.password) {
    value.password = generatePassword(value.password);
  }

  try {
    const updatedUser = await updateUserInDb(userId, value);

    if (!updatedUser) {
      throw new Error("User not found or update failed in DB layer.");
    } // החזרת DTO

    const DTOuser = _.pick(updatedUser, [
      "email",
      "name",
      "_id",
      "isBusiness",
      "isAdmin",
      "address",
      "phone",
      "image",
    ]);
    return DTOuser;
  } catch (error) {
    throw new Error(error.message);
  }
};

// --- 5. מחיקת משתמש (DELETE USER) ---
/**
 * מוחקת משתמש לאחר בדיקת הרשאה.
 * @param {string} userId - ה-ID של המשתמש למחיקה.
 * @param {object} requestingUser - המשתמש שמבקש לבצע את הפעולה (מהטוקן).
 */
export const deleteUser = async (userId, requestingUser) => {
  // 1. בדיקת הרשאה: רק הבעלים או אדמין
  if (userId !== requestingUser._id.toString() && !requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Only the user or an admin can delete this profile."
    );
  }

  // 2. קריאה ל-DAL לביצוע המחיקה
  try {
    const idOfDeletedUser = await deleteUserInDb(userId);

    if (!idOfDeletedUser) {
      throw new Error(
        "User not found for deletion or deletion failed in DB layer."
      );
    }

    return idOfDeletedUser;
  } catch (error) {
    throw new Error(error.message);
  }
};
