import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { TextField, Button, Box, Typography } from "@mui/material";
import RichTextEditor from "./RichEditor";
import { FileUpload, DraggablePreview } from "./fileUpload";

export default function PostForm({ refreshPosts, posts = [] }) {
  const [form, setForm] = useState({ title: "", content: "" });
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      const post = posts.find((p) => p._id === id);
      if (post) {
        setForm({ title: post.title, content: post.content });
        setEditingId(post._id);
      }
    }
  }, [id, posts]);

  const clearPreviewURLs = (arr) => arr.forEach((i) => URL.revokeObjectURL(i.preview));

  const resetForm = () => {
    clearPreviewURLs(items);
    setItems([]);
    setForm({ title: "", content: "" });
    setEditingId(null);
  };

  const handleFilesAdd = (fileList) => {
    const mapped = Array.from(fileList).map((f) => ({
      id: Date.now() + Math.random(),
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setItems((prev) => [...prev, ...mapped]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    items.forEach((it) => fd.append("files", it.file));

    try {
      if (editingId) {
        await axios.put(`http://localhost:6000/api/posts/${editingId}`, fd);
        Swal.fire("Post updated!", "", "success");
      } else {
        await axios.post("http://localhost:6000/api/posts", fd);
        Swal.fire("Post created!", "", "success");
      }
      resetForm();
      refreshPosts();
      navigate("/");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <Box>
      <Typography variant="h4">{editingId ? "Edit Post" : "Create Post"}</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          margin="normal"
        />
        <RichTextEditor value={form.content} onEditorChange={(content) => setForm({ ...form, content })} />
        <FileUpload onFilesAdd={handleFilesAdd} />
        {items.length > 0 && <DraggablePreview items={items} setItems={setItems} />}
        <Box sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            {editingId ? "Update" : "Create"}
          </Button>
          <Button sx={{ ml: 2 }} onClick={() => navigate("/")}>Cancel</Button>
        </Box>
      </form>
    </Box>
  );
}
