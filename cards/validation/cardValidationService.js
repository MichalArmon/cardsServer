import cardSchema from "./cardValidationSchema.js";

export const validateCard = (card) => {
  return cardSchema.validate(card);
};

//משימה
//למנוע הכנסת כרטיס לא תקין למסד הנתונים
//יש להדפיס בקונסול את הסיבה לשגיאה
