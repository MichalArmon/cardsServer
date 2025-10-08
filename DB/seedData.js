import bcrypt from "bcryptjs";

import Card from "../cards/models/Card.js";
import User from "../users/models/User.js";
import { generateBizNumber } from "../cards/helpers/generateBizNumber.js";

// --- קבועים ואבטחה ---
const BCRYPT_SALT_ROUNDS = 10;
const INITIAL_PASSWORD = "Password!1"; // הסיסמה של כל המשתמשים

// --- נתוני הבסיס (המשתמשים) ---
const usersData = [
  {
    firstName: "Regular",
    lastName: "User",
    email: "regular@test.com",
    phone: "0501111111",
    isBusiness: false,
    isAdmin: false,
    address: {
      country: "Israel",
      city: "Tel Aviv",
      street: "Main St",
      houseNumber: 1,
    },
  },
  {
    firstName: "Business",
    lastName: "User",
    email: "business@test.com",
    phone: "0502222222",
    isBusiness: true,
    isAdmin: false,
    address: {
      country: "Israel",
      city: "Haifa",
      street: "Business Ave",
      houseNumber: 2,
    },
  },
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@test.com",
    phone: "0503333333",
    isBusiness: true,
    isAdmin: true,
    address: {
      country: "Israel",
      city: "Jerusalem",
      street: "Admin Blvd",
      houseNumber: 3,
    },
  },
];

/**
 * מנקה את ה-DB ומזריק 3 משתמשים ו-3 כרטיסים לבדיקה.
 */
export const initializeData = async () => {
  try {
    // מנקה את הנתונים הקיימים (כדי לא ליצור כפילויות של משתמשים)
    await User.deleteMany({});
    await Card.deleteMany({});

    const seededUsers = [];

    // 1. יצירת משתמשים והצפנת סיסמאות
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(
        INITIAL_PASSWORD,
        BCRYPT_SALT_ROUNDS
      );

      const userToCreate = new User({
        ...userData,
        password: hashedPassword, // הטמעה של הסיסמה המוצפנת
      });

      const newUser = await userToCreate.save();
      seededUsers.push(newUser);
    }

    // שליפת ה-IDs של המשתמשים שנוצרו
    const [regularUser, businessUser, adminUser] = seededUsers;

    // 2. יצירת כרטיסים (משויכים ל-IDs)
    const cardsToCreate = [
      {
        title: "כרטיס רגיל: בודק הרשאה",
        subtitle: "נוצר על ידי אדמין לבדיקה",
        description: "כרטיס לבדיקה אם משתמש רגיל יכול ליצור/למחוק.",
        phone: regularUser.phone,
        email: regularUser.email,
        web: "http://regular.com",
        image: {
          url: "https://picsum.photos/400/300",
          alt: "regular user card",
        },
        address: regularUser.address,
        bizNumber: await generateBizNumber(),
        user_id: regularUser._id.toString(),
      },
      {
        title: "כרטיס עסקי: בודק עדכון ובעלות",
        subtitle: "כרטיס לבדיקת בעלות",
        description: "כרטיס זה מאפשר לבעלים שלו לעדכן ולמחוק.",
        phone: businessUser.phone,
        email: businessUser.email,
        web: "http://business.com",
        image: {
          url: "https://picsum.photos/400/300?random=1",
          alt: "business card",
        },
        address: businessUser.address,
        bizNumber: await generateBizNumber(),
        user_id: businessUser._id.toString(),
      },
      {
        title: "כרטיס אדמין: בודק הרשאות על",
        subtitle: "כרטיס לבדיקת הרשאות על",
        description:
          "כרטיס זה מאפשר לאדמין לבדוק את היכולת שלו לשנות כל כרטיס.",
        phone: adminUser.phone,
        email: adminUser.email,
        web: "http://admin.com",
        image: {
          url: "https://picsum.photos/400/300?random=2",
          alt: "admin card",
        },
        address: adminUser.address,
        bizNumber: await generateBizNumber(),
        user_id: adminUser._id.toString(),
      },
    ];

    await Card.insertMany(cardsToCreate);

    console.log(
      "✅ Initial Data Seeding Complete! 3 Users and 3 Cards created."
    );
  } catch (error) {
    console.error("❌ Seeding Failed:", error.message);
    throw new Error("Initial data seeding process failed.");
  }
};
