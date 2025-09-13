import React, { useState, useRef, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { Button, IconButton, TextField, Menu, MenuItem } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  InsertDriveFile, PictureAsPdf, Image, Movie, Audiotrack, Description,
  Delete, Undo, FilterList, Sort, TextSnippet, TableChart, Slideshow, CheckBox, CheckBoxOutlineBlank
} from "@mui/icons-material";

// --- ID generator ---
const createId = (() => { let id = 0; return () => ++id; })();

// --- Supported file icons ---
const fileIcons = {
  pdf: <PictureAsPdf fontSize="large" color="error" />,
  image: <Image fontSize="large" color="primary" />,
  video: <Movie fontSize="large" color="secondary" />,
  audio: <Audiotrack fontSize="large" color="success" />,
  doc: <Description fontSize="large" color="info" />,
  txt: <TextSnippet fontSize="large" color="disabled" />,
  pptx: <Slideshow fontSize="large" color="warning" />,
  xlsx: <TableChart fontSize="large" color="success" />,
  default: <InsertDriveFile fontSize="large" />,
};

// --- Helpers ---
const getType = (file) => {
  const { name, type } = file;
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf") return "pdf";
  if (type.includes("word") || type.includes("officedocument.wordprocessingml")) return "doc";
  if (name.endsWith(".txt")) return "txt";
  if (name.endsWith(".pptx")) return "pptx";
  if (name.endsWith(".xlsx")) return "xlsx";
  return "default";
};

const createItem = (file, preview) => ({
  id: createId(),
  file,
  preview,
  name: file.name,
  size: file.size,
  duration: null,
  status: "loaded",
  type: getType(file),
  addedAt: new Date(),
});

// --- File Upload ---
export function FileUpload({ onFilesAdd }) {
  const fileRef = useRef(null);

  const getMediaDuration = useCallback((file, preview) => new Promise(resolve => {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return resolve(null);
    const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    media.preload = "metadata";
    media.src = preview;
    media.onloadedmetadata = () => resolve(media.duration);
    media.onerror = () => resolve(null);
  }), []);

  const handleChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    const processed = [];
    for (const f of selected) {
      if (!(f instanceof File)) continue;
      if (f.size > 500 * 1024 * 1024) {
        Swal.fire({ icon: "error", title: "File too large", text: `${f.name} exceeds 500MB` });
        continue;
      }
      let preview = null;
      try { preview = URL.createObjectURL(f); } catch {}
      let duration = null;
      if (f.type.startsWith("video/") || f.type.startsWith("audio/")) duration = await getMediaDuration(f, preview);
      processed.push({ ...createItem(f, preview), duration });
    }
    if (!processed.length) return;
    onFilesAdd(processed);
    e.target.value = "";
  };

  return <>
    <input ref={fileRef} type="file" style={{ display: "none" }} multiple onChange={handleChange} />
    <Button 
      variant="contained" 
      color="primary" 
      onClick={() => fileRef.current?.click()}
      style={{fontWeight:600, background:"linear-gradient(90deg,#6a5acd,#836fff)", color:"#fff"}}
    >
      📂 Upload Files
    </Button>
  </>;
}

