import React, { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { AnimatePresence, motion } from "framer-motion";

export default function RichTextEditor({ value, onEditorChange }) {
  // Demo state: show helper text only if editor is empty
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    setShowHelper(value.trim() === "");
  }, [value]);

  return (
    <div style={{ position: "relative" }}>
      <Editor
        apiKey="lv7bxnk3pgup2fk7m7dleumub4j5mmhx1c8b67u6gbwd9xjl"
        value={value}
        onEditorChange={(content) => {
          onEditorChange(content);
        }}
        init={{
          height: 600,
          menubar: "file edit view insert format tools table help",
          plugins: [
            "advlist autolink lists link image charmap preview anchor",
            "searchreplace visualblocks visualchars code fullscreen",
            "insertdatetime media table paste code help wordcount",
            "emoticons autosave directionality hr pagebreak nonbreaking",
            "charmap toc imagetools textpattern textcolor",
            "quickbars template",
          ],
          toolbar:
            "undo redo | formatselect fontsizeselect | " +
            "bold italic underline strikethrough forecolor backcolor removeformat | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | link image media table emoticons | " +
            "hr pagebreak charmap | template | code fullscreen preview help",
          toolbar_sticky: true,
          font_size_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt",
          quickbars_insert_toolbar: "image media table | hr charmap",
          quickbars_selection_toolbar:
            "bold italic underline forecolor backcolor | quicklink h2 h3 blockquote",
          image_title: true,
          automatic_uploads: true,
          setup: (editor) => {
            editor.on("keydown", () => {
              if (!showHelper) setShowHelper(false);
            });
          },
        }}
      />

      {/* AnimatePresence for helper text */}
      <AnimatePresence>
        {showHelper && (
       <motion.div
       key="helper-text"
       initial={{ opacity: 0, y: 20, scale: 0.8 }}
       animate={{ opacity: 1, y: 0, scale: 1, color: "#00aaff" }}
       exit={{ opacity: 0, y: 20, scale: 0.8 }}
       transition={{ duration: 0.5, ease: "easeInOut" }}
       style={{
         position: "absolute",
         bottom: "-36px",      // Adjust vertical distance as needed
         left: "50%",
         transform: "translateX(-50%)",
         padding: "6px 14px",
         background:
           "linear-gradient(135deg, rgba(0,255,234,0.2), rgba(0,170,255,0.2))",
         borderRadius: "12px",
         fontSize: "0.9rem",
         fontWeight: "600",
         color: "#00aaff",
         userSelect: "none",
         boxShadow:
           "0 0 8px rgba(0,170,255,0.5), 0 0 12px rgba(0,255,234,0.4)",
         backdropFilter: "blur(6px)",
         textShadow:
           "0 0 6px rgba(0,255,234,0.6), 0 0 12px rgba(0,170,255,0.8)",
         pointerEvents: "none",
         whiteSpace: "nowrap",
         letterSpacing: "0.04em",
       }}
     >
       Start typing content here...
     </motion.div>
     
      
        )}
      </AnimatePresence>
    </div>
  );
}
