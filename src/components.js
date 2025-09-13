import { createGlobalStyle,styled,keyframes } from "styled-components";
import { motion } from "framer-motion";

const GlobalStyle = createGlobalStyle`
  body {
    background: #0f172a;
    color: #e2e8f0;
    margin: 0;
    font-family: "Segoe UI", sans-serif;
  }
`;

const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 1.5rem;
`;

const Title = styled.h1`
  text-align: center;
  color: #38bdf8;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  margin-bottom: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(56, 189, 248, 0.2);
`;

const Form = styled.form`
  background: rgba(11, 18, 32, 0.85);
  backdrop-filter: blur(12px);
  padding: 1.2rem;
  border-radius: 14px;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 24px rgba(56, 189, 248, 0.06),
              inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  display: grid;
  gap: 14px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(56, 189, 248, 0.12);
  }
`;

const Input = styled.input`
  background: rgba(15, 23, 36, 0.85);
  color: #e6eef6;
  border: 1px solid #1f2937;
  padding: 0.85rem;
  border-radius: 8px;
  outline: none;
  font-size: 0.95rem;
  transition: border 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
  }
`;

const TextArea = styled.textarea`
  background: rgba(15, 23, 36, 0.85);
  color: #e6eef6;
  border: 1px solid #1f2937;
  padding: 0.85rem;
  border-radius: 8px;
  outline: none;
  resize: vertical;
  font-size: 0.95rem;
  transition: border 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
  }
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  border: none;
  padding: 0.7rem 1rem;
  color: white;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 8px rgba(14, 165, 233, 0.3);
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
`;

const PostCard = styled(motion.div)`
  background: rgba(11, 18, 32, 0.85);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(56, 189, 248, 0.08);
  box-shadow: 0 8px 30px rgba(2, 6, 23, 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 36px rgba(2, 6, 23, 0.6);
  }
`;


const MediaGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  align-items: center;
  justify-items: center;
  justify-content: center;
  padding: 24px;
  background-color:rgb(11, 34, 57);
  border-radius: 16px;
  min-height: 80vh;
`;

const dropFlash = keyframes`
  0% { background-color: #836fff66; }
  100% { background-color: transparent; }
`;

const fadeInScale = keyframes`
0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
`;
 const MediaItem = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
  cursor: grab;
  background-color: #fff;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  animation: ${fadeInScale} 0.3s ease forwards;

  &:hover {
    box-shadow: 0 12px 24px rgba(106, 90, 205, 0.35);
    transform: scale(1.05);
    z-index: 10;
  }

  &.dragging {
    opacity: 0.6;
    border: 3px dashed #6a5acd;
    box-shadow: none;
  }
  &.drop-animate {
    animation: ${dropFlash} 0.3s ease forwards;
  }
`;
const NumberBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  background: #6a5acd;
  color: white;
  font-weight: 700;
  font-size: 14px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;
const RemoveBtn = styled.button`
  position: absolute;
  right: 6px;
  top: 6px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  font-weight: 700;
`;
const FileIconLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  color: white;
  font-size: 22px;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  }
`;
const TotalPostsHeading = styled(motion.h2)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #e5e7eb; /* light gray text */
  background: linear-gradient(90deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #374151; /* subtle border */
  display: inline-block;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: scale(1.05);
  }
`;
export { GlobalStyle,Container,Title,Form,Input,TextArea,Row,Button,DangerButton,PostCard,MediaGrid,MediaItem,NumberBadge,RemoveBtn,FileIconLink,TotalPostsHeading };