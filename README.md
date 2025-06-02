# **SecurePay**

SecurePay is a next-generation payment security platform that leverages AI and Multi-App Interoperability to provide secure and seamless payment solutions. This project includes both a **frontend** built with React and a **backend** powered by Node.js and MongoDB.

---

## **Features**

### **Frontend**
1. **User Authentication**:
   - Create an account with email verification and OTP.
   - Login using mobile number and MPIN.

2. **Card Management**:
   - Add, delete, and set primary cards.
   - View masked card details for enhanced security.

3. **Transaction History**:
   - View detailed transaction history.
   - Fraud detection using AI models.

4. **Fraud Reporting**:
   - Display fraud reports with timestamps, amounts, and risk scores.

5. **Support System**:
   - Submit feedback via a contact form.
   - View support contact details.

### **Backend**
1. **Secure APIs**:
   - Create account, login, and manage cards.
   - Fetch transaction history and fraud reports.

2. **Fraud Detection**:
   - AI-based fraud detection logic implemented in `ml_model.js`.

---

## **Project Structure**

### **Frontend**
- **Framework**: React
- **Folder Structure**:
  ```plaintext
  src/
    App.jsx          # Main application file
    Components/      # React components
      cards.jsx      # Card management
      create_account.jsx # Account creation
      dashboard.jsx  # User dashboard
      FraudReport.jsx # Fraud reporting
      Support.jsx    # Support page
    assets/          # Static assets
    index.css        # Global styles
    main.jsx         # Entry point
  public/            # Public assets
  ```

### **Backend**
- **Framework**: Node.js
- **Database**: MongoDB
- **Folder Structure**:
  ```plaintext
  models/
    User.js          # User schema
  server.js          # Main server file
  ml_model.js        # Fraud detection logic
  ml_server.js       # Machine learning server
  ```

---

## **Installation**

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm

### **Setup**

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/SecurePay.git
   cd SecurePay
   ```

2. **Install Dependencies**:
   - **Frontend**:
     ```bash
     cd Frontend
     npm install
     ```
   - **Backend**:
     ```bash
     cd Backend
     npm install
     ```

3. **Configure Environment Variables**:
   - Create a `.env` file in the `Backend` folder:
     ```env
     MONGO_URI=mongodb://localhost:27017/securepay
     ```

4. **Start the Servers**:
   - **Backend**:
     ```bash
     cd Backend
     node server.js
     ```
   - **Frontend**:
     ```bash
     cd Frontend
     npm run dev
     ```

5. **Access the Application**:
   - Open the frontend in your browser at `http://localhost:5173`.

---

## **Usage**

### **Frontend**
1. **Create Account**:
   - Navigate to `/create-account`.
   - Fill in the details, verify email via OTP, and set MPIN.

2. **Login**:
   - Navigate to `/login`.
   - Enter mobile number and MPIN.

3. **Dashboard**:
   - View transaction history and fraud reports.

4. **Card Management**:
   - Add, delete, or set primary cards.

5. **Support**:
   - Submit feedback via the contact form.

### **Backend**
1. **API Endpoints**:
   - `/api/create-account`: Create a new user account.
   - `/api/login`: Authenticate user.
   - `/api/add-card`: Add a new card.
   - `/api/delete-card`: Delete a card.
   - `/api/fraud-report`: Fetch fraud reports.
   - `/api/transaction-history`: Fetch transaction history.

2. **Machine Learning**:
   - Fraud detection logic is implemented in `ml_model.js`.

---

## **Technologies Used**

### **Frontend**
- React
- React Router
- EmailJS (for OTP)
- CSS for styling

### **Backend**
- Node.js
- Express.js
- MongoDB
- bcrypt (for password hashing)
- dotenv (for environment variables)

---

## **About Author**

This project was developed by **Bharath Honakatti**, a passionate developer with expertise in web development and secure payment systems. For any queries or feedback, feel free to reach out.

---

### **How to Push to GitHub**
1. Save this README file as `README.md` in your project directory.
2. Follow these steps to push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with README"
   git remote add origin https://github.com/your-username/SecurePay.git
   git branch -M main
   git push -u origin main
   ```

---
