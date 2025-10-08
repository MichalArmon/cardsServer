import _ from "lodash";
import { generateToken } from "../../auth/providers/jwtProvider.js";
import { comparePassword, generatePassword } from "../helpers/bcrypt.js";
import {
  createUser,
  getUserByEmail,
  getAllUsersFromDb,
  updateUserInDb,
  deleteUserInDb, // ייבוא חדש: פונקציות לניהול ניסיונות כושלים
  recordFailedLogin,
  resetLoginAttempts,
} from "./usersDataService.js";
import {
  validateUser,
  validateUpdateUser,
} from "../validation/userValidationService.js";

const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 שעות במילישניות

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

// --- 2. כניסת משתמש (LOGIN) - מעודכן לטיפול בנעילה ---
export const login = async (email, password) => {
  try {
    let user = await getUserByEmail(email); // קורא למשתמש (משתנה let) // 1. בדיקת נעילה נוכחית (אם קיים)

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil(
        (user.lockUntil - Date.now()) / (1000 * 60)
      );
      throw new Error(
        `User account is locked. Try again in ${remainingTime} minutes.`
      );
    } // 2. אימות סיסמה

    if (comparePassword(password, user?.password)) {
      // הצלחה: אפס את מונה הכשלונות
      await resetLoginAttempts(user);
      return generateToken(user);
    } else {
      // 3. כשל: הקלט ניסיון כושל וזרוק שגיאה
      await recordFailedLogin(email);

      // 💡 התיקון הקריטי: שולפים את המשתמש מחדש כדי לקבל את מונה הניסיונות המעודכן!
      user = await getUserByEmail(email); // בודק אם הניסיון הזה הוא זה שגרם לנעילה

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        // הבדיקה כעת פשוטה יותר
        const lockMinutes = Math.ceil(LOCK_TIME / (1000 * 60));
        throw new Error(
          `Login failed. Account locked for ${lockMinutes} minutes due to too many failed attempts.`
        );
      }

      throw new Error("Password incorrect");
    }
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
export const deleteUser = async (userId, requestingUser) => {
  // 1. בדיקת הרשאה: רק הבעלים או אדמין
  if (userId !== requestingUser._id.toString() && !requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Only the user or an admin can delete this profile."
    );
  } // 2. קריאה ל-DAL לביצוע המחיקה

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

/**
 * מאפשר למשתמש או לאדמין לשנות את סטטוס 'בעל עסק' (isBusiness).
 * הפונקציה מקבלת ערך בוליאני ומעדכנת את הסטטוס ישירות.
 * * @param {string} userId - ה-ID של המשתמש שאותו רוצים לשנות.
 * @param {boolean} newStatus - הסטטוס החדש (true לשדרוג, false לשנמוך).
 * @param {object} requestingUser - המשתמש המאומת (לצורך בדיקת הרשאה).
 */
export const setBusinessStatus = async (userId, newStatus, requestingUser) => {
  // 1. בדיקת הרשאה: מותר רק לבעלים או לאדמין לשנות סטטוס.
  if (userId !== requestingUser._id.toString() && !requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Cannot change status for another user without admin privileges."
    );
  }

  // 2. ולידציה: ודא ש-newStatus הוא בוליאני.
  if (typeof newStatus !== "boolean") {
    throw new Error("Validation Error: Status must be true or false.");
  }

  // 3. קריאה ל-DAL לביצוע העדכון הקשיח.
  try {
    const updatedUser = await updateUserInDb(userId, { isBusiness: newStatus });

    if (!updatedUser) {
      throw new Error("User not found or update failed.");
    }

    // 4. החזרת DTO (כדי להבטיח שלא נחשפת סיסמה)
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
