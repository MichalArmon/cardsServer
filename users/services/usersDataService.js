import User from "../models/User.js";

// קבועים אלו נחוצים *רק* בתוך הקובץ הזה כדי לתמוך ב-recordFailedLogin
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 2 * 60 * 60 * 1000;

//get all
export const getAllUsersFromDb = async () => {
  try {
    const users = await User.find().select("-password"); // מומלץ להסיר סיסמה
    return users;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

//get one by id
export const getUserByIdFromDb = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) throw new Error("User not found.");
    return user;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

//create (נותר זהה כי הוא כבר זורק שגיאות)
export const createUser = async (user) => {
  // ... [כמו שהיה] ...
};

//update -> gets id and new user and return new user
export const updateUserInDb = async (id, newUser) => {
  try {
    const userAfterUpdate = await User.findByIdAndUpdate(id, newUser, {
      new: true,
      runValidators: true,
    });
    if (!userAfterUpdate) throw new Error("User not found for update");
    return userAfterUpdate;
  } catch (error) {
    console.error(error);
    throw new Error(error.message); // זורק שגיאה במקום return null
  }
};

//delete -> gets id and return id
export const deleteUserInDb = async (id) => {
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) throw new Error("User not found for deletion");
    return id;
  } catch (error) {
    console.error(error);
    throw new Error(error.message); // זורק שגיאה במקום return null
  }
};

export const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Email not found");
    }
    return user;
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
};

// --- פונקציות הוספה (LOGIC) ---

export const recordFailedLogin = async (email) => {
  // מנסה למצוא את המשתמש
  const user = await User.findOne({ email });

  if (!user) return; // אם המשתמש לא נמצא, אין מה לעשות // הגדל את מונה הניסיונות הכושלים ב-1

  user.loginAttempts += 1; // אם הגיע למקסימום, נעל את המשתמש

  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    // <--- כאן הוא אמור להכיר אותם!
    user.lockUntil = Date.now() + LOCK_TIME;
  }

  await user.save();
};

export const resetLoginAttempts = async (user) => {
  // איפוס מונה הניסיונות לאחר לוגין מוצלח
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined; // מוחק את שדה הנעילה
    await user.save();
  }
};
