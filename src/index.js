import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginForm from "./login";
import App from "./social_media"; 
// Define your routes here
function Index() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/App" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
} 

// ✅ Mount it to the DOM
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Index />);
