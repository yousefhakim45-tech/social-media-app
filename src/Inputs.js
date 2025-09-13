import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";

/* -------------------- Animations -------------------- */

// Floating placeholder animation
const floatUp = keyframes`
  0% { transform: translateY(0); font-size: 1rem; color: #a1a1a1; }
  100% { transform: translateY(-26px); font-size: 0.85rem; color: #3f51b5; }
`;

// Glowing error
const glowError = keyframes`
  0% { box-shadow: 0 0 6px rgba(255,0,0,0.3); }
  100% { box-shadow: 0 0 18px rgba(255,0,0,0.5); }
`;

/* -------------------- Form Container -------------------- */
export const Form = styled(motion.form)`
  max-width: 500px;
  margin: 3rem auto;
  padding: 3rem;
  background: linear-gradient(145deg, #f0f4ff, #dce6ff);
  border-radius: 16px;
  box-shadow: 10px 10px 30px rgba(0,0,0,0.05),
              -10px -10px 30px rgba(255,255,255,0.8);
  perspective: 1200px;
  transform-style: preserve-3d;
`;

/* -------------------- Input Container with Floating Label -------------------- */
export const InputGroup = styled.div`
  position: relative;
  margin: 1.5rem 0;
`;

export const Input = styled(motion.input)`
  width: 100%;
  padding: 14px 16px;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  outline: none;
  background: #fefefe;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
  color: #111;

  &:focus {
    border-color: #3f51b5;
    transform: translateZ(6px);
    box-shadow: 0 8px 20px rgba(63,81,181,0.25);
  }

  &:focus + label,
  &:not(:placeholder-shown) + label {
    animation: ${floatUp} 0.3s forwards;
  }
`;

/* -------------------- Floating Label -------------------- */
export const Label = styled.label`
  position: absolute;
  left: 16px;
  top: 14px;
  color: #a1a1a1;
  font-size: 1rem;
  pointer-events: none;
  transition: all 0.3s ease;
`;

/* -------------------- Select -------------------- */
export const Select = styled(motion.select)`
  width: 100%;
  padding: 14px 16px;
  margin: 12px 0;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 12px;
  outline: none;
  background: #fefefe;
  transition: all 0.3s ease;

  &:focus {
    border-color: #3f51b5;
    transform: translateZ(5px);
    box-shadow: 0 6px 12px rgba(63,81,181,0.2);
  }

  option {
    text-transform: capitalize;
  }
`;

/* -------------------- Button -------------------- */
export const Button = styled(motion.button)`
  width: 100%;
  padding: 16px;
  margin-top: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #3f51b5, #6573c3);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-transform: capitalize;
  box-shadow: 0 6px 15px rgba(63,81,181,0.25);
  transition: all 0.25s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px) translateZ(5px);
    box-shadow: 0 10px 20px rgba(63,81,181,0.35);
    background: linear-gradient(135deg, #303f9f, #3f51b5);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: 0 4px 10px rgba(63,81,181,0.25);
  }
`;

/* -------------------- Error Box -------------------- */
export const ErrorBox = styled(motion.div)`
  background-color: #ffe3e3;
  color: #cc0000;
  padding: 14px 16px;
  margin-bottom: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 0 8px rgba(204,0,0,0.3);
  animation: ${glowError} 1.5s infinite alternate;
`;

/* -------------------- Info Box -------------------- */
export const InfoBox = styled(motion.div)`
  background-color: #e0f7ff;
  color: #0288d1;
  padding: 14px 16px;
  margin-bottom: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 0 8px rgba(2,136,209,0.3);
  transition: all 0.3s ease;
`;
