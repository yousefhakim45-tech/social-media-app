// PostFormAndList.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Box, Button, TextField, Typography } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";

import { FancySpinner, ContentLoadedText } from "./circularProgress";
import FileManager, { FileUpload, DraggablePreview } from './fileUpload';
import RichTextEditor from "./RichEditor";

import {
  GlobalStyle,
  Container,
  Title,
  Form,
  Row,
  TotalPostsHeading,
  PostCard,
  MediaGrid,
  MediaItem,
  NumberBadge,
  DangerButton,
  FileIconLink,
} from "./components"; // Adjust path

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export default function PostFormAndList() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const isMounted = useRef(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchPosts();
    return () => { isMounted.current = false; };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/api/posts");
      if (isMounted.current)
        setPosts(Array.isArray(res.data) ? res.data.reverse() : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearPreviewURLs = (arr) => arr.forEach((i) => URL.revokeObjectURL(i.preview));

  const resetForm = () => {
    clearPreviewURLs(items);
    setItems([]);
    setForm({ title: "", content: "" });
    setEditingId(null);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() && !form.content.trim() && items.length === 0) {
      return Swal.fire({ title: "Add text or media", icon: "info", toast: true, position: "top-end", timer: 1600 });
    }

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    items.forEach((it) => fd.append("files", it.file));

    try {
      if (editingId) {
        await axios.put(`http://localhost:4000/api/posts/${editingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        Swal.fire({ icon: "success", title: "Post updated", toast: true, position: "top-end", timer: 1800 });
      } else {
        await axios.post("http://localhost:4000/api/posts", fd, { headers: { "Content-Type": "multipart/form-data" } });
        Swal.fire({
          icon: "success",
          title: "Post Created Successfully! ✅",
          html: `<p>Your post has been published successfully.</p>`,
          toast: true,
          position: "top-end",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: true,
          confirmButtonText: "View Post",
        });
      }
      resetForm();
      fetchPosts();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Submission Failed", text: err.message || "Unknown error" });
    }
  };

  const handleDelete = async (id, retryCount = 0) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the post permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    Swal.fire({ title: "Deleting...", didOpen: () => Swal.showLoading(), showConfirmButton: false, allowOutsideClick: false });

    try {
      await axios.delete(`http://localhost:4000/api/posts/${id}`);
      // Remove only the deleted post safely
      setPosts((prev) => prev.filter((post) => String(post._id) !== String(id)));

      Swal.close();
      Swal.fire({ icon: "success", title: "Deleted successfully!", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.close();
      if (retryCount < 2) {
        const retry = await Swal.fire({ icon: "error", title: "Delete failed", text: `Attempt ${retryCount + 1} failed. Retry?`, showCancelButton: true });
        if (retry.isConfirmed) {
          await new Promise((res) => setTimeout(res, 1000 * (retryCount + 1)));
          return handleDelete(id, retryCount + 1);
        }
      } else {
        Swal.fire({ icon: "error", title: "Delete failed after multiple attempts", text: err.message || "Unknown error" });
      }
    }
  };

  const handleEdit = async (post) => {
    setForm({ title: post.title || "", content: post.content || "" });
    setEditingId(post._id);
    clearPreviewURLs(items);
    setItems([]);

    if (post.media && Array.isArray(post.media) && post.media.length > 0) {
      try {
        const fetchedItems = await Promise.all(
          post.media.map(async (filename) => {
            const url = filename.startsWith("http") ? filename : `http://localhost:4000/uploads/${filename}`;
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: blob.type });
            return { id: uid(), file, preview: URL.createObjectURL(blob) };
          })
        );
        setItems(fetchedItems);
      } catch {
        Swal.fire({ icon: "error", title: "Failed to load media files", text: "You can still edit text and add new media.", toast: true, position: "top-end", timer: 3000 });
      }
    }

    Swal.fire({ icon: "info", title: "Edit mode", text: "Upload media to replace existing ones (optional)", toast: true, position: "top-end", timer: 1800 });
  };

  function openFullscreen(element) {
    if (element.requestFullscreen) element.requestFullscreen();
    else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    else if (element.msRequestFullscreen) element.msRequestFullscreen();
  }

  const handleFilesAdd = (fileList) => {
    const mapped = Array.from(fileList).filter(Boolean).map((f) => {
      if (!f?.type && !f?.size) return { id: uid(), type: "folder", name: f?.name || "Unnamed Folder" };
      return { id: uid(), type: "file", file: f, preview: URL.createObjectURL(f) };
    });
    setItems((prev) => [...prev, ...mapped]);
  };

  const handleEmojiClick = () => setShowEmojiPicker(false);

  return (
    <>
      <GlobalStyle />
      {loading ? <FancySpinner /> : <ContentLoadedText />}
      <Container>
        <Title variant="h4" component="h1" gutterBottom>social media application</Title>

        <Form onSubmit={handleSubmit}>
          <TextField fullWidth label="Post Title" placeholder="Post Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} margin="normal" variant="outlined" />
          <RichTextEditor value={form.content} onEditorChange={(content) => setForm({ ...form, content })} />

          <FileManager />

          <Row>
            {items.length > 0 && <Button onClick={() => { clearPreviewURLs(items); setItems([]); }}>✖ Clear Media</Button>}
            {editingId && <Button onClick={resetForm}>Cancel Edit</Button>}
            <Box sx={{ marginLeft: "auto" }}>
              <Button type="submit">{editingId ? "Update Post" : "Add Post"}</Button>
            </Box>
          </Row>

          <TotalPostsHeading initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            Total Posts: {posts.length}
          </TotalPostsHeading>
        </Form>

        <AnimatePresence>
          {posts.map((post, index) => (
            <PostCard key={post.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} sx={{ mb: 2, p: 2, position: "relative" }}>
              <Typography variant="h6" component="h3" sx={{ marginBottom: 1 }}>{index + 1}. {post.title}</Typography>
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
{/* Post date & relative time */}
{post.post_date && (() => {
  const dateObj = new Date(post.post_date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  let relativeTime = "";
  if (diffSec < 60) relativeTime = "Just now";
  else if (diffMin < 60) relativeTime = `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
  else if (diffHour < 24) relativeTime = `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
  else if (diffDay === 1) relativeTime = "Yesterday";
  else relativeTime = dateObj.toLocaleDateString();

  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., 14:35

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 1, mb: 1, flexWrap: "wrap" }}>
      <Box sx={{
        backgroundColor: "#e0f7fa",
        color: "#006064",
        borderRadius: "4px",
        px: 1.5,
        py: 0.5,
        fontSize: "0.85rem",
        fontWeight: 500,
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
      }}>
        📅 {relativeTime}
      </Box>
      <Box sx={{
        backgroundColor: "#fff3e0",
        color: "#e65100",
        borderRadius: "4px",
        px: 1.5,
        py: 0.5,
        fontSize: "0.85rem",
        fontWeight: 500,
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
      }}>
        ⏰ {timeStr}
      </Box>
    </Box>
  );
})()}

              {post.media?.length > 0 && (
  <>
    {(() => {
      // Count media types
      let videoCount = 0,
          imageCount = 0,
          audioCount = 0,
          fileCount = 0;

      post.media.forEach((m) => {
        const ext = m.split('.').pop().toLowerCase();
        if (["mp4","webm","mov"].includes(ext)) videoCount++;
        else if (["jpg","jpeg","png","gif","bmp","webp"].includes(ext)) imageCount++;
        else if (["mp3","wav","ogg"].includes(ext)) audioCount++;
        else fileCount++;
      });

      return (
        <>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 1 }}>
            Total Media: {post.media.length}
            {videoCount > 0 && ` | Videos: ${videoCount}`}
            {imageCount > 0 && ` | Images: ${imageCount}`}
            {audioCount > 0 && ` | Audios: ${audioCount}`}
            {fileCount > 0 && ` | Files: ${fileCount}`}
          </Typography>

          <MediaGrid sx={{ mt: 1 }}>
            {post.media.map((m, i) => {
              const url = m.startsWith("http") ? m : `http://localhost:4000/uploads/${m}`;
              const lower = m.toLowerCase();
              let mediaContent = null;

              if (/\.(mp4|webm|mov)$/i.test(lower))
                mediaContent = <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls onDoubleClick={(e) => openFullscreen(e.currentTarget)} />;
              else if (/\.(mp3|wav|ogg)$/i.test(lower))
                mediaContent = <audio src={url} controls style={{ width: "100%" }} />;
              else if (/\.(txt|docx|xlsx|pptx|csv)$/i.test(lower))
                mediaContent = <FileIconLink href={url} download>📄 {m}</FileIconLink>;
              else
                mediaContent = <img src={url} alt={`media-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} onDoubleClick={(e) => openFullscreen(e.currentTarget)} />;

              return (
                <MediaItem key={i} style={{ position: "relative" }}>
                  <NumberBadge>{i + 1}</NumberBadge>
                  {mediaContent}
                </MediaItem>
              );
            })}
          </MediaGrid>
        </>
      );
    })()}
  </>
)}


              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                <Button onClick={() => handleEdit(post)}>✏️ Edit</Button>
                <DangerButton onClick={() => handleDelete(post.id)}>🗑 Delete</DangerButton>
                <Button onClick={() => setShowEmojiPicker((prev) => !prev)}>😀 Emoji</Button>
                {showEmojiPicker && <Box sx={{ position: "absolute", top: 40, right: 0, zIndex: 999 }}><EmojiPicker onEmojiClick={handleEmojiClick} /></Box>}
              </Box>
            </PostCard>
          ))}
        </AnimatePresence>
      </Container>
    </>
  );
}
