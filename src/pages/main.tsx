"use client";
import React, { useState, useRef, useEffect } from "react";
import { Star, Download, Palette } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas-pro";
import multiavatar from "@multiavatar/multiavatar";

export default function StudentLoginAndCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [department, setDepartment] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [level, setLevel] = useState(null);
  const [error, setError] = useState(null);
  const [remember, setRemember]  =useState(false);

  const [flipped, setFlipped] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colors, setColors] = useState({
    primary: "#8B5CF6",
    secondary: "#000000",
    accent: "#A78BFA",
    text: "#FFFFFF",
  });

  const frontRef = useRef(null);
  const backRef = useRef(null);

  // Random Multiavatar seeds
  const avatarSeeds = [
    "alpha", "bravo", "charlie", "delta", "echo",
    "foxtrot", "golf", "hotel", "india", "juliet"
  ];

  const getRandomAvatar = () => {
    const randomSeed = avatarSeeds[Math.floor(Math.random() * avatarSeeds.length)];
    return `data:image/svg+xml;utf8,${encodeURIComponent(multiavatar(randomSeed))}`;
  };

  const [avatarPng, setAvatarPng] = useState(null);

  // Convert SVG to PNG for screenshots
  const svgToPng = (svgDataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = svgDataUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 200;
        canvas.height = img.height || 200;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
    });
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("https://srpapi.iaueesp.com/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get("content-type");
      if (contentType?.includes("text/html")) {
        setError("Server returned HTML instead of JSON. Try again later.");
        return;
      }

      const data = await res.json();
      if (!data.status) {
        setError("Login failed: " + data.message);
        return;
      }

      const accessToken = data.payload.token.access_token;
      const loggedInUser = data.payload.user;
      setUser(loggedInUser);
      setToken(accessToken);

      // Fetch Department
      const depRes = await fetch(
        `https://srpapi.iaueesp.com/v1/department/by/${loggedInUser.DepartmentID}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const depData = await depRes.json();
      if (depData.status) setDepartment(depData.payload);

      // Fetch Faculty
      const facRes = await fetch(
        `https://srpapi.iaueesp.com/v1/faculty/by/${loggedInUser.FacultyID}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const facData = await facRes.json();
      if (facData.status) setFaculty(facData.payload);

      // Fetch Level
      const lvlRes = await fetch(
        `https://srpapi.iaueesp.com/v1/level/${loggedInUser.LevelID}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const lvlData = await lvlRes.json();
      if (lvlData.status) setLevel(lvlData.payload);
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Try again later.");
    }
  };

  // Screenshot handler
  const handleScreenshot = async (ref, filename) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#1F2937",
      useCORS: true,
    });
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = filename;
    link.click();
  };

  // Color/theme logic
  const handleColorChange = (colorType, value) => {
    let hexColor = value;
    if (value.startsWith("rgb") || value.startsWith("lab") || value.startsWith("hsl")) {
      hexColor = colors[colorType];
    }
    setColors((prev) => ({ ...prev, [colorType]: hexColor }));
  };

  const themes = {
    purple: { primary: "#8B5CF6", secondary: "#000000", accent: "#A78BFA", text: "#FFFFFF" },
    blue: { primary: "#3B82F6", secondary: "#1E3A8A", accent: "#60A5FA", text: "#FFFFFF" },
    green: { primary: "#10B981", secondary: "#064E3B", accent: "#34D399", text: "#FFFFFF" },
    red: { primary: "#EF4444", secondary: "#7F1D1D", accent: "#F87171", text: "#FFFFFF" },
    orange: { primary: "#F59E0B", secondary: "#78350F", accent: "#FBBF24", text: "#FFFFFF" },
    dark: { primary: "#374151", secondary: "#111827", accent: "#6B7280", text: "#F9FAFB" },
  };
  const applyTheme = (themeName) => { if (themes[themeName]) setColors(themes[themeName]); };
  const getFrontGradient = () => `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}80, ${colors.primary}20)`;
  const getBackGradient = () => `linear-gradient(135deg, ${colors.secondary}, ${colors.primary}80, ${colors.secondary})`;

  // Student object
  const student = user
    ? {
        name: user.FullName,
        id: user.MatNo,
        course: "Course Placeholder",
        department: department?.DepartmentName || "N/A",
        faculty: faculty?.FacultyName || "N/A",
        level: level?.LevelName || "N/A",
        cgpa: 4.2,
        email: user.Email,
        phone: user.Telephone,
        image: getRandomAvatar(),
      }
    : null;

  const maxStars = 5;
  const stars = student ? Math.round((student.cgpa / 5) * maxStars) : 0;

  // Convert SVG avatar to PNG once student is set
  useEffect(() => {
    if (student?.image) {
      svgToPng(student.image).then(setAvatarPng);
    }
  }, [student]);

  // QR code data (exclude SVG)
  const qrData = student
    ? {
        name: student.name,
        id: student.id,
        course: student.course,
        department: student.department,
        faculty: student.faculty,
        level: student.level,
        cgpa: student.cgpa,
        email: student.email,
        phone: student.phone,
      }
    : null;
    // Refresh avatar
const refreshAvatar = () => {
  if (!student) return;
  const newSvg = getRandomAvatar();
  setAvatarPng(null); // reset first
  svgToPng(newSvg).then(setAvatarPng);
  // Optional: update student.image to new one for QR
  student.image = newSvg;
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      {!user && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg w-full max-w-md p-8 border border-blue-500/30">
        
        {/* Top Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-9 13V5"
              />
            </svg>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <div className="flex items-center bg-blue-950/50 rounded-md px-3 py-2">
              <svg
                className="h-5 w-5 text-gray-400 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 017.757 16h8.486a4 4 0 012.636 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="bg-transparent outline-none flex-1 text-gray-200 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <div className="flex items-center bg-blue-950/50 rounded-md px-3 py-2">
              <svg
                className="h-5 w-5 text-gray-400 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.657-1.343-3-3-3s-3 1.343-3 3v2h6v-2zM6 15v2a2 2 0 002 2h8a2 2 0 002-2v-2H6z" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="bg-transparent outline-none flex-1 text-gray-200 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-gray-400 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-blue-500"
              />
              Remember me
            </label>
            <a href="#" className="hover:text-blue-400">
              Forgot Password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-all"
          >
            LOGIN
          </button>
        </form>
      </div>
    </div>
      )}

      {student && (
        <div className="flex flex-col items-center space-y-6">
          {/* Theme and color pickers */}
          <div className="flex justify-between items-center w-full max-w-7xl mb-4">
            <h1 className="text-xl font-bold text-white font-orbitron">
              Student Profile IAUOE
            </h1>
            <div className="flex items-center space-x-4">
              <select
                onChange={(e) => applyTheme(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
                defaultValue=""
              >
                <option value="">Choose Theme</option>
                {Object.keys(themes).map((key) => (
                  <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                ))}
              </select>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Palette className="w-5 h-5" /> Custom Colors
              </button>
            </div>
          </div>
          {showColorPicker && (
            <div className="bg-gray-700 p-4 border-t border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {["primary", "secondary", "accent", "text"].map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <label className="text-white text-sm capitalize">{key}:</label>
                  <input
                    type="color"
                    value={colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-300">{colors[key]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Flip Card */}
          <div
            className="relative w-full max-w-[44rem] h-[32rem] cursor-pointer [perspective:2000px] "
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* FRONT */}
              <div
                ref={frontRef}
                className="absolute w-full h-full rounded-2xl shadow-2xl [backface-visibility:hidden] p-10 flex"
                style={{ background: getFrontGradient(), border: `2px solid ${colors.primary}` }}
              >
                <div className="flex flex-col items-center w-1/2 justify-center">
                  <img
                    src={avatarPng || student.image}
                    alt={student.name}
                    className="w-44 h-44 rounded-full border-4 shadow-lg"
                    style={{ borderColor: colors.accent }}
                  />
                  <h2 className="text-xl mt-4 font-bold font-orbitron text-center" style={{ color: colors.text }}>
                    {student.name}
                  </h2>
                  <p style={{ color: colors.accent }}>{student.id}</p>
                  <div className="mt-6 text-lg leading-relaxed text-left">
                    <p><span className="font-bold" style={{ color: colors.accent }}>Course:</span> {student.course}</p>
                    <p><span className="font-bold" style={{ color: colors.accent }}>Department:</span> {student.department}</p>
                    <p><span className="font-bold" style={{ color: colors.accent }}>Faculty:</span> {student.faculty}</p>
                    <p><span className="font-bold" style={{ color: colors.accent }}>Level:</span> {student.level}00</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center w-1/2">
                  <div className="flex mb-4">
                    {[...Array(maxStars)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-8 h-8 ${i < stars ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                      />
                    ))}
                  </div>
                  <p className="font-bold text-xl" style={{ color: colors.accent }}>
                    CGPA: {student.cgpa.toFixed(2)}
                  </p>
                  <div className="mt-10 text-left">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: colors.accent }}>Contact Info</h3>
                    <p><span className="font-bold" style={{ color: colors.accent }}>Email:</span> {student.email}</p>
                    <p><span className="font-bold" style={{ color: colors.accent }}>Phone:</span> {student.phone}</p>
                  </div>
                  <p className="text-xs mt-6" style={{ color: colors.accent }}>(Click card to flip →)</p>
                </div>
              </div>

              {/* BACK */}
              <div
                ref={backRef}
                className="absolute w-full h-full rounded-2xl shadow-2xl p-6 flex flex-col justify-center items-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{ background: getBackGradient(), border: `2px solid ${colors.primary}`, color: colors.text }}
              >
                <h2 className="text-xl font-bold mb-6 font-orbitron">Scan Student QR</h2>
                {qrData && (
                  <QRCodeCanvas
                    value={JSON.stringify(qrData)}
                    size={240}
                    bgColor={colors.secondary}
                    fgColor={colors.accent}
                    level="H"
                    includeMargin={true}
                  />
                )}
                <p className="text-xs mt-4" style={{ color: colors.accent }}>Contains student profile data</p>
                <span className="absolute bottom-4 text-xs" style={{ color: colors.accent }}>(Click to flip back)</span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => handleScreenshot(frontRef, "student_front.png")}
              className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg shadow-lg transition-colors font-semibold"
              style={{ backgroundColor: colors.primary }}
            >
              <Download className="w-5 h-5" /> Download Front
            </button>
            <button
    onClick={refreshAvatar}
    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg"
    title="Refresh Avatar"
  >
   Refresh 🔄
  </button>
            <button
              onClick={() => handleScreenshot(backRef, "student_back.png")}
              className="flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg shadow-lg transition-colors font-semibold"
              style={{ backgroundColor: colors.primary }}
            >
              <Download className="w-5 h-5" /> Download Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
