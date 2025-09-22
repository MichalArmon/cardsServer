import Card from "../models/Card.js";

//get all
export const getAllCardsFromDb = async () => {
  try {
    const cards = await Card.find();
    return cards;
  } catch (error) {
    console.log(error);
    return null;
  }
};

//get one by id
export const getCardByIdFromDb = async (id) => {
  try {
    const card = await Card.findById(id);
    return card;
  } catch (error) {
    console.log(error);
    return null;
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
    return null;
  }
};

//update -> gets id and new card and return new card
export const updateCardInDb = async (id, newCard) => {
  try {
    const cardAfterUpdate = await Card.findByIdAndUpdate(id, newCard, {
      new: true,
    });
    return cardAfterUpdate;
  } catch (error) {
    console.log(error);
    return null;
  }
};

//delete -> gets id and return id
export const deleteCardInDb = async (id) => {
  try {
    await Card.findByIdAndDelete(id);
    return id;
  } catch (error) {
    console.log(error);
    return null;
  }
};

//get card by biz number
export const getCardByBizNumber = async (bizNumber) => {
  try {
    const card = await Card.findOne({ bizNumber });
    return card;
  } catch (error) {
    console.log(error);
    return null;
  }
};