// --- Draggable Preview ---
export function DraggablePreview({ items, setItems, lastRemovedRef, multiSelect, setMultiSelect }) {
  const dragSrcIndex = useRef(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingName, setEditingName] = useState("");

  const revokePreview = useCallback(item => { if (item.preview) try { URL.revokeObjectURL(item.preview); } catch {} }, []);

  const handleEditSubmit = async () => {
    const newName = editingName.trim();
    if (!newName) { Swal.fire({ icon: "error", title: "Invalid name" }); return; }
    if (items.some((it, i) => i !== editingIndex && it.name === newName)) { Swal.fire({ icon: "error", title: "Duplicate name" }); return; }
    setItems(prev => { const next = [...prev]; next[editingIndex].name = newName; return next; });
    setEditingIndex(null);
  };

  const handleRemove = async (id, index) => {
    const removedItem = items.find(it => it.id === id);
    const result = await Swal.fire({ title: "Confirm Remove", icon: "warning", showCancelButton: true, confirmButtonText: "Yes", cancelButtonText: "Cancel" });
    if (!result.isConfirmed) return;
    revokePreview(removedItem);
    setItems(prev => prev.filter(it => it.id !== id));
    setMultiSelect(prev => prev.filter(i => i !== index));
    lastRemovedRef.current.push(removedItem);
  };

  const onDragStart = (e, index) => {
    dragSrcIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    const src = dragSrcIndex.current;
    if (src == null || src === index) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      next.splice(index, 0, moved);
      return next;
    });
    dragSrcIndex.current = null;
  };

  const formatDuration = s => s ? `${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}` : null;
  const formatSize = s => s < 1024 ? s + " B" : s < 1024*1024 ? (s/1024).toFixed(1)+" KB" : (s/1024/1024).toFixed(1)+" MB";

  useEffect(() => () => { items.forEach(revokePreview); }, [items, revokePreview]);

  const toggleSelect = (idx) => {
    setMultiSelect(prev => prev.includes(idx) ? prev.filter(i=>i!==idx) : [...prev, idx]);
  };

  const renderPreview = (file, preview, type) => {
    if (!file) return <div style={{padding:20}}>No file</div>;
    switch(type){
      case "video": return <video src={preview} controls style={{width:"100%",borderRadius:8}}/>;
      case "audio": return <audio src={preview} controls style={{width:"100%"}}/>;
      case "image": return <img src={preview} alt={file.name} style={{width:"100%",borderRadius:8,objectFit:"cover"}} loading="lazy"/>;
      case "pdf":
      case "txt":
      case "pptx":
      case "xlsx":
        return <iframe src={preview} title={file.name} style={{width:"100%",height:180,borderRadius:8,border:"1px solid #ccc"}}/>;
      default: return fileIcons.default;
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{ display:"grid", gap:18, gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))" }}
        onDragOver={e => e.preventDefault()}
      >
        {items.map((it, idx) => {
          const isSelected = multiSelect.includes(idx);
          const isEditing = idx === editingIndex;
          return (
            <motion.div
              key={it.id}
              layout 
              initial={{opacity:0,scale:0.85}} 
              animate={{opacity:1,scale:1}} 
              exit={{opacity:0,scale:0.85}}
              draggable={!isEditing}
              onDragStart={(e)=>onDragStart(e,idx)}
              onDrop={(e)=>onDrop(e,idx)}
              style={{
                border: isSelected ? "2px solid #6a5acd":"1px solid #ccc",
                padding:14, 
                borderRadius:16, 
                background:isSelected?"#f0f0ff":"#fff",
                cursor:isEditing ? "text":"grab", 
                boxShadow:isSelected?"0 10px 25px rgba(106,90,205,0.35)":"0 2px 10px rgba(0,0,0,0.1)",
                position:"relative", 
                overflow:"hidden",
                transition:"all 0.3s ease",
              }}
              onClick={() => toggleSelect(idx)}
            >
              {/* Checkbox */}
              <div style={{
                position:"absolute",
                top:8,left:8,
                background:"#6a5acd",color:"#fff",
                borderRadius:"50%",
                width:28,height:28,
                display:"flex",
                justifyContent:"center",
                alignItems:"center",
                fontWeight:"bold",fontSize:14
              }}>
                {isSelected ? <CheckBox fontSize="small"/> : <CheckBoxOutlineBlank fontSize="small"/>}
              </div>

              {/* Delete */}
              <IconButton size="small" style={{position:"absolute",top:4,right:4}} onClick={()=>handleRemove(it.id,idx)}>
                <Delete color="error"/>
              </IconButton>

              {/* Preview */}
              <div style={{marginBottom:10}}>{renderPreview(it.file,it.preview,it.type)}</div>

              {/* File Name */}
              {isEditing 
                ? <input type="text" value={editingName} onChange={(e)=>setEditingName(e.target.value)}
                    onBlur={handleEditSubmit} onKeyDown={async e=>{if(e.key==="Enter") await handleEditSubmit(); else if(e.key==="Escape") setEditingIndex(null);}}
                    autoFocus 
                    style={{
                      marginBottom:6,width:"100%",fontSize:15,fontWeight:600,padding:"6px 8px",
                      borderRadius:8,border:"1px solid #6a5acd",outline:"none",background:"#f9f9ff"
                    }} />
                : <div style={{
                    fontSize:15,fontWeight:600,marginBottom:4,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                    color:isSelected ? "#3f3fff":"#333"
                  }}>{it.name}</div>
              }

              {/* Size and Duration */}
              <div style={{display:"flex", justifyContent:"space-between", fontSize:13, color:"#666"}}>
                <span>{formatSize(it.size)}</span>
                {it.duration && <span>{formatDuration(it.duration)}</span>}
              </div>

            </motion.div>
          )
        })}
      </div>
    </AnimatePresence>
  );
}

