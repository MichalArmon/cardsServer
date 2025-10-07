import express from "express";
import {
  createNewCard,
  deleteCard,
  getAllCards,
  getCardById,
  updateCard,
} from "../services/cardsService.js";
import { auth } from "../../auth/services/authService.js";
import { getCardByIdFromDb } from "../services/cardsDataService.js";
import { generateBizNumber } from "../helpers/generateBizNumber.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const allCards = await getAllCards();
  if (allCards) {
    res.send(allCards);
  } else {
    res.status(500).send("something went wrong with get all cards");
  }
});

router.post("/", auth, async (req, res) => {
  const newCard = req.body;
  const user = req.user;
  if (!user.isBusiness && !user.isAdmin) {
    return res.status(403).send("Only Business user can create cards");
  }
  const cardResult = await createNewCard(newCard, user._id);

  if (cardResult) {
    res.status(201).send("New card added successfully");
  } else {
    res.status(400).send("something went wrong with card creation");
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const card = await getCardById(id);
  if (card) {
    res.send(card);
  } else {
    res.status(404).send("Card not found");
  }
});

router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  //בדיקה אם המשתמש הוא אדמין או הבעלים של הכרטיס?
  const card = await getCardByIdFromDb(id);

  if (!user.isAdmin && card?.user_id !== user._id) {
    return res
      .status(403)
      .send("Only Admin user Or owner of card can delete it");
  }

  const idOfDeletedCard = await deleteCard(id);
  if (idOfDeletedCard) {
    res.send("Card deleted successfully");
  } else {
    res.status(400).send("something went wrong with card delete");
  }
});

router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const newCard = req.body;
  const modifiedCard = await updateCard(id, newCard);
  if (modifiedCard) {
    res.send(modifiedCard);
  } else {
    res.status(400).send("something went wrong with card edit");
  }
});

export default router;
