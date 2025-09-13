import React, { useState } from "react";
import { Snackbar, Alert } from "@mui/material";

export function SuccessSnackbar({ open, onClose, message }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert 
        onClose={onClose} 
        severity="success" 
        sx={{ width: '100%' }}
        // Allow HTML inside Alert by using dangerouslySetInnerHTML
        // Be cautious with this in real apps for XSS risk, sanitize if input is user-generated
        >
        <span dangerouslySetInnerHTML={{ __html: message }} />
      </Alert>
    </Snackbar>
  );
}
