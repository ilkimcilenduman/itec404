PROJECT NAME: Club Management System – Forum Module

DESCRIPTION:
This project is a web-based forum module for managing student clubs. It includes both frontend and backend components and uses a MySQL database. The backend provides APIs, while the frontend offers an interactive interface for users to interact with club forums. The application supports user authentication, forum post management, and role-based access.

REQUIREMENTS:
- Node.js (v18 or higher)
- npm or yarn
- MySQL (Recommended: XAMPP for local development)
- Visual Studio Code or any preferred editor

FOLDER STRUCTURE:
- /client  -> Frontend (React + TypeScript + Vite + Tailwind)
- /server  -> Backend (Node.js + Express + MySQL)

SETUP INSTRUCTIONS:

1. **Extract the zip file**
   Unzip `m.zip` to your desired directory.

2. **Start MySQL Server**
   - Open XAMPP.
   - Start the **MySQL** module.
   - Open **phpMyAdmin** or MySQL CLI and create a database (`club_management`).

3. **Configure MySQL Connection**
   - Navigate to the `/server` folder.
   - Open the `.env` file or relevant config file (e.g., `db.js`, `config.js`) and ensure the following details match your MySQL setup:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=club_management
     DB_PORT=3306
     ```

4. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

5. **Run Backend Server**
   ```bash
   npm run dev
   ```

6. **Install Frontend Dependencies**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   ```

7. **Run Frontend Development Server**
   ```bash
   npm run dev
   ```

8. **Access the Application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API (default): [http://localhost:5000](http://localhost:5000)

TROUBLESHOOTING:
- Ensure both frontend and backend are running in separate terminals.
- If API calls fail, check CORS settings or update API URLs in frontend `.env` or axios configurations.
- Check database credentials if backend fails to connect to MySQL.

CONTACT:
For any questions or issues regarding setup or running the system, contact the development team lead: İlkim Çilen Duman.
GitHub: https://github.com/ilkimcilenduman/itec404.git