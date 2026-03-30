# 🛒 Pass Ki Dukan

Pass Ki Dukan is a Grocery & Pharmacy mobile application built using React Native with Expo.  
It provides nearby store access, product browsing, and fast checkout experience.

---

## 🚀 Tech Stack

- React Native
- Expo
- EAS Build
- React Navigation
- Firebase (if used)
- Tailwind / NativeWind (if used)

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/pass-ki-dukan.git
cd pass-ki-dukan
```

### 2. Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

## ▶️ Run Project (Development)

Start Expo development server:

```bash
npx expo start
```

Options:
- Press `a` → Android Emulator
- Press `w` → Web
- Scan QR → Expo Go App

---

## 🏗 Build Preview APK (Internal Testing)

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Login

```bash
eas login
```

### Configure EAS (First Time Only)

```bash
eas build:configure
```

### Generate Preview APK

```bash
eas build -p android --profile preview --clear-cache
```

---

## 📦 Build Production AAB (Play Store)

```bash
eas build --profile production --platform android
```

This will generate `.aab` file for Google Play Store upload.

---

## ⚙️ eas.json Example

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 📱 Android Configuration (app.json)

```json
"android": {
  "package": "com.passkidukan.app",
  "versionCode": 1
}
```

---

## 📁 Project Structure

```
pass-ki-dukan/
│
├── assets/
├── components/
├── screens/
├── navigation/
├── app.json
├── eas.json
└── package.json
```

---

## 🧑‍💻 Author

Mayur Nakum  
Frontend Developer – React Native / Expo
