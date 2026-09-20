import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ColorPicker, { PRESET_COLORS } from '../../components/ColorPicker';
import { factsApi } from '../../api/facts';
import type { Tag } from '../../../../shared/types/facts';

const TagsTab = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null);

  // タグ追加ダイアログ
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0] ?? '#1976d2');

  // タグ名インライン編集
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

  const fetchTags = async () => {
    try {
      const data = await factsApi.getTags();
      setTags(data);
    } catch {
      // 失敗時はコンソール
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // タグ作成
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await factsApi.createTag({
        name: newTagName.trim(),
        color: newTagColor,
        sortOrder: tags.length,
      });
      setNewTagName('');
      setOpenAddDialog(false);
      await fetchTags();
    } catch {
      // エラー処理
    }
  };

  // タグ名インライン編集の保存
  const handleSaveInlineName = async (id: number) => {
    const trimmed = editingTagName.trim();
    setEditingTagId(null);
    if (!trimmed) return;

    const currentTag = tags.find((t) => t.id === id);
    if (currentTag && currentTag.name === trimmed) return;

    // 楽観的更新
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, name: trimmed } : t)));
    try {
      await factsApi.updateTag(id, { name: trimmed });
    } catch {
      await fetchTags();
    }
  };

  // タグ色変更
  const handleUpdateColor = async (id: number, color: string) => {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
    try {
      await factsApi.updateTag(id, { color });
    } catch {
      await fetchTags();
    }
  };

  // タグ削除
  const handleDeleteTag = async (id: number) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    try {
      await factsApi.deleteTag(id);
    } catch {
      await fetchTags();
    }
  };

  // ドラッグ＆ドロップ並び替え
  const handleDragStart = (index: number) => {
    setDraggedTagIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedTagIndex === null || draggedTagIndex === targetIndex) return;
    const item = tags[draggedTagIndex];
    if (!item) return;

    // 楽観的更新
    const newTags = [...tags];
    const [removed] = newTags.splice(draggedTagIndex, 1);
    if (removed) {
      newTags.splice(targetIndex, 0, removed);
      setTags(newTags);
    }
    setDraggedTagIndex(null);

    try {
      await factsApi.updateTag(item.id, { sortOrder: targetIndex });
      await fetchTags();
    } catch {
      await fetchTags();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setNewTagName('');
            setNewTagColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] ?? '#1976d2');
            setOpenAddDialog(true);
          }}
        >
          タグを追加
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#ffffff' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ width: 40, py: 0.5 }}></TableCell>
              <TableCell sx={{ width: 50, py: 0.5, fontWeight: 'bold' }}>色</TableCell>
              <TableCell sx={{ py: 0.5, fontWeight: 'bold' }}>タグ名</TableCell>
              <TableCell align="right" sx={{ width: 60, py: 0.5 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tags.map((tag, index) => (
              <TableRow
                key={tag.id}
                hover
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                sx={{
                  bgcolor: '#ffffff',
                  transition: 'background-color 0.2s',
                  '& > *': { py: 0.5 },
                }}
              >
                {/* ドラッグハンドル */}
                <TableCell sx={{ width: 40, py: 0.5 }}>
                  <Tooltip title="ドラッグして順序を変更" arrow>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'grab',
                        color: 'action.active',
                        '&:active': { cursor: 'grabbing' },
                      }}
                    >
                      <DragIndicatorIcon fontSize="small" />
                    </Box>
                  </Tooltip>
                </TableCell>

                {/* カラーピッカー */}
                <TableCell sx={{ width: 50, py: 0.5 }}>
                  <ColorPicker color={tag.color} onChange={(c) => handleUpdateColor(tag.id, c)} size={22} />
                </TableCell>

                {/* タグ名（インライン編集） */}
                <TableCell sx={{ py: 0.5 }}>
                  {editingTagId === tag.id ? (
                    <TextField
                      size="small"
                      variant="standard"
                      autoFocus
                      value={editingTagName}
                      onChange={(e) => setEditingTagName(e.target.value)}
                      onBlur={() => handleSaveInlineName(tag.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveInlineName(tag.id);
                        if (e.key === 'Escape') setEditingTagId(null);
                      }}
                      sx={{ width: '100%', maxWidth: 300 }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      onClick={() => {
                        setEditingTagId(tag.id);
                        setEditingTagName(tag.name);
                      }}
                      sx={{
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'inline-block',
                        py: 0.25,
                        px: 0.5,
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {tag.name}
                    </Typography>
                  )}
                </TableCell>

                {/* 削除ボタン */}
                <TableCell align="right" sx={{ width: 60, py: 0.5 }}>
                  <IconButton
                    size="small"
                    color="error"
                    title="タグを削除"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {tags.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                  タグがまだ登録されていません。「タグを追加」から登録してください。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* タグ追加ダイアログ */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新しいタグを追加</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            label="タグ名"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            fullWidth
            size="small"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              カラー:
            </Typography>
            <ColorPicker color={newTagColor} onChange={setNewTagColor} size={26} />
            <Chip
              label={newTagName.trim() || 'プレビュー'}
              size="small"
              sx={{
                bgcolor: newTagColor,
                color: '#ffffff',
                fontWeight: 'bold',
                ml: 1,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>キャンセル</Button>
          <Button onClick={handleCreateTag} variant="contained" disabled={!newTagName.trim()}>
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TagsTab;
