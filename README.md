# 🚀 Cards Server - Node.js API (Full Stack Project)

This is a robust backend application built with Express, Mongoose, and MongoDB, implementing secure User and Business Card management. The architecture emphasizes **security, clear separation of concerns, and defined authorization rules.**

## 🏗️ Project Architecture

The application strictly follows a Layered Architecture (similar to MVC) for maintainability and testing:

1.  **Router/Controller:** Handles HTTP requests, calls the Service Layer, and manages response status codes (e.g., 200, 400, 403, 500).
2.  **Service Layer (Business Logic):** Enforces all business rules, handles **Authorization checks** (Owner/Admin), encrypts passwords, and performs Joi validation.
3.  **Data Access Layer (DAL):** Manages direct interaction with the MongoDB database (Mongoose queries).

## 🔒 Key Security & Authorization Features

| Feature                 | Endpoint / Rule         | Description                                                                                              |
| :---------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------- |
| **Authentication**      | `POST /users/login`     | Uses **JWT** (JSON Web Tokens) for user sessions.                                                        |
| **Login Throttling**    | `POST /users/login`     | **Locks** an account for **2 hours** after 3 consecutive failed login attempts (Brute-Force Protection). |
| **Card Creation**       | `POST /cards`           | Only **Business Users** or **Admins** can create a card.                                                 |
| **Card Update/Delete**  | `PUT/DELETE /cards/:id` | Only the **Card Owner** or an **Admin** can perform these actions.                                       |
| **User Status Upgrade** | `PATCH /users/:id/`     | Allows a user to upgrade their own status to `isBusiness: true` (or downgrade).                          |

## ⚙️ Setup and Running Locally

1.  **Clone the Repository:**

    ```bash
    git clone [Your repository URL]
    cd cardsServer
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment:**

    - Create a file named **`.env`** in the root directory.
    - Set your MongoDB connection string (`DB_URI`) and your JWT secret key (`JWT_SECRET`).

4.  **Initial Data Seeding (Crucial for Testing):**
    The server is configured to automatically run `initializeData()` upon startup after connecting to the DB. This process ensures the following test accounts and cards are created:

    - **Admin User (with full privileges)**
    - **Business User (for card creation and ownership tests)**
    - **Regular User (for denial-of-access tests)**

5.  **Start the Server:**
    ```bash
    npm start  # or nodemon
    ```

---
