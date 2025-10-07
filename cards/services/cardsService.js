import { generateBizNumber } from "../helpers/generateBizNumber.js";
import {
  validateCard,
  validateUpdateCard,
} from "../validation/cardValidationService.js";
import {
  createCard,
  deleteCardInDb,
  getAllCardsFromDb,
  getCardByIdFromDb,
  updateCardInDb,
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
    return null;
  }
  const newCard = await createCard(card);
  return newCard;
};

//update
// --- UPDATE CARD (עדכון כרטיס) ---
/**
 * מעדכנת כרטיס לאחר בדיקת הרשאה וולידציה.
 * @param {string} cardId - ה-ID של הכרטיס לעדכון.
 * @param {object} newCardData - הנתונים החדשים לעדכון.
 * @param {object} requestingUser - המשתמש שמבקש לבצע את הפעולה (מהטוקן).
 */
export const updateCard = async (cardId, newCardData, requestingUser) => {
  // 1. קריאה ל-DAL כדי לשלוף את הכרטיס המקורי (נדרש לבדיקת הבעלות)
  const card = await getCardByIdFromDb(cardId);

  if (!card) {
    throw new Error("Card not found.");
  }

  const cardOwnerId = card.user_id.toString();
  const isOwner = cardOwnerId === requestingUser._id.toString();

  // 2. בדיקת הרשאה: רק הבעלים או אדמין
  if (!isOwner && !requestingUser.isAdmin) {
    throw new Error(
      "Authorization Error: Only the card owner or an admin can update this card."
    );
  }

  // 3. ולידציה של הנתונים הנכנסים באמצעות סכמת העדכון (החלקית)
  const { error, value } = validateUpdateCard(newCardData);

  if (error) {
    console.log(
      "Joi Validation Error (UPDATE CARD):",
      error.details[0].message
    );
    throw new Error(error.details[0].message);
  }

  // 4. קריאה ל-DAL לביצוע העדכון
  try {
    // שולחים ל-DAL את ה-ID ואת הנתונים המאושרים על ידי Joi
    const updatedCard = await updateCardInDb(cardId, value);

    if (!updatedCard) {
      throw new Error("Update failed in DB layer.");
    }

    return updatedCard;
  } catch (error) {
    // תופס שגיאות מה-DAL (כגון שגיאת Mongoose או שדה חובה)
    throw new Error(error.message);
  }
};

//delete
export const deleteCard = async (id) => {
  const idOfDeletedCard = await deleteCardInDb(id);
  return idOfDeletedCard;
};

//toggleLike

//changeBizNumber
