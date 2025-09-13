import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { SuccessSnackbar } from "./loginAlert";
import {
  Form as StyledForm,
  Input as StyledInput,
  Select as StyledSelect,
  Button as StyledButton,
  ErrorBox,
  InfoBox,
  InputGroup,
  Label
} from "./Inputs";
import { 
  Person as PersonIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  VpnKey as VpnKeyIcon, 
  Image as ImageIcon 
} from "@mui/icons-material";
import { Button as MuiButton } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
// 🔹 Validation Rules for Feedback Panel
const validationRules = {
  name: [
    { label: "At least 2 characters", test: (v) => v.length >= 2 },
    { label: "Only letters and spaces", test: (v) => /^[a-zA-Z\s]+$/.test(v) },
    { label: "Max 50 characters", test: (v) => v.length <= 50 },
  ],
  email: [
    { label: "Valid email format", test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { label: "Gmail, Yahoo, or Outlook only", test: (v) => /^[\w.-]+@(gmail|yahoo|outlook)\.com$/.test(v) },
  ],
  phone: [
    { label: "10–15 digits, can include +", test: (v) => /^\+?\d{10,15}$/.test(v) },
  ],
  description: [
    { label: "At least 10 characters", test: (v) => v.length >= 10 },
    { label: "Max 300 characters", test: (v) => v.length <= 300 },
  ],
};
function FieldRules({ field, value }) {
  const rules = validationRules[field] || [];
  const hasError = rules.some(rule => !rule.test(value || ""));
  if (!hasError) return null; // hide completely if valid

  return (
    <div style={{ marginTop: "4px", fontSize: "0.85rem" }}>
      {rules.map((rule, idx) => {
        const passed = rule.test(value || "");
        return (
          <div key={idx} style={{ color: passed ? "limegreen" : "#f87171", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>{passed ? "✔️" : "❌"}</span>
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// 🔹 Helper: File Preview Hook
function useFilePreview(file) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return preview;
}

// 🔹 Helper: OTP Timer Hook
function useOtpTimer(initial = 60) {
  const [seconds, setSeconds] = useState(initial);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active) return;
    if (seconds <= 0) { setActive(false); return; }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [active, seconds]);
  const start = (s = initial) => { setSeconds(s); setActive(true); };
  const reset = () => { setSeconds(initial); setActive(false); };
  return { seconds, active, start, reset };
}
const validationSchema = Yup.object({
  name: Yup.string()
    .matches(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .required("Name is required"),

  email: Yup.string()
    .email("Invalid email format")
    .matches(/^[\w.-]+@(gmail|yahoo|outlook)\.com$/, "Email must be from gmail, yahoo, or outlook")
    .required("Email is required"),

  phone: Yup.string()
    .matches(/^\+?\d{10,15}$/, "Phone number must be between 10 and 15 digits, can include +")
    .required("Phone number is required"),

  role: Yup.string()
    .oneOf(["admin", "editor", "viewer"], "Role must be admin, editor, or viewer")
    .required("Role is required"),

  gender: Yup.string()
    .oneOf(["male", "female", "other"], "Gender must be male, female, or other")
    .required("Gender is required"),

  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .max(300, "Description cannot exceed 300 characters")
    .required("Description is required"),

});

export default function LoginForm({ onLogin }) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [showQr, setShowQr] = useState(false);

  const { seconds, active, start, reset } = useOtpTimer(60);

  const navigate = useNavigate();

  // 🔹 Formik Setup
// ✅ Formik Setup
const formik = useFormik({
  initialValues: {
    name: "",
    email: "",
    phone: "",
    role: "user",
    gender: "",
    description: "",
    photo: null,
  },
  validationSchema,
  onSubmit: async (values) => {
    const pretty = JSON.stringify(values, null, 2);
  
    // 1️⃣ Preview form data
    const previewRes = await Swal.fire({
      title: "Form Data Preview",
      html: `
        <pre style="
          text-align:left;
          white-space:pre-wrap;
          margin:0;
          padding:12px;
          border-radius:10px;
          background:#0f172a;
          color:#38bdf8;
          font-family:'Fira Code', monospace;
          font-size:14px;
          line-height:1.5;
          max-height:250px;
          overflow:auto;
          border:1px solid #334155;
          box-shadow:inset 0 0 8px rgba(0,0,0,0.6);
        ">${pretty}</pre>`,
      icon: "info",
      width: 600,
      confirmButtonText: "✅ Continue",
      showCancelButton: true,
      cancelButtonText: "❌ Cancel",
      background: "#1e293b",
      color: "#f8fafc",
      customClass: {
        popup: "rounded-2xl shadow-lg border border-gray-600",
        title: "text-xl font-bold",
      },
    });
  
    if (!previewRes.isConfirmed) return; // User canceled
  
    try {
      // 2️⃣ Convert values to FormData
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== null) formData.append(key, val);
      });
  
      // 3️⃣ Register user
      const response = await axios.post(
        "http://localhost:5000/api/users",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
  
      // 4️⃣ Display user info (photo + basic info)
      Swal.fire({
        title: "🎉 User Registered",
        html: `
          <p><b>ID:</b> ${response.data.id}</p>
          <p><b>Name:</b> ${values.name}</p>
          <p><b>Phone:</b> ${values.phone} (OTP sent ✅)</p>
          ${response.data.photo ? `<img src="http://localhost:5000${response.data.photo}" 
               alt="Profile" style="max-width:150px;border-radius:8px;margin-top:10px;" />` : ""}
        `,
        icon: "success",
      });
  
      // 5️⃣ Send OTP and show HTML from backend
      const sendRes = await axios.post("http://localhost:5000/send-otp", {
        phone: values.phone,
      });
  
      await Swal.fire({
        title: "🔐 OTP Sent",
        html: sendRes.data.html || `<p>OTP sent to ${values.phone} ✅</p>`,
        background: "#0f172a",
        color: "#f8fafc",
        confirmButtonText: "✅ Continue",
      });
  
      // 6️⃣ Ask user to enter OTP
      const { value: otp } = await Swal.fire({
        title: "🔐 Enter OTP",
        html: sendRes.data.html || `<p>OTP sent to ${values.phone} ✅</p>`,
        input: "text",
        inputLabel: `OTP sent to ${values.phone}`,
        inputPlaceholder: "Enter the 6-digit code",
        inputAttributes: {
          maxlength: 6,
          autocapitalize: "off",
          autocorrect: "off",
        },
        showCancelButton: true,
        confirmButtonText: "✅ Verify",
        cancelButtonText: "❌ Cancel",
        background: "#0f172a",
        color: "#f8fafc",
        inputValidator: (value) => {
          if (!value) return "Please enter the OTP!";
        },
      });
  
      if (!otp) return; // user canceled
  
      // 7️⃣ Verify OTP
      const verifyRes = await axios.post("http://localhost:5000/verify-otp", {
        phone: values.phone,
        code: otp,
      });
  
      if (verifyRes.data.message.includes("success")) {
        Swal.fire({
          icon: "success",
          title: "🎉 Phone Verified!",
          text: "You will be redirected now.",
          timer: 2000,
          showConfirmButton: false,
          background: "#0f172a",
          color: "#f8fafc",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "❌ Verification Failed",
          text: verifyRes.data.message,
          background: "#0f172a",
          color: "#f8fafc",
        });
        return;
      }
  
      // 8️⃣ Navigate with query params (excluding files)
      const queryParams = new URLSearchParams();
      Object.entries(values).forEach(([key, val]) => {
        if (!(val instanceof File)) queryParams.append(key, val ?? "");
      });
      navigate("/App", {
        state: {
          userData: {
            name: values.name,
            email: values.email,
            phone: values.phone,
            role: values.role,
            gender: values.gender,
            description: values.description,
            photo: values.photo,
          },
        },
      });
      
  
    } catch (error) {
      console.error("🔥 Full Error Object:", error);
  
      Swal.fire({
        icon: "error",
        title: "Request Failed 🚨",
        html: `
          <b>Message:</b> ${error.response?.data?.message || error.message} <br/>
          <b>Status:</b> ${error.response?.status || "N/A"} <br/>
          <b>URL:</b> ${error.config?.url || "N/A"} <br/>
          <pre style="text-align:left; max-height:200px; overflow:auto; background:#111; color:#0f0; padding:10px; border-radius:8px;">
            ${JSON.stringify(error.response?.data || {}, null, 2)}
          </pre>
        `,
      });
    }
  }
,  
  validateOnBlur: true,
  validateOnChange: true,
});

// 🔹 Custom Submit with Validation Check
const handleCustomSubmit = (e) => {
  e.preventDefault();
  if (!formik.isValid) {
    Swal.fire({
      title: "⚠️ Fix Form Errors",
      html: `
        <ul style="text-align:left">
          ${Object.values(formik.errors).map((err) => `<li>❌ ${err}</li>`).join("")}
        </ul>
        <p style="margin-top:10px;">Please correct these issues before continuing.</p>
      `,
      icon: "error",
      confirmButtonText: "Okay, I'll fix them",
      background: "#fef2f2",
      color: "#991b1b",
    });
    return;
  }
  formik.handleSubmit();
};

  const photoPreview = useFilePreview(formik.values.photo);

  function setFieldFile(name, file) {
    formik.setFieldValue(name, file);
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #6a5acd, #1e90ff)",
        padding: "1rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(15px)",
          padding: "2rem",
          borderRadius: "15px",
          width: "100%",
          maxWidth: "560px",
          color: "#fff",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          {otpStep ? "Verify Code" : "User Login"}
        </h2>

        {!otpStep ? (
          <StyledForm onSubmit={formik.handleSubmit}>
            <InputGroup>
              <StyledInput
                name="name"
                placeholder=" "
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                 autoComplete="off"
              />
              <Label>Name</Label>
              <FieldRules field="name" value={formik.values.name} />
            </InputGroup>

            <InputGroup>
              <StyledInput
                type="email"
                name="email"
                placeholder=" "
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                 autoComplete="off"
              />
              <Label>Email</Label>
              <FieldRules field="email" value={formik.values.email} />
            </InputGroup>

            <InputGroup>
              <StyledInput
                type="tel"
                name="phone"
                placeholder=" "
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                 autoComplete="off"
              />
              <Label>Phone</Label>
              <FieldRules field="phone" value={formik.values.phone} />
            </InputGroup>

            <InputGroup>
              <StyledSelect
                name="role"
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </StyledSelect>
            </InputGroup>

            <InputGroup>
              <StyledSelect
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </StyledSelect>
            </InputGroup>

            {/* Profile Photo Upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <StyledButton type="button" onClick={() => document.getElementById("photoUpload").click()}>
                Upload Profile Photo
              </StyledButton>
              <input
                id="photoUpload"
                type="file"
                name="photo"
                accept="image/*"
                onChange={(e) => setFieldFile("photo", e.currentTarget.files?.[0] || null)}
                style={{ display: "none" }}
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px", marginTop: "5px" }}
                />
              )}
            </div>

            <InputGroup>
              <StyledInput
                as="textarea"
                name="description"
                placeholder=" "
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                style={{ minHeight: "70px", resize: "none" }}
              />
              <Label>Short Bio</Label>
              <FieldRules field="description" value={formik.values.description} />
            </InputGroup>

            <StyledButton type="submit">Submit & Preview</StyledButton>
          </StyledForm>
        ) : (
          <StyledForm>
            <p style={{ textAlign: "center" }}>Enter the 6-digit OTP</p>
            <InputGroup>
              <StyledInput
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder=" "
                required
              />
              <Label>OTP Code</Label>
            </InputGroup>
          </StyledForm>
        )}
      </motion.div>

      <SuccessSnackbar
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        message="<b>Login successfully</b>"
      />
    </div>
  );
}
