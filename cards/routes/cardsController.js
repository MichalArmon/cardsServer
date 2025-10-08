import express from "express";
import {
  createNewCard,
  deleteCard,
  getAllCards,
  getCardById,
  updateCard,
  toggleLike,
  changeBizNumber, // מניח שזה מיובא
} from "../services/cardsService.js";
import { auth } from "../../auth/services/authService.js";
import { getCardByIdFromDb } from "../services/cardsDataService.js";

const router = express.Router();

// --- פונקציה משותפת לטיפול בשגיאות HTTP ---
const handleError = (res, error) => {
  const errorMessage = error.message;

  // 401/403 (אימות/הרשאה)
  if (errorMessage.includes("Authentication Error")) {
    return res
      .status(401)
      .send({ message: "Unauthorized: Please provide a valid token." });
  }
  if (errorMessage.includes("Authorization Error")) {
    return res.status(403).send({ message: errorMessage });
  }

  // 404 (לא נמצא)
  if (errorMessage.includes("not found")) {
    return res.status(404).send({ message: errorMessage });
  }

  // 400 (ולידציה/קלט שגוי)
  if (
    errorMessage.includes("is required") ||
    errorMessage.includes("mast be a valid") ||
    errorMessage.includes("Validation failed")
  ) {
    return res.status(400).send({ message: errorMessage });
  }
  // 409 (קונפליקט - מפתח כפול)
  if (errorMessage.includes("duplicate key")) {
    return res
      .status(409)
      .send({ message: "Conflict: The record already exists." });
  }

  // 500 (שגיאה פנימית בלתי מטופלת)
  console.error("CRITICAL ROUTE ERROR:", errorMessage);
  res.status(500).send("Internal Server Error: Unhandled DB Error.");
};

// --- GET / (כל הכרטיסים) ---
router.get("/", async (req, res) => {
  try {
    const allCards = await getAllCards();
    res.send(allCards);
  } catch (error) {
    handleError(res, error);
  }
});

// --- POST / (יצירת כרטיס) ---
router.post("/", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.isBusiness && !user.isAdmin) {
      throw new Error(
        "Authorization Error: Only Business users or Admin can create cards"
      );
    }

    const cardResult = await createNewCard(req.body, user._id);
    res.status(201).send(cardResult);
  } catch (error) {
    handleError(res, error);
  }
});

// --- GET /:id (כרטיס יחיד) ---
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const card = await getCardById(id);
    if (!card) throw new Error("Card not found");
    res.send(card);
  } catch (error) {
    handleError(res, error);
  }
});

// --- PUT /:id (עדכון כרטיס מלא/חלקי) ---
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const newCardData = req.body;
    const requestingUser = req.user;

    // הפונקציה updateCard מטפלת בבדיקות הרשאה, בעלות וולידציה
    const modifiedCard = await updateCard(id, newCardData, requestingUser);
    res.send(modifiedCard);
  } catch (error) {
    // השתמש בבלוק הטיפול בשגיאות המאוחד שיצרת
    handleError(res, error);
  }
});

// --- DELETE /:id (מחיקת כרטיס) ---
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // קריאה לשכבת ה-Service שתטפל בבדיקות הבעלות/אדמין
    const idOfDeletedCard = await deleteCard(id, requestingUser);
    res.send({ message: `Card deleted successfully. ID: ${idOfDeletedCard}` });
  } catch (error) {
    handleError(res, error);
  }
});

// --- PATCH /:id/like (הוספה/הסרה של לייק) ---
router.patch("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const updatedCard = await toggleLike(id, userId);
    res.send(updatedCard);
  } catch (error) {
    handleError(res, error);
  }
});

// --- PATCH /biz/:id (שינוי מספר עסקי - לאדמין בלבד) ---
router.patch("/biz/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      throw new Error(
        "Authorization Error: Only Administrators can change the business number."
      );
    }
    const { id } = req.params;
    const newBizNumber = req.body.bizNumber;

    const updatedCard = await changeBizNumber(id, newBizNumber, req.user);
    res.send(updatedCard);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
