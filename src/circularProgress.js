// FancySpinner.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, keyframes } from "@mui/material";

// Keyframes for spinner dash animation
export const dash = keyframes`
  0% {
    stroke-dashoffset: 280;
  }
  50% {
    stroke-dashoffset: 75;
    transform: rotate(45deg);
  }
  100% {
    stroke-dashoffset: 280;
    transform: rotate(360deg);
  }
`;

// Keyframes for spinner rotation
export const rotate = keyframes`
  0% { transform: rotate(0deg);}
  100% { transform: rotate(360deg);}
`;

// Keyframes for fade in + slide up animation
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Keyframes for fade out + slide down animation
const fadeOutDown = keyframes`
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(20px);
  }
`;

// Spinner component
export const FancySpinner = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      mt: 4,
      mb: 2,
    }}
  >
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        animation: `${rotate} 2s linear infinite`,
        transformOrigin: "center center",
      }}
    >
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00ffea" />
          <stop offset="50%" stopColor="#00aaff" />
          <stop offset="100%" stopColor="#0055ff" />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="url(#gradient)"
        strokeWidth="4"
        strokeDasharray="140 280"
        strokeDashoffset="280"
        strokeLinecap="round"
        fill="transparent"
        style={{
          animation: `${dash} 1.5s ease-in-out infinite`,
          transformOrigin: "center center",
        }}
      />
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="#00aaff"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
        style={{
          filter: "drop-shadow(0 0 4px #00aaff)",
        }}
      />
    </svg>
  </Box>
);

// ContentLoadedText component with fade in/out animations & auto-disappear
export const ContentLoadedText = ({ children = "Content loaded!" }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Start timer to hide after 2 seconds
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Typography
      variant="h6"
      align="center"
      sx={{
        color: "primary.main",
        fontWeight: "bold",
        fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
        mt: 3,
        mb: 2,
        textShadow: "0 0 5px rgba(0, 170, 255, 0.7)",
        userSelect: "none",
        animation: visible
          ? `${fadeInUp} 0.6s ease forwards`
          : `${fadeOutDown} 0.6s ease forwards`,
      }}
    >
      {children}
    </Typography>
  );
};