// --- Main File Manager ---
export default function FileManager() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [multiSelect, setMultiSelect] = useState([]);
  const lastRemovedRef = useRef([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);

  const filterOptions = ["all","image","video","audio","pdf","doc","txt","pptx","xlsx"];
  const sortOptions = ["name-asc","name-desc","size-asc","size-desc","date-asc","date-desc"];

  const handleFilesAdd = newItems => {
    const existingNames = new Set(items.map(it => it.name));
    setItems(prev => [...prev, ...newItems.filter(it=>!existingNames.has(it.name))]);
  };

  const handleUndo = () => { 
    if(!lastRemovedRef.current.length) return; 
    setItems(prev=>[...prev,...lastRemovedRef.current]); 
    lastRemovedRef.current=[]; 
  };

  const handleBatchDelete = async () => {
    if (!multiSelect.length) return;
    const result = await Swal.fire({ title: `Delete ${multiSelect.length} files?`, icon: "warning", showCancelButton: true });
    if (!result.isConfirmed) return;
    const removed = multiSelect.map(i => items[i]);
    removed.forEach(it => { if(it.preview) URL.revokeObjectURL(it.preview); });
    setItems(prev => prev.filter((_, idx) => !multiSelect.includes(idx)));
    lastRemovedRef.current = removed;
    setMultiSelect([]);
  };

  let filteredItems = items.filter(it => (filter==="all"||it.type===filter) && it.name.toLowerCase().includes(search.toLowerCase()));
  filteredItems = filteredItems.sort((a,b)=>{
    switch(sort){
      case "name-asc": return a.name.localeCompare(b.name);
      case "name-desc": return b.name.localeCompare(a.name);
      case "size-asc": return a.size-b.size;
      case "size-desc": return b.size-a.size;
      case "date-asc": return a.addedAt-b.addedAt;
      case "date-desc": return b.addedAt-a.addedAt;
      default: return 0;
    }
  });

  const countByType = filteredItems.reduce((acc,it)=>{
    acc[it.type] = (acc[it.type]||0)+1;
    return acc;
  },{});

  return (
    <div style={{
      maxWidth:1200,margin:"20px auto",padding:24,
      borderRadius:16,fontFamily:"Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
      background:"#fdfdfd",
      boxShadow:"0 8px 40px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{marginBottom:16,color:"#6a5acd"}}>🎛 Advanced File Manager</h2>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20, alignItems:"center"}}>
        <FileUpload onFilesAdd={handleFilesAdd} />
        <Button variant="outlined" startIcon={<FilterList/>} onClick={e=>setFilterAnchor(e.currentTarget)}>Filter</Button>
        <Menu anchorEl={filterAnchor} open={Boolean(filterAnchor)} onClose={()=>setFilterAnchor(null)}>
          {filterOptions.map(f=>(<MenuItem key={f} selected={filter===f} onClick={()=>{setFilter(f); setFilterAnchor(null);}}>{f}</MenuItem>))}
        </Menu>
        <Button variant="outlined" startIcon={<Sort/>} onClick={e=>setSortAnchor(e.currentTarget)}>Sort</Button>
        <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={()=>setSortAnchor(null)}>
          {sortOptions.map(s=>(<MenuItem key={s} selected={sort===s} onClick={()=>{setSort(s); setSortAnchor(null);}}>{s}</MenuItem>))}
        </Menu>
        <TextField size="small" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} />
        <IconButton color="primary" onClick={handleUndo}><Undo/></IconButton>
        {multiSelect.length > 0 && <Button color="error" variant="contained" onClick={handleBatchDelete}>Delete Selected ({multiSelect.length})</Button>}
      </div>
      <div style={{marginBottom:12,color:"#555",fontWeight:500}}>
        Total files: {filteredItems.length} ({Object.entries(countByType).map(([k,v])=>`${v} ${k}${v>1?"s":""}`).join(", ")}) • Total size: {formatTotalSize(filteredItems)}
      </div>
      <DraggablePreview items={filteredItems} setItems={setItems} lastRemovedRef={lastRemovedRef} multiSelect={multiSelect} setMultiSelect={setMultiSelect}/>
    </div>
  );
}

// --- Total size formatter ---
function formatTotalSize(items){
  const total = items.reduce((acc,it)=>acc+it.size,0);
  if(total<1024) return total+" B";
  if(total<1024*1024) return (total/1024).toFixed(1)+" KB";
  return (total/1024/1024).toFixed(2)+" MB";
}
