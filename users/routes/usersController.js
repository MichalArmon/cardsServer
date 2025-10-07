import express from "express";
import {
  createNewUser,
  login,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../services/usersService.js";
import { auth } from "../../auth/services/authService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newUser = req.body;
    const user = await createNewUser(newUser);
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { password, email } = req.body;
    const token = await login(email, password);
    res.send(token);
  } catch (error) {
    res.status(401).send("invalid email or password");
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const user = req.user;

    // 1. בדיקת הרשאה: אם המשתמש אינו אדמין - חסום (403)
    if (!user.isAdmin) {
      console.log(
        `Authorization Error: User ${user._id} tried to access all users list.`
      );
      return res.status(403).send({
        message:
          "Authorization Error: Only Administrators can access this resource.",
      });
    }

    // 2. קריאה לשכבת השירות (המטפל בהסרת סיסמאות)
    const allUsers = await getAllUsers();

    // 3. שליחת הנתונים
    if (allUsers.length > 0) {
      res.send(allUsers);
    } else {
      res.status(404).send("No users found");
    }
  } catch (error) {
    // טיפול בשגיאות שרת פנימיות
    console.error("GET All Users Error:", error.message);
    res.status(500).send("Internal Server Error: Could not retrieve users.");
  }
});

// --- PUT /:id (עדכון משתמש) ---
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params; // ID של המשתמש שמעדכנים
    const userData = req.body; // הנתונים החדשים לעדכון
    const requestingUser = req.user; // המשתמש המאומת (מהטוקן)

    // הפונקציה הזו מבצעת: הרשאה, ולידציה והצפנת סיסמה, ואז קוראת ל-DAL
    const updatedUser = await updateUser(id, userData, requestingUser);

    res.send(updatedUser); // 200 OK
  } catch (error) {
    const errorMessage = error.message;

    // בדיקות ספציפיות להחזרת קוד HTTP נכון
    if (errorMessage.includes("Authorization Error")) {
      return res.status(403).send({ message: errorMessage }); // אין הרשאה
    }
    if (
      errorMessage.includes("Validation failed") ||
      errorMessage.includes("is required")
    ) {
      return res.status(400).send({ message: errorMessage }); // קלט שגוי
    }
    if (errorMessage.includes("Email already exists")) {
      return res.status(409).send({ message: errorMessage }); // קונפליקט
    }

    console.error("User Update Error:", error.message);
    res.status(500).send("Internal Server Error during user update.");
  }
});

// ## DELETE /:id (מחיקת משתמש)

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params; // ID של המשתמש למחיקה (מה-URL)
    const requestingUser = req.user; // המשתמש המאומת (מה-Token)

    // קורא לשכבת השירות (שמבצעת בדיקת הרשאה: הבעלים או אדמין)
    const idOfDeletedUser = await deleteUser(id, requestingUser);

    // אם המחיקה הצליחה, מחזירים הודעת הצלחה
    res.send({
      message: `User with ID: ${idOfDeletedUser} deleted successfully`,
    });
  } catch (error) {
    const errorMessage = error.message;

    // בדיקה לשגיאות הרשאה (שנזרקו מה-Service)
    if (errorMessage.includes("Authorization Error")) {
      return res.status(403).send({ message: errorMessage }); // 403 Forbidden
    }

    // בדיקה לשגיאת משתמש לא קיים (שנזרקה מה-Service)
    if (errorMessage.includes("User not found")) {
      return res.status(404).send({ message: "User not found." }); // 404 Not Found
    }

    // טיפול בשגיאות שרת פנימיות
    console.error("User Deletion Error:", error.message);
    res.status(500).send("Internal Server Error during user deletion.");
  }
});

export default router;
