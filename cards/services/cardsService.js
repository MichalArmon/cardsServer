import { generateBizNumber } from "../helpers/generateBizNumber.js";
import {
  validateCard, // נשתמש בזה לעדכון מלא
  validateUpdateCard, // נשמור את זה אם תרצה להשתמש ב-PATCH
} from "../validation/cardValidationService.js";
import {
  createCard,
  deleteCardInDb,
  getAllCardsFromDb,
  getCardByIdFromDb,
  updateCardInDb,
  toggleLikeInDb,
} from "./cardsDataService.js";

//get all
export const getAllCards = async () => {
  const cards = await getAllCardsFromDb();
  return cards;
};

//get one by id
export const getCardById = async (id) => {
  const card = await getCardByIdFromDb(id);
  return card;
};

//create
export const createNewCard = async (card, userId) => {
  card.bizNumber = await generateBizNumber();
  card.user_id = userId;
  const { error, value } = validateCard(card);
  if (error) {
    console.log(
      "Joi Validation Error (CREATE CARD):",
      error.details[0].message
    );
    throw new Error(error.details[0].message);
  }
  const newCard = await createCard(value);
  return newCard;
};

// --- UPDATE CARD (עדכון כרטיס) ---
export const updateCard = async (cardId, newCardData, requestingUser) => {
  // 1. בדיקת בטיחות (האם המשתמש המבקש קיים?)
  if (!requestingUser) {
    throw new Error(
      "Authentication Error: Missing user identity for this operation."
    );
  } // 2. קריאה לכרטיס המקורי

  const card = await getCardByIdFromDb(cardId);
  if (!card) {
    throw new Error("Card not found.");
  } // 3. בדיקת הרשאה: רק הבעלים או אדמין

  const cardOwnerId = card.user_id.toString();
  const requestingUserId = requestingUser._id.toString();

  const isOwner = cardOwnerId === requestingUserId;

  if (!isOwner && !requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Only the card owner or an admin can update this card."
    );
  } // 4. ולידציה של הנתונים הנכנסים // **התיקון כאן: שימוש בסכמה המלאה (validateCard) לעדכון מלא**

  const { error, value } = validateCard(newCardData);

  if (error) {
    console.log(
      "Joi Validation Error (UPDATE CARD):",
      error.details[0].message
    );
    throw new Error(error.details[0].message);
  } // 5. קריאה ל-DAL לביצוע העדכון

  try {
    const updatedCard = await updateCardInDb(cardId, value);

    if (!updatedCard) {
      throw new Error("Update failed in DB layer.");
    }

    return updatedCard;
  } catch (error) {
    console.error("Internal Server Error in updateCard:", error);
    throw new Error(error.message);
  }
};

//delete
export const deleteCard = async (id) => {
  const idOfDeletedCard = await deleteCardInDb(id);
  return idOfDeletedCard;
};

// --- TOGGLE LIKE (החלפת לייק) ---
export const toggleLike = async (cardId, userId) => {
  // 1. בדיקת בטיחות: ודא שהמשתמש קיים
  if (!userId) {
    throw new Error(
      "Authentication Required: User must be logged in to like a card."
    );
  }

  try {
    // 2. קריאה לכרטיס הנוכחי כדי לוודא קיום
    const card = await getCardByIdFromDb(cardId);

    if (!card) {
      throw new Error("Card not found.");
    }
    // 3. קריאה לפונקציית ה-DAL שתבצע את הלוגיקה
    const updatedCard = await toggleLikeInDb(cardId, userId);

    if (!updatedCard) {
      throw new Error("Toggling like failed in DB layer.");
    }

    return updatedCard;
  } catch (error) {
    throw new Error(error.message);
  }
};

// --- CHANGE BIZ NUMBER (שינוי מספר עסקי - לאדמין בלבד) ---
export const changeBizNumber = async (cardId, newBizNumber, requestingUser) => {
  // 1. בדיקת הרשאה: רק אדמין מורשה!
  if (!requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Only administrators can change the business number."
    );
  }

  // 2. ולידציה בסיסית של המספר החדש (7 ספרות)
  if (
    typeof newBizNumber !== "number" ||
    newBizNumber < 1000000 ||
    newBizNumber > 9999999
  ) {
    throw new Error("Validation Error: Biz number must be a 7-digit number.");
  }

  // 3. קריאה ל-DAL לביצוע העדכון
  try {
    // שימוש ב-updateCardInDb לשינוי שדה יחיד
    const updatedCard = await updateCardInDb(cardId, {
      bizNumber: newBizNumber,
    });

    if (!updatedCard) {
      throw new Error("Card not found or update failed.");
    }

    return updatedCard;
  } catch (error) {
    // תופס שגיאות כגון מספר שכבר קיים (unique key error)
    throw new Error(error.message);
  }
};
