import _ from "lodash";
import { getCardByBizNumber } from "../services/cardsDataService.js";

export const generateBizNumber = async () => {
  let newBizNumber;
  let isCardWithThisBizNumExists;

  do {
    newBizNumber = _.random(1_000_000, 9_999_999);
    isCardWithThisBizNumExists = await getCardByBizNumber(newBizNumber);
  } while (isCardWithThisBizNumExists);

  return newBizNumber;
};
