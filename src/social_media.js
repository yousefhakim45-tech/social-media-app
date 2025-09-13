import React from "react";
import PostFormAndList from "./PostFormAndList";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { IconButton } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";

const MySwal = withReactContent(Swal);

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = location.state || {};

  // If no userData, redirect to login (secure)
  if (!userData) {
    navigate("/", { replace: true });
    return null; // prevent rendering
  }

  // Function to open Swal dashboard
  const openDashboard = () => {
    MySwal.fire({
      title: "🚀 Dashboard",
      html: (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "1.5rem",
            color: "#f8fafc",
            textAlign: "left",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {Object.entries(userData).map(([key, value]) => {
            const isPhoto = key.toLowerCase() === "photo";
            const photoUrl =
              value && !(value instanceof File)
                ? value
                : value instanceof File
                ? URL.createObjectURL(value)
                : null;

            return (
              <div
                key={key}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "0.8rem",
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.95rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontWeight: "600", textTransform: "capitalize" }}>
                  {key}:
                </span>

                {isPhoto ? (
                  photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="User"
                      style={{
                        maxWidth: "120px",
                        maxHeight: "120px",
                        borderRadius: "12px",
                        marginLeft: "1rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}
                    />
                  ) : (
                    <span style={{ marginLeft: "1rem", opacity: 0.7 }}>
                      No photo uploaded
                    </span>
                  )
                ) : (
                  <span style={{ opacity: 0.9, marginLeft: "1rem" }}>{value}</span>
                )}
              </div>
            );
          })}
        </div>
      ),
      showConfirmButton: false,
      showCloseButton: true,
      width: "550px",
      background: "#1e293b",
      customClass: {
        popup: "rounded-2xl shadow-xl",
        title: "text-white font-bold",
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* MUI icon button to open Swal */}
      <IconButton
        color="primary"
        onClick={openDashboard}
        size="large"
        aria-label="Open Dashboard"
        style={{
          position: "absolute",
          top: "1rem",
          left: "1rem",
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
        }}
      >
        <DashboardIcon fontSize="inherit" />
      </IconButton>

      {/* Posts section */}
      <div style={{ marginTop: "5rem" }}>
        <PostFormAndList />
      </div>
    </div>
  );
}
