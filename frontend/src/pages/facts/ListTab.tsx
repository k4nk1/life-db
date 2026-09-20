import React, { useState, useEffect, useCallback } from 'react';
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
  Collapse,
  InputAdornment,
  CircularProgress,
  Popover,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { factsApi } from '../../api/facts';
import type { Tag, FactEntryItem } from '../../../../shared/types/facts';

const ListTab = () => {
  const [entries, setEntries] = useState<FactEntryItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // 検索・絞り込み
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);

  // インライン編集ステート
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [titleValue, setTitleValue] = useState('');

  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [contentValue, setContentValue] = useState('');

  // タグ変更用 Popover ステート
  const [tagPopoverAnchor, setTagPopoverAnchor] = useState<{
    el: HTMLElement;
    entryId: number;
    tagIds: number[];
  } | null>(null);

  // 新規エントリーダイアログ
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSelectedTagIds, setNewSelectedTagIds] = useState<number[]>([]);

  // 各エントリーごとの新しい補足入力
  const [newSupplementTexts, setNewSupplementTexts] = useState<Record<number, string>>({});

  // タグ一覧取得
  const fetchTags = async () => {
    try {
      const data = await factsApi.getTags();
      setTags(data);
    } catch {
      // エラーハンドリング
    }
  };

  // エントリー一覧取得
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: { search?: string; tags?: string } = {};
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (selectedTagIds.length > 0) {
        params.tags = selectedTagIds.join(',');
      }
      const data = await factsApi.getFacts(params);
      setEntries(data.items);
    } catch {
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTagIds]);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // フィルタ用タグトグル
  const handleToggleTagFilter = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // 新規エントリーダイアログでのタグ選択トグル
  const handleToggleNewTag = (tagId: number) => {
    setNewSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // インラインタイトル保存
  const handleSaveTitle = async (entryId: number) => {
    const trimmed = titleValue.trim();
    setEditingTitleId(null);
    if (!trimmed) return;

    const currentEntry = entries.find((e) => e.id === entryId);
    if (currentEntry && currentEntry.title === trimmed) return;

    // 楽観的更新
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, title: trimmed } : e))
    );

    try {
      await factsApi.updateFact(entryId, { title: trimmed });
    } catch {
      await fetchEntries();
    }
  };

  // インライン内容保存
  const handleSaveContent = async (entryId: number) => {
    const trimmed = contentValue.trim();
    setEditingContentId(null);

    const currentEntry = entries.find((e) => e.id === entryId);
    if (currentEntry && (currentEntry.content || '') === trimmed) return;

    // 楽観的更新
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, content: trimmed || null } : e))
    );

    try {
      await factsApi.updateFact(entryId, { content: trimmed || null });
    } catch {
      await fetchEntries();
    }
  };

  // タグインライン編集のトグル
  const handleToggleEntryTag = async (tagId: number) => {
    if (!tagPopoverAnchor) return;
    const { entryId, tagIds } = tagPopoverAnchor;
    const updatedTagIds = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId];

    // Popoverステート更新
    setTagPopoverAnchor((prev) => (prev ? { ...prev, tagIds: updatedTagIds } : null));

    // 楽観的更新
    const selectedTags = tags.filter((t) => updatedTagIds.includes(t.id));
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, tags: selectedTags } : e))
    );

    try {
      await factsApi.updateFact(entryId, { tagIds: updatedTagIds });
    } catch {
      await fetchEntries();
    }
  };

  // エントリー作成
  const handleCreateEntry = async () => {
    if (!newTitle.trim()) return;
    try {
      await factsApi.createFact({
        title: newTitle.trim(),
        content: newContent.trim() || undefined,
        tagIds: newSelectedTagIds,
      });
      setNewTitle('');
      setNewContent('');
      setNewSelectedTagIds([]);
      setOpenCreateDialog(false);
      await fetchEntries();
    } catch {
      // エラー処理
    }
  };

  // エントリー削除
  const handleDeleteEntry = async (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await factsApi.deleteFact(id);
    } catch {
      await fetchEntries();
    }
  };

  // 補足追加
  const handleAddSupplement = async (entryId: number) => {
    const text = newSupplementTexts[entryId]?.trim();
    if (!text) return;

    setNewSupplementTexts((prev) => ({ ...prev, [entryId]: '' }));
    try {
      await factsApi.createSupplement(entryId, { content: text });
      await fetchEntries();
    } catch {
      await fetchEntries();
    }
  };

  // 補足削除
  const handleDeleteSupplement = async (supplementId: number) => {
    try {
      await factsApi.deleteSupplement(supplementId);
      await fetchEntries();
    } catch {
      await fetchEntries();
    }
  };

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
      return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
    } catch {
      return String(dateValue);
    }
  };

  return (
    <Box>
      {/* 上部コントロールバー（1行に詰めて配置） */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* 検索バー */}
        <TextField
          placeholder="タイトルや内容で検索..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 280, '& .MuiInputBase-input': { py: 0.5 } }}
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* タグ絞り込みボタン */}
          <Button
            variant={selectedTagIds.length > 0 ? 'contained' : 'outlined'}
            color={selectedTagIds.length > 0 ? 'primary' : 'inherit'}
            size="small"
            startIcon={<FilterListIcon fontSize="small" />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ py: 0.5 }}
          >
            タグ絞り込み{selectedTagIds.length > 0 ? ` (${selectedTagIds.length})` : ''}
          </Button>

          {/* タグ絞り込み Popover */}
          <Popover
            open={Boolean(filterAnchor)}
            anchorEl={filterAnchor}
            onClose={() => setFilterAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ p: 1.5, maxWidth: 280 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  タグでフィルタ
                </Typography>
                {selectedTagIds.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => setSelectedTagIds([])}
                    sx={{ fontSize: '0.7rem', p: 0 }}
                  >
                    クリア
                  </Button>
                )}
              </Box>
              {tags.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        onClick={() => handleToggleTagFilter(tag.id)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isSelected ? tag.color : 'transparent',
                          color: isSelected ? '#ffffff' : 'text.primary',
                          borderColor: tag.color,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  タグが登録されていません。
                </Typography>
              )}
            </Box>
          </Popover>

          {/* 新規エントリー作成ボタン */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => {
              setNewTitle('');
              setNewContent('');
              setNewSelectedTagIds([]);
              setOpenCreateDialog(true);
            }}
            sx={{ py: 0.5 }}
          >
            エントリーを追加
          </Button>
        </Box>
      </Box>

      {/* エントリー一覧テーブル */}
      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#ffffff' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ width: 36, py: 0.5 }}></TableCell>
              <TableCell sx={{ width: '25%', py: 0.5, fontWeight: 'bold' }}>タイトル</TableCell>
              <TableCell sx={{ width: '20%', py: 0.5, fontWeight: 'bold' }}>タグ</TableCell>
              <TableCell sx={{ py: 0.5, fontWeight: 'bold' }}>内容</TableCell>
              <TableCell sx={{ width: 130, py: 0.5, fontWeight: 'bold' }}>作成日時</TableCell>
              <TableCell align="right" sx={{ width: 48, py: 0.5 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                  {searchQuery || selectedTagIds.length > 0
                    ? '条件に合致するエントリーが見つかりませんでした'
                    : 'エントリーがまだありません。「エントリーを追加」から登録してください'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const isExpanded = Boolean(expandedIds[entry.id]);
                const supplements = entry.supplements || [];

                return (
                  <React.Fragment key={entry.id}>
                    <TableRow
                      hover
                      sx={{
                        '& > *': { borderBottom: 'unset', py: 0.5 },
                        bgcolor: isExpanded ? '#fafbfd' : '#ffffff',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      {/* 展開トグル */}
                      <TableCell sx={{ width: 36, py: 0.5, px: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(entry.id)}
                          aria-label="補足を展開・折りたたみ"
                          sx={{ p: 0.25 }}
                        >
                          {isExpanded ? (
                            <KeyboardArrowDownIcon fontSize="small" />
                          ) : (
                            <KeyboardArrowRightIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>

                      {/* タイトル（インライン編集） */}
                      <TableCell sx={{ py: 0.5, px: 1 }}>
                        {editingTitleId === entry.id ? (
                          <TextField
                            size="small"
                            variant="standard"
                            value={titleValue}
                            autoFocus
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={() => handleSaveTitle(entry.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(entry.id);
                              if (e.key === 'Escape') setEditingTitleId(null);
                            }}
                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography
                              variant="body2"
                              onClick={() => {
                                setEditingTitleId(entry.id);
                                setTitleValue(entry.title);
                              }}
                              sx={{
                                fontWeight: '500',
                                cursor: 'pointer',
                                py: 0.25,
                                px: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover', textDecoration: 'underline' },
                              }}
                            >
                              {entry.title}
                            </Typography>
                            {supplements.length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontSize: '0.7rem' }}
                              >
                                {supplements.length}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>

                      {/* タグ一覧（クリックでタグ編集ポップオーバー表示） */}
                      <TableCell sx={{ py: 0.5, px: 1 }}>
                        <Box
                          onClick={(e) => {
                            setTagPopoverAnchor({
                              el: e.currentTarget,
                              entryId: entry.id,
                              tagIds: entry.tags.map((t) => t.id),
                            });
                          }}
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            alignItems: 'center',
                            cursor: 'pointer',
                            p: 0.25,
                            borderRadius: 1,
                            minHeight: 24,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          {entry.tags && entry.tags.length > 0 ? (
                            entry.tags.map((tag) => (
                              <Chip
                                key={tag.id}
                                label={tag.name}
                                size="small"
                                sx={{
                                  bgcolor: tag.color,
                                  color: '#ffffff',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  height: 20,
                                }}
                              />
                            ))
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}
                            >
                              + タグ設定
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* 内容（インライン編集） */}
                      <TableCell sx={{ py: 0.5, px: 1 }}>
                        {editingContentId === entry.id ? (
                          <TextField
                            size="small"
                            variant="standard"
                            value={contentValue}
                            multiline
                            autoFocus
                            onChange={(e) => setContentValue(e.target.value)}
                            onBlur={() => handleSaveContent(entry.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                handleSaveContent(entry.id);
                              }
                              if (e.key === 'Escape') setEditingContentId(null);
                            }}
                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            color={entry.content ? 'text.secondary' : 'text.disabled'}
                            onClick={() => {
                              setEditingContentId(entry.id);
                              setContentValue(entry.content || '');
                            }}
                            sx={{
                              whiteSpace: 'pre-wrap',
                              maxHeight: '3em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              cursor: 'pointer',
                              py: 0.25,
                              px: 0.5,
                              borderRadius: 1,
                              fontStyle: entry.content ? 'normal' : 'italic',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {entry.content || '内容を入力...'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* 作成日時 */}
                      <TableCell sx={{ py: 0.5, px: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(entry.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* 操作（削除ボタンのみ、編集ボタンなし） */}
                      <TableCell align="right" sx={{ py: 0.5, px: 0.5 }}>
                        <Tooltip title="削除" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteEntry(entry.id)}
                            sx={{ p: 0.25 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* 展開時の補足行（縦スペース縮小・文言なし・番号なし・作成日時は削除ボタンのそば） */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, px: 0, bgcolor: '#f8f9fa' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 1, pl: 5, pr: 2 }}>
                            {/* 補足リスト */}
                            {supplements.map((supplement) => (
                              <Box
                                key={supplement.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  py: 0.25,
                                  px: 1,
                                  borderRadius: 0.5,
                                  '&:hover': { bgcolor: '#eceff1' },
                                }}
                              >
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', flexGrow: 1, mr: 2 }}>
                                  {supplement.content}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    {formatDate(supplement.createdAt)}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteSupplement(supplement.id)}
                                    title="補足を削除"
                                    sx={{ p: 0.25 }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}

                            {/* 補足追加フォーム（コンパクト） */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="補足を入力してEnterで追加..."
                                value={newSupplementTexts[entry.id] || ''}
                                onChange={(e) =>
                                  setNewSupplementTexts((prev) => ({ ...prev, [entry.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddSupplement(entry.id);
                                  }
                                }}
                                sx={{ '& .MuiInputBase-input': { py: 0.35, fontSize: '0.85rem' } }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAddSupplement(entry.id)}
                                disabled={!newSupplementTexts[entry.id]?.trim()}
                                sx={{ minWidth: 60, py: 0.35, fontSize: '0.75rem' }}
                              >
                                追加
                              </Button>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* タグインライン編集用 Popover */}
      <Popover
        open={Boolean(tagPopoverAnchor)}
        anchorEl={tagPopoverAnchor?.el}
        onClose={() => setTagPopoverAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, maxWidth: 260 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            タグを選択（クリックでON/OFF）
          </Typography>
          {tags.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map((tag) => {
                const isSelected = tagPopoverAnchor?.tagIds.includes(tag.id);
                return (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    onClick={() => handleToggleEntryTag(tag.id)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? tag.color : 'transparent',
                      color: isSelected ? '#ffffff' : 'text.primary',
                      borderColor: tag.color,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: '0.75rem',
                      height: 24,
                    }}
                  />
                );
              })}
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              タグが登録されていません。「タグ」タブから作成してください。
            </Typography>
          )}
        </Box>
      </Popover>

      {/* 新規エントリー作成ダイアログ */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>エントリーを追加</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            autoFocus
            label="タイトル (必須)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            size="small"
          />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              タグの選択:
            </Typography>
            {tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {tags.map((tag) => {
                  const isSelected = newSelectedTagIds.includes(tag.id);
                  return (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      onClick={() => handleToggleNewTag(tag.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: isSelected ? tag.color : 'transparent',
                        color: isSelected ? '#ffffff' : 'text.primary',
                        borderColor: tag.color,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        fontWeight: isSelected ? 'bold' : 'normal',
                      }}
                    />
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                タグが登録されていません。「タグ」タブから作成してください。
              </Typography>
            )}
          </Box>

          <TextField
            label="内容 (任意)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            multiline
            rows={3}
            fullWidth
            size="small"
            placeholder="事実や思考の詳細内容を記入してください"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>キャンセル</Button>
          <Button onClick={handleCreateEntry} variant="contained" disabled={!newTitle.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListTab;
