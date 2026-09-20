import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import TodayIcon from '@mui/icons-material/Today';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

import { dontsApi } from '../../api/donts';
import type { DontEntryItem } from '../../../../shared/types/donts';

export const DontsPage: React.FC = () => {
  // 週選択ステート（月曜始まり）
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<DontEntryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 新規エントリー入力ステート
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);

  // インライン編集ステート
  const [editingCell, setEditingCell] = useState<{ id: number; field: 'content' | 'review' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 週の開始（月曜）と終了（日曜）
  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');

  // 一覧取得
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dontsApi.getEntries(weekStartStr);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch dont entries:', err);
    } finally {
      setLoading(false);
    }
  }, [weekStartStr]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // 週移動ハンドラ
  const handlePrevWeek = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  const handleThisWeek = () => {
    setCurrentDate(new Date());
  };

  // 新規エントリー作成
  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    try {
      await dontsApi.createEntry({ content: trimmed });
      setNewContent('');
      await fetchEntries();
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setCreating(false);
    }
  };

  // 削除
  const handleDelete = async (id: number) => {
    try {
      await dontsApi.deleteEntry(id);
      await fetchEntries();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // インライン編集開始
  const handleStartEdit = (id: number, field: 'content' | 'review', initialValue: string | null) => {
    setEditingCell({ id, field });
    setEditValue(initialValue ?? '');
  };

  // インライン編集の保存
  const handleSaveEdit = async () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const currentEntry = entries.find((e) => e.id === id);
    if (!currentEntry) {
      setEditingCell(null);
      return;
    }

    const trimmed = editValue.trim();

    if (field === 'content') {
      if (trimmed && trimmed !== currentEntry.content) {
        // オプティミスティック更新
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, content: trimmed } : e))
        );
        try {
          await dontsApi.updateEntry(id, { content: trimmed });
        } catch (err) {
          console.error('Failed to update content:', err);
          await fetchEntries();
        }
      }
    } else if (field === 'review') {
      if (trimmed !== (currentEntry.review ?? '')) {
        // オプティミスティック更新
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, review: trimmed || null } : e))
        );
        try {
          await dontsApi.upsertReview(id, weekStartStr, { review: trimmed });
        } catch (err) {
          console.error('Failed to update review:', err);
          await fetchEntries();
        }
      }
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // 編集開始時にinputへフォーカス
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // 週ラベル生成
  const getWeekLabel = () => {
    const isSameYear = weekStartDate.getFullYear() === weekEndDate.getFullYear();
    const startPart = format(weekStartDate, 'yyyy年M月d日');
    const endPart = isSameYear ? format(weekEndDate, 'M月d日') : format(weekEndDate, 'yyyy年M月d日');
    return `${startPart} 〜 ${endPart}`;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      {/* 上部ヘッダー部: タイトル + 週セレクタ（1行に集約して縦幅を削減） */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          やらないこと
        </Typography>

        {/* 週セレクタ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={handlePrevWeek} title="前の週">
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              minWidth: 180,
              textAlign: 'center',
              userSelect: 'none',
              px: 1,
            }}
          >
            {getWeekLabel()}
          </Typography>
          <IconButton size="small" onClick={handleNextWeek} title="次の週">
            <ChevronRightIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            variant="outlined"
            startIcon={<TodayIcon fontSize="small" />}
            onClick={handleThisWeek}
            sx={{ ml: 1, py: 0.25, px: 1, fontSize: '0.75rem', minWidth: 'auto' }}
          >
            今週
          </Button>
        </Box>
      </Box>

      {/* 新規エントリーインライン追加バー（縦幅を最小限に） */}
      <Box component="form" onSubmit={handleCreate} sx={{ mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="+ 新しい「やらないこと」を入力してEnterで追加..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          disabled={creating}
          sx={{
            bgcolor: 'background.paper',
            '& .MuiInputBase-input': { py: 0.75, px: 1.5, fontSize: '0.875rem' },
          }}
          slotProps={{
            input: {
              endAdornment: newContent.trim() ? (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    variant="contained"
                    type="submit"
                    disabled={creating}
                    sx={{ py: 0.25, px: 1.5, fontSize: '0.75rem' }}
                  >
                    追加
                  </Button>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
      </Box>

      {/* エントリー一覧テーブル（高密度・コンパクト） */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 1,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}
      >
        <Table size="small" stickyHeader aria-label="やらないこと一覧">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 'bold', py: 0.75, fontSize: '0.8rem' } }}>
              <TableCell sx={{ width: '45%' }}>内容</TableCell>
              <TableCell sx={{ width: '50%' }}>振り返り（{format(weekStartDate, 'M/d')}週）</TableCell>
              {/* 操作ヘッダーはテキスト不要との要望に応じ、空セル */}
              <TableCell sx={{ width: '5%', minWidth: 44, p: 0 }} align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.875rem' }}>
                  登録されたエントリーがありません。上の入力欄から追加してください。
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const isEditingContent = editingCell?.id === entry.id && editingCell?.field === 'content';
                const isEditingReview = editingCell?.id === entry.id && editingCell?.field === 'review';

                return (
                  <TableRow
                    key={entry.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '& td': { py: 0.5, px: 1.5, fontSize: '0.85rem' },
                    }}
                  >
                    {/* 内容セル（インライン編集可能・編集ボタンなし） */}
                    <TableCell
                      onClick={() => !isEditingContent && handleStartEdit(entry.id, 'content', entry.content)}
                      sx={{
                        cursor: isEditingContent ? 'default' : 'pointer',
                        '&:hover': isEditingContent
                          ? {}
                          : { bgcolor: 'action.hover' },
                      }}
                    >
                      {isEditingContent ? (
                        <TextField
                          inputRef={inputRef}
                          size="small"
                          fullWidth
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          variant="standard"
                          sx={{ '& .MuiInputBase-input': { py: 0, fontSize: '0.85rem' } }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
                          {entry.content}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 振り返りセル（インライン編集可能・編集ボタンなし） */}
                    <TableCell
                      onClick={() => !isEditingReview && handleStartEdit(entry.id, 'review', entry.review)}
                      sx={{
                        cursor: isEditingReview ? 'default' : 'pointer',
                        '&:hover': isEditingReview
                          ? {}
                          : { bgcolor: 'action.hover' },
                      }}
                    >
                      {isEditingReview ? (
                        <TextField
                          inputRef={inputRef}
                          size="small"
                          fullWidth
                          placeholder="振り返りを入力してEnter..."
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          variant="standard"
                          sx={{ '& .MuiInputBase-input': { py: 0, fontSize: '0.85rem' } }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.85rem',
                            wordBreak: 'break-word',
                            color: entry.review ? 'text.primary' : 'text.disabled',
                            fontStyle: entry.review ? 'normal' : 'italic',
                          }}
                        >
                          {entry.review || 'クリックして振り返りを入力...'}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 削除ボタンセル（ヘッダー操作テキストなし） */}
                    <TableCell align="center" sx={{ p: 0.25 }}>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(entry.id)}
                          sx={{ p: 0.5, opacity: 0.6, '&:hover': { opacity: 1 } }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DontsPage;
