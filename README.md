# ProfileCardIauoe

**ProfileCardIauoe** is a modern **Next.js** project that allows students to log in using their school credentials and view a dynamic student profile card. The profile card features:

- Student personal info (name, matriculation number, email, phone)
- Department, faculty, level, and course details
- CGPA display with star ratings
- Dynamic QR code containing student profile data
- Customizable card colors and themes
- Screenshot functionality for both front and back of the card
- 3D flipping animation for interactive UI

This project was bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app) and leverages modern web technologies for a responsive and interactive student dashboard.

---

## Features

- **Next.js 13+** with `app` and `pages` directories support
- **TypeScript** for type safety
- **Tailwind CSS** for responsive styling
- **Multiavatar** integration for dynamic avatars
- **QR Code generation** via `qrcode.react`
- **Screenshot functionality** using `html-to-image` / `html2canvas`
- **Dynamic theming** with color pickers and predefined themes
- **3D card flip animation** for interactive UI
- **Random CGPA generation** with visual star rating

---

## Demo

![Student Profile Card Screenshot](screenshot.png)  
*Front and back view of the student profile card*

---

## Getting Started

### Prerequisites

Make sure you have **Node.js** installed (v16+ recommended).

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
