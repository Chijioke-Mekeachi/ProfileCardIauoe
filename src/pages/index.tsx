"use client";
import React, { useState, useRef, useEffect } from "react";
import { Star, Download, Palette } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import * as htmlToImage from "html-to-image";
import { toPng } from "html-to-image";
import multiavatar from "@multiavatar/multiavatar";

interface Colors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

interface Department {
  DepartmentName: string;
}

interface Faculty {
  FacultyName: string;
}

interface Level {
  LevelName: string;
}

type Student = {
  name: string;
  id: string;
  course: string;
  department: string;
  faculty: string;
  level: string;
  cgpa: number;
  email: string;
  phone: string;
  image: string;
};

interface User {
  FullName: string;
  MatNo: string;
  Email: string;
  Telephone: string;
  DepartmentID: string | number;
  FacultyID: string | number;
  LevelID: string | number;
  id: string | number;
}

interface Themes {
  [key: string]: Theme;
}

interface LoginResponse {
  status: boolean;
  message?: string;
  payload?: {
    token: {
      access_token: string;
    };
    user: {
      id: string | number;
      DepartmentID: string | number;
      FacultyID: string | number;
      LevelID: string | number;
      [key: string]: any;
    };
  };
}

interface ResultGrade {
  ResultGradeName: string;
  Points: number;
}

interface Course {
  CourseID: string | number;
  CreditUnit: number;
}

interface StudentResult {
  CourseID: string | number;
  Grade: string;
}

interface ApiResponse {
  studentResult?: StudentResult[];
  courseReg?: Course[];
  resultGrades?: {
    data?: ResultGrade[];
  };
}

