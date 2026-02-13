import React from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

function MessageList({ messages, currentUserId }) {
  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm', { locale: ru });
  };

  const formatDate = (date) => {
    return format(new Date(date), 'd MMMM yyyy г.', { locale: ru });
  };

  const groupMessagesByDate = () => {
    const groups = {};
    messages.forEach(msg => {
      const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#E8F0F8',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}
    >
      {Object.entries(messageGroups).map(([date, msgs]) => (
        <Box key={date}>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                color: 'text.secondary',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {formatDate(msgs[0].createdAt)}
            </Typography>
          </Box>

          {msgs.map((message) => {
            // Приводим к строке для корректного сравнения
            const isOwn = String(message.senderId) === String(currentUserId) || 
                          String(message.sender?.id) === String(currentUserId);
            
            return (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1.5,
                  alignItems: 'flex-end',
                }}
              >
                {!isOwn && (
                  <Avatar
                    src={message.sender?.avatar}
                    sx={{ width: 32, height: 32, mr: 1, mb: 0.5 }}
                  >
                    {message.sender?.username?.[0]?.toUpperCase()}
                  </Avatar>
                )}
                
                <Paper
                  elevation={isOwn ? 2 : 1}
                  sx={{
                    maxWidth: '70%',
                    p: 1.5,
                    bgcolor: isOwn ? '#DCF8C6' : '#FFFFFF',
                    borderRadius: isOwn ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    position: 'relative',
                  }}
                >
                  {!isOwn && (
                    <Typography
                      variant="caption"
                      sx={{ 
                        color: '#0077FF', 
                        fontWeight: 600, 
                        display: 'block', 
                        mb: 0.5 
                      }}
                    >
                      {message.sender?.username}
                    </Typography>
                  )}
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      wordBreak: 'break-word',
                      color: '#000',
                      fontSize: '0.95rem',
                    }}
                  >
                    {message.type === 'image' && message.fileUrl ? (
                      <Box>
                        <img 
                          src={message.fileUrl} 
                          alt={message.fileName}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px',
                            borderRadius: '8px',
                            display: 'block',
                            marginBottom: '4px'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {message.fileName}
                        </Typography>
                      </Box>
                    ) : message.type === 'video' && message.fileUrl ? (
                      <Box>
                        <video 
                          controls 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '300px',
                            borderRadius: '8px'
                          }}
                        >
                          <source src={message.fileUrl} />
                        </video>
                        <Typography variant="caption" color="text.secondary">
                          {message.fileName}
                        </Typography>
                      </Box>
                    ) : message.type === 'audio' && message.fileUrl ? (
                      <Box>
                        <audio controls style={{ width: '100%' }}>
                          <source src={message.fileUrl} />
                        </audio>
                        <Typography variant="caption" color="text.secondary">
                          {message.fileName}
                        </Typography>
                      </Box>
                    ) : message.type === 'document' && message.fileUrl ? (
                      <Box 
                        component="a" 
                        href={message.fileUrl} 
                        download={message.fileName}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { opacity: 0.8 }
                        }}
                      >
                        <InsertDriveFileIcon sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2">{message.fileName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {message.fileSize ? `${Math.round(message.fileSize / 1024)} KB` : ''}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      message.content
                    )}
                  </Typography>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      mt: 0.5,
                      gap: 0.5,
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isOwn ? '#5a5a5a' : 'text.secondary',
                        fontSize: '0.7rem',
                      }}
                    >
                      {formatTime(message.createdAt)}
                    </Typography>
                    {isOwn && (
                      <DoneAllIcon
                        sx={{
                          fontSize: 16,
                          color: message.reads?.length > 0 ? '#0077FF' : '#999',
                        }}
                      />
                    )}
                  </Box>
                </Paper>
                
                {isOwn && (
                  <Avatar
                    src={message.sender?.avatar}
                    sx={{ width: 32, height: 32, ml: 1, mb: 0.5 }}
                  >
                    {message.sender?.username?.[0]?.toUpperCase()}
                  </Avatar>
                )}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

export default MessageList;
