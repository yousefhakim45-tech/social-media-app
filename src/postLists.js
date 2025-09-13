import React from "react";
import { Link } from "react-router-dom";
import { Button, Box, Typography } from "@mui/material";

export default function PostList({ posts, onDelete }) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">Posts</Typography>
        <Button variant="contained" component={Link} to="/create">
          Create Post
        </Button>
      </Box>
      {posts.map((post, i) => (
        <Box key={post._id} sx={{ mb: 2, p: 2, border: "1px solid #ccc", borderRadius: "8px" }}>
          <Typography variant="h6">{i + 1}. {post.title}</Typography>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
          <Box sx={{ mt: 1 }}>
            <Button component={Link} to={`/edit/${post.id}`} sx={{ mr: 1 }}>Edit</Button>
            <Button color="error" onClick={() => onDelete(post._id)}>Delete</Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
