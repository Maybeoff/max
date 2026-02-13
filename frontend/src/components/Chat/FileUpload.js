import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
function FileUpload({ open, onClose, onFileUploaded }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <ImageIcon />;
    if (file.type.startsWith('video/')) return <VideoFileIcon />;
    if (file.type.startsWith('audio/')) return <AudioFileIcon />;
    return <InsertDriveFileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const token = localStorage.getItem('token');
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки файла');
        }
        
        const data = await response.json();
        
        // Определяем тип файла
        let fileType = 'document';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type.startsWith('audio/')) fileType = 'audio';
        
        onFileUploaded({
          url: data.url,
          filename: data.filename,
          size: data.size,
          type: fileType,
        });
        
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      setSelectedFiles([]);
      onClose();
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert(error.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Загрузить файлы</Typography>
          <IconButton onClick={onClose} disabled={uploading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              disabled={uploading}
            >
              Выбрать файлы
            </Button>
          </label>
        </Box>

        {selectedFiles.length > 0 && (
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>{getFileIcon(file)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
              </ListItem>
            ))}
          </List>
        )}

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Загрузка... {progress}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Отмена
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
        >
          Загрузить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FileUpload;
