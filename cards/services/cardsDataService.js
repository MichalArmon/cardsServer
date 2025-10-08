import Card from "../models/Card.js";

//get all
export const getAllCardsFromDb = async () => {
  try {
    const cards = await Card.find();
    return cards;
  } catch (error) {
    console.log(error);
    return null; // עדיין מחזיר null כי זו פונקציית קריאה כללית
  }
};

//get one by id
export const getCardByIdFromDb = async (id) => {
  try {
    const card = await Card.findById(id);
    if (!card) {
      throw new Error("Card not found in database."); // <--- תיקון: זורק שגיאה אם לא נמצא
    }
    return card;
  } catch (error) {
    console.error("DB Error getting card by ID:", error);
    throw new Error(error.message);
  }
};

//create
export const createCard = async (card) => {
  try {
    const cardForDb = new Card(card);
    await cardForDb.save();
    return cardForDb;
  } catch (error) {
    console.log(error);
    throw new Error(error.message); // מומלץ לזרוק שגיאה
  }
};

//update -> gets id and new card and return new card
export const updateCardInDb = async (id, newCard) => {
  try {
    const cardAfterUpdate = await Card.findByIdAndUpdate(id, newCard, {
      new: true,
    });
    if (!cardAfterUpdate) {
      throw new Error("Card not found for update."); // <--- תיקון: זורק שגיאה אם לא נמצא
    }
    return cardAfterUpdate;
  } catch (error) {
    console.error("DB Error updating card:", error);
    throw new Error(error.message);
  }
};

//delete -> gets id and return id
export const deleteCardInDb = async (id) => {
  try {
    const deletedCard = await Card.findByIdAndDelete(id);
    if (!deletedCard) {
      throw new Error("Card not found for deletion.");
    }
    return id;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

//get card by biz number
export const getCardByBizNumber = async (bizNumber) => {
  try {
    const card = await Card.findOne({ bizNumber });
    return card;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

// --- פונקציה חדשה: TOGGLE LIKE (DAL) ---
export const toggleLikeInDb = async (cardId, userId) => {
  try {
    // 1. מוצאים את הכרטיס כדי לבדוק את סטטוס הלייק הנוכחי
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error("Card not found for like operation.");
    } // 2. בדיקה: האם המשתמש כבר ברשימה? // המערך 'likes' מכיל מחרוזות (ID משתמש) כפי שהגדרת במודל

    const userLiked = card.likes.includes(userId);

    let updateOperation;

    if (userLiked) {
      // אם יש לייק, מסירים אותו ($pull)
      updateOperation = { $pull: { likes: userId } };
    } else {
      // אם אין, מוסיפים אותו ($addToSet כדי לוודא שאין כפילויות)
      updateOperation = { $addToSet: { likes: userId } };
    } // 3. ביצוע העדכון והחזרת הכרטיס המעודכן

    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      updateOperation,
      { new: true } // מחזיר את המסמך המעודכן
    );

    return updatedCard;
  } catch (error) {
    console.error("DB Toggle Like Error:", error);
    throw new Error(error.message);
  }
};