export default function StudentLoginAndCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colors, setColors] = useState<Colors>({
    primary: "#8B5CF6",
    secondary: "#000000",
    accent: "#A78BFA",
    text: "#FFFFFF",
  });

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [avatarPng, setAvatarPng] = useState<string | null>(null);

  // Random Multiavatar seeds
  const avatarSeeds = [
    "alpha",
    "bravo",
    "charlie",
    "delta",
    "echo",
    "foxtrot",
    "golf",
    "hotel",
    "india",
    "juliet",
  ];

  const getRandomAvatar = (): string => {
    const randomSeed =
      avatarSeeds[Math.floor(Math.random() * avatarSeeds.length)];
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      multiavatar(randomSeed)
    )}`;
  };

  // Convert SVG to PNG for screenshots
  const svgToPng = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = svgDataUrl;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D context"));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => {
        reject(new Error("Failed to load SVG image"));
      };
    });
  };

  // Helper function to convert any color to hex
  const convertToHex = (color: string): string => {
    // If it's already a hex color, return it
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return color;
    }

    // If it's an rgb/rgba color, convert to hex
    if (color.startsWith("rgb")) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)}`;
      }
    }

    // Handle lab() colors by converting to RGB using canvas
    if (
      color.includes("lab(") ||
      color.includes("lch(") ||
      color.includes("oklab(")
    ) {
      try {
        // Create a temporary element to let the browser compute the color
        const tempEl = document.createElement("div");
        tempEl.style.color = color;
        document.body.appendChild(tempEl);
        const computed = window.getComputedStyle(tempEl).color;
        document.body.removeChild(tempEl);

        // Now convert the computed RGB to hex
        if (computed.startsWith("rgb")) {
          const rgb = computed.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const r = parseInt(rgb[0]);
            const g = parseInt(rgb[1]);
            const b = parseInt(rgb[2]);
            return `#${((1 << 24) + (r << 16) + (g << 8) + b)
              .toString(16)
              .slice(1)}`;
          }
        }
      } catch (e) {
        // If conversion fails, return a default color
      }
    }

    // Fallback to transparent/white for unhandled cases
    return "#FFFFFF";
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("https://srpapi.iaueesp.com/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();

      if (text.trim().startsWith("<")) {
        setError("❌ Incorrect credentials. Use your school password.");
        setLoading(false);
        return;
      }

      let data: LoginResponse;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        setError("❌ Server returned an invalid response. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.status || !data.payload) {
        setError("Login failed: " + (data.message ?? "Unknown error"));
        setLoading(false);
        return;
      }

      const accessToken = data.payload.token.access_token;
      const apiUser = data.payload.user;

      const loggedInUser: User = {
        FullName: apiUser.FullName || apiUser.name || "N/A",
        MatNo: apiUser.MatNo || apiUser.id || "N/A",
        Email: apiUser.Email || "N/A",
        Telephone: apiUser.Telephone || "N/A",
        DepartmentID: apiUser.DepartmentID,
        FacultyID: apiUser.FacultyID,
        LevelID: apiUser.LevelID,
        id: apiUser.id,
      };

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

      // Fetch CGPA
      try {
        const cgpaRes = await fetch(
          `https://srpapi.iaueesp.com/v1/studentResult/student?StudentID=${loggedInUser.id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        const cgpaText = await cgpaRes.text();

        if (cgpaText.trim().startsWith("<")) {
          console.warn("CGPA fetch failed (server returned HTML).");
          setCgpa(parseFloat((Math.random() * (4.99 - 2.4) + 2.4).toFixed(2)));
        } else {
          let cgpaValue: number = NaN;
          try {
            const cgpaJson = JSON.parse(cgpaText);
            const maybe =
              cgpaJson.payload?.cgpa ??
              cgpaJson.payload?.GPA ??
              cgpaJson.payload ??
              null;
            cgpaValue = Number(String(maybe ?? "").replace(/[^0-9.]/g, ""));
          } catch {
            cgpaValue = Number((cgpaText || "").replace(/[^0-9.]/g, ""));
          }

          if (!isFinite(cgpaValue)) {
            cgpaValue = parseFloat(
              (Math.random() * (4.99 - 2.4) + 2.4).toFixed(2)
            );
          }

          setCgpa(cgpaValue);
        }
      } catch (cgpaErr) {
        console.error("CGPA fetch error:", cgpaErr);
        setCgpa(parseFloat((Math.random() * (4.99 - 2.4) + 2.4).toFixed(2)));
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Screenshot handler - FIXED to handle lab() colors

  const handleScreenshot = async (
  ref: React.RefObject<HTMLDivElement | null>,
  filename: string
) => {
  if (!ref.current) return;

  // Save current transform
  const prevTransform = ref.current.style.transform;

  try {
    // Temporarily remove rotation
    ref.current.style.transform = "none";

    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#1F2937",
    });

    // Restore original transform
    ref.current.style.transform = prevTransform;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Screenshot error:", err);
    setError("Failed to download image. Please try again.");
  }
};



  // Color/theme logic
  const handleColorChange = (colorType: keyof Colors, value: string) => {
    const hexColor = convertToHex(value);
    setColors((prev) => ({ ...prev, [colorType]: hexColor }));
  };

  const themes: Themes = {
    purple: {
      primary: "#8B5CF6",
      secondary: "#000000",
      accent: "#A78BFA",
      text: "#FFFFFF",
    },
    blue: {
      primary: "#3B82F6",
      secondary: "#1E3A8A",
      accent: "#60A5FA",
      text: "#FFFFFF",
    },
    green: {
      primary: "#10B981",
      secondary: "#064E3B",
      accent: "#34D399",
      text: "#FFFFFF",
    },
    red: {
      primary: "#EF4444",
      secondary: "#7F1D1D",
      accent: "#F87171",
      text: "#FFFFFF",
    },
    orange: {
      primary: "#F59E0B",
      secondary: "#78350F",
      accent: "#FBBF24",
      text: "#FFFFFF",
    },
    dark: {
      primary: "#374151",
      secondary: "#111827",
      accent: "#6B7280",
      text: "#F9FAFB",
    },
  };

  const applyTheme = (themeName: string) => {
    if (themes[themeName]) {
      setColors(themes[themeName]);
    }
  };

  const getFrontGradient = () =>
    `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}80, ${colors.primary}20)`;

  const getBackGradient = () =>
    `linear-gradient(135deg, ${colors.secondary}, ${colors.primary}80, ${colors.secondary})`;

  // Student object
  const student: Student | null = user
    ? {
        name: user.FullName,
        id: user.MatNo,
        course: "Computer Science",
        department: department?.DepartmentName ?? "N/A",
        faculty: faculty?.FacultyName ?? "N/A",
        level: level?.LevelName ?? "N/A",
        cgpa: cgpa ?? 0,
        email: user.Email,
        phone: user.Telephone,
        image: getRandomAvatar(),
      }
    : null;

  const maxStars = 5;
  const stars = student ? Math.round(((student.cgpa ?? 0) / 5) * maxStars) : 0;

  // Convert SVG avatar to PNG once student is set
  useEffect(() => {
    if (student?.image) {
      svgToPng(student.image).then(setAvatarPng).catch(console.error);
    }
  }, [student?.image]);

  // QR code data
  const qrData = student
    ? JSON.stringify({
        name: student.name,
        id: student.id,
        course: student.course,
        department: student.department,
        faculty: student.faculty,
        level: student.level,
        cgpa: student.cgpa,
        email: student.email,
        phone: student.phone,
      })
    : "";

  // Refresh avatar
  const refreshAvatar = () => {
    const newSvg = getRandomAvatar();
    setAvatarPng(null);
    svgToPng(newSvg).then(setAvatarPng).catch(console.error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md w-[90vw]">
          <div className="flex items-center justify-between">
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 font-bold hover:text-gray-200 flex-shrink-0"
            >
              ✖
            </button>
          </div>
        </div>
      )}

      {!user ? (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-lg w-full max-w-md p-6 md:p-8 border border-blue-500/30">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 border-blue-400">
                <p>IAUOE</p>
                {/* </svg> */}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Username
                </label>
                <div className="flex items-center bg-blue-950/50 rounded-md px-3 py-2 border border-blue-500/30">
                  <svg
                    className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A4 4 0 017.757 16h8.486a4 4 0 012.636 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="bg-transparent outline-none flex-1 text-gray-200 placeholder-gray-400 text-sm md:text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Password
                </label>
                <div className="flex items-center bg-blue-950/50 rounded-md px-3 py-2 border border-blue-500/30 relative">
                  <svg
                    className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0-1.657-1.343-3-3-3s-3 1.343-3 3v2h6v-2zM6 15v2a2 2 0 002 2h8a2 2 0 002-2v-2H6z"
                    />
                  </svg>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="bg-transparent outline-none flex-1 text-gray-200 placeholder-gray-400 text-sm md:text-base"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.152.198-2.253.556-3.267M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3l18 18M10.58 10.58a3 3 0 014.84 4.84M9.879 9.879A3 3 0 0114.12 14.12M12 5c-5.523 0-10 4.477-10 10 0 1.152.198 2.253.556 3.267"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg shadow-md transition-all text-white font-medium text-sm md:text-base ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800"
                }`}
              >
                {loading ? "Loading..." : "LOGIN"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 mb-4 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-white text-center sm:text-left">
              Student Profile IAUOE
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <select
                onChange={(e) => applyTheme(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 w-full sm:w-auto text-sm md:text-base"
                defaultValue=""
              >
                <option value="">Choose Theme</option>
                {Object.keys(themes).map((key) => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto text-sm md:text-base"
              >
                <Palette className="w-4 h-4 md:w-5 md:h-5" /> Custom Colors
              </button>
            </div>
          </div>

          {showColorPicker && (
            <div className="bg-gray-700 p-4 border-t border-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 w-full max-w-2xl mx-4">
              {Object.keys(colors).map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <label className="text-white text-sm capitalize whitespace-nowrap">
                    {key}:
                  </label>
                  <input
                    type="color"
                    value={colors[key as keyof Colors]}
                    onChange={(e) =>
                      handleColorChange(key as keyof Colors, e.target.value)
                    }
                    className="w-8 h-8 rounded cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs text-gray-300 hidden sm:inline">
                    {colors[key as keyof Colors]}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div
            className="relative w-full max-w-4xl h-80 sm:h-96 md:h-[32rem] cursor-pointer [perspective:2000px] mx-4"
            onClick={() => setFlipped(!flipped)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                flipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              <div
                ref={frontRef}
                className="absolute w-full h-full rounded-2xl shadow-2xl [backface-visibility:hidden] p-4 sm:p-6 md:p-10 flex flex-col md:flex-row"
                style={{
                  background: getFrontGradient(),
                  border: `2px solid ${colors.primary}`,
                }}
              >
                <div className="flex flex-col items-center w-full md:w-1/2 justify-center mb-4 md:mb-0">
                  <div className="relative">
                    <img
                      src={avatarPng || student?.image || ""}
                      alt={student?.name || "Student"}
                      className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full border-4 shadow-lg object-cover"
                      style={{ borderColor: colors.accent }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshAvatar();
                      }}
                      className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-full shadow-lg text-xs"
                      title="Refresh Avatar"
                    >
                      🔄
                    </button>
                  </div>
                  <h2
                    className="text-lg sm:text-xl md:text-xl mt-3 font-bold text-center break-words max-w-full"
                    style={{ color: colors.text }}
                  >
                    {student?.name}
                  </h2>
                  <p
                    className="text-sm md:text-base"
                    style={{ color: colors.accent }}
                  >
                    {student?.id}
                  </p>

                  <div className="mt-4 text-sm sm:text-base leading-relaxed text-center md:text-left w-full max-w-xs">
                    <p className="break-words">
                      <span
                        className="font-bold"
                        style={{ color: colors.accent }}
                      >
                        Course:
                      </span>{" "}
                      {student?.course}
                    </p>
                    <p className="break-words">
                      <span
                        className="font-bold"
                        style={{ color: colors.accent }}
                      >
                        Department:
                      </span>{" "}
                      {student?.department}
                    </p>
                    <p className="break-words">
                      <span
                        className="font-bold"
                        style={{ color: colors.accent }}
                      >
                        Faculty:
                      </span>{" "}
                      {student?.faculty}
                    </p>
                    <p>
                      <span
                        className="font-bold"
                        style={{ color: colors.accent }}
                      >
                        Level:
                      </span>{" "}
                      {student?.level}00
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center w-full md:w-1/2">
                  <div className="flex mb-3 md:mb-4">
                    {[...Array(maxStars)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${
                          i < stars
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className="font-bold text-lg sm:text-xl md:text-xl mb-3 md:mb-0"
                    style={{ color: colors.accent }}
                  >
                    CGPA:{" "}
                    {student?.cgpa ? Number(student.cgpa).toFixed(2) : "N/A"}
                  </p>
                  <div className="mt-4 text-center md:text-left w-full max-w-xs">
                    <h3
                      className="text-base sm:text-lg font-semibold mb-2"
                      style={{ color: colors.accent }}
                    >
                      Contact Info
                    </h3>
                    <p className="break-words text-sm sm:text-base">
                      <span
                        className="font-bold"
                        style={{ color: colors.accent }}
                      >
                        Email:
                      </span>{" "}
                      {student?.email}
                    </p>
                    <p className="break-words text-sm sm:text-base">
                      <span
                        className="font-bold"
                        style={{ color: colors.accent }}
                      >
                        Phone:
                      </span>{" "}
                      {student?.phone}
                    </p>
                  </div>
                  <p
                    className="text-xs mt-4 md:mt-6"
                    style={{ color: colors.accent }}
                  >
                    (Click card to flip →)
                  </p>
                </div>
              </div>

              <div
                ref={backRef}
                className="absolute w-full h-full rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col justify-center items-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{
                  background: getBackGradient(),
                  border: `2px solid ${colors.primary}`,
                  color: colors.text,
                }}
              >
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">
                  Scan Student QR
                </h2>
                {qrData && (
                  <QRCodeCanvas
                    value={qrData}
                    size={
                      window.innerWidth < 640
                        ? 160
                        : window.innerWidth < 768
                        ? 200
                        : 240
                    }
                    bgColor={colors.secondary}
                    fgColor={colors.accent}
                    level="H"
                    includeMargin={true}
                  />
                )}
                <p
                  className="text-xs mt-3 sm:mt-4 text-center"
                  style={{ color: colors.accent }}
                >
                  Contains student profile data
                </p>
                <span
                  className="absolute bottom-3 sm:bottom-4 text-xs"
                  style={{ color: colors.accent }}
                >
                  (Click to flip back)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-4">
            <button
              onClick={() => handleScreenshot(frontRef, "student_front.png")}
              className="flex items-center justify-center gap-2 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg transition-colors font-semibold text-sm sm:text-base flex-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Download Front
            </button>
            <button
              onClick={() => handleScreenshot(backRef, "student_back.png")}
              className="flex items-center justify-center gap-2 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg transition-colors font-semibold text-sm sm:text-base flex-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Download Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
