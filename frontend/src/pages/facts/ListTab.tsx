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
  Stack,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const [editingSupplementId, setEditingSupplementId] = useState<number | null>(null);
  const [editingSupplementText, setEditingSupplementText] = useState('');

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

  // 補足更新（インライン保存）
  const handleSaveSupplement = async (entryId: number, supplementId: number) => {
    const trimmed = editingSupplementText.trim();
    setEditingSupplementId(null);
    if (!trimmed) return;

    // 楽観的更新
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === entryId) {
          return {
            ...e,
            supplements: e.supplements.map((s) =>
              s.id === supplementId ? { ...s, content: trimmed } : s
            ),
          };
        }
        return e;
      })
    );

    try {
      await factsApi.updateSupplement(supplementId, { content: trimmed });
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
          mb: 1,
          gap: 0.75,
          width: '100%',
        }}
      >
        {/* 検索バー */}
        <TextField
          placeholder="検索..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            maxWidth: { sm: 300 },
            '& .MuiInputBase-input': { py: 0.4, fontSize: '0.85rem' },
          }}
        />

        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexShrink: 0 }}>
          {/* タグ絞り込みボタン */}
          <Button
            variant={selectedTagIds.length > 0 ? 'contained' : 'outlined'}
            color={selectedTagIds.length > 0 ? 'primary' : 'inherit'}
            size="small"
            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{
              py: 0.4,
              px: { xs: 0.75, sm: 1.25 },
              minWidth: 0,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile
              ? `タグ${selectedTagIds.length > 0 ? `(${selectedTagIds.length})` : ''}`
              : `タグ絞り込み${selectedTagIds.length > 0 ? ` (${selectedTagIds.length})` : ''}`}
          </Button>

          {/* 新規エントリー作成ボタン */}
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setNewTitle('');
              setNewContent('');
              setNewSelectedTagIds([]);
              setOpenCreateDialog(true);
            }}
            sx={{
              py: 0.4,
              px: { xs: 1, sm: 1.5 },
              minWidth: 0,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
            }}
          >
            {isMobile ? '追加' : 'エントリーを追加'}
          </Button>
        </Box>
      </Box>

      {/* タグ絞り込み Popover */}
      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 1.25, maxWidth: 280 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
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
                      fontSize: '0.72rem',
                      height: 22,
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

      {/* エントリー表示: スマホ時はコンパクトカードリスト、PC時は超コンパクトテーブル */}
      {loading && entries.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : entries.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
          {searchQuery || selectedTagIds.length > 0
            ? '条件に合致するエントリーが見つかりませんでした'
            : 'エントリーがまだありません。「エントリーを追加」から登録してください'}
        </Paper>
      ) : isMobile ? (
        /* モバイル向け: 縦余白極小のコンパクトカードリスト */
        <Stack spacing={0.5}>
          {entries.map((entry) => {
            const isExpanded = Boolean(expandedIds[entry.id]);
            const supplements = entry.supplements || [];

            return (
              <Paper
                key={entry.id}
                variant="outlined"
                sx={{
                  p: 0.75,
                  bgcolor: isExpanded ? '#fafbfd' : '#ffffff',
                  borderColor: isExpanded ? 'primary.light' : 'divider',
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
              >
                {/* 1行目: [展開ボタン] [タイトル] [補足数] [削除ボタン] */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => toggleExpand(entry.id)}
                    sx={{ p: 0.15, mt: 0.1 }}
                    aria-label="展開"
                  >
                    {isExpanded ? (
                      <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                    ) : (
                      <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>

                  {editingTitleId === entry.id ? (
                    <TextField
                      size="small"
                      variant="standard"
                      value={titleValue}
                      autoFocus
                      multiline
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={() => handleSaveTitle(entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveTitle(entry.id);
                        }
                        if (e.key === 'Escape') setEditingTitleId(null);
                      }}
                      sx={{ flexGrow: 1, '& .MuiInputBase-input': { py: 0.1, fontSize: '0.85rem' } }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      onClick={() => {
                        setEditingTitleId(entry.id);
                        setTitleValue(entry.title);
                      }}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        flexGrow: 1,
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: 1.35,
                      }}
                    >
                      {entry.title}
                    </Typography>
                  )}

                  {supplements.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        bgcolor: 'action.hover',
                        px: 0.4,
                        py: 0.1,
                        borderRadius: 0.5,
                        fontSize: '0.68rem',
                        flexShrink: 0,
                        mt: 0.2,
                      }}
                    >
                      {supplements.length}
                    </Typography>
                  )}

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteEntry(entry.id)}
                    sx={{ p: 0.15, flexShrink: 0, mt: 0.1 }}
                    title="削除"
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                {/* 2行目: [タグ一覧] [作成日時] */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25, pl: 3.25 }}>
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
                      gap: 0.35,
                      alignItems: 'center',
                      cursor: 'pointer',
                      minHeight: 18,
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
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            height: 18,
                            px: 0.25,
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                        + タグ
                      </Typography>
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', flexShrink: 0 }}>
                    {formatDate(entry.createdAt)}
                  </Typography>
                </Box>

                {/* 展開時: 詳細（内容）および補足エリア */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 0.75, pt: 0.75, pl: 3.25, borderTop: '1px dashed #e0e0e0' }}>
                    {/* 詳細（内容） */}
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 'bold', display: 'block', mb: 0.25, fontSize: '0.72rem' }}
                      >
                        詳細
                      </Typography>
                      {editingContentId === entry.id ? (
                        <TextField
                          size="small"
                          variant="outlined"
                          fullWidth
                          multiline
                          minRows={2}
                          value={contentValue}
                          autoFocus
                          placeholder="詳細を入力..."
                          onChange={(e) => setContentValue(e.target.value)}
                          onBlur={() => handleSaveContent(entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              handleSaveContent(entry.id);
                            }
                            if (e.key === 'Escape') setEditingContentId(null);
                          }}
                          sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8rem' } }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          onClick={() => {
                            setEditingContentId(entry.id);
                            setContentValue(entry.content || '');
                          }}
                          sx={{
                            fontSize: '0.8rem',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            cursor: 'pointer',
                            color: entry.content ? 'text.primary' : 'text.secondary',
                            fontStyle: entry.content ? 'normal' : 'italic',
                            p: 0.5,
                            borderRadius: 0.5,
                            bgcolor: entry.content ? '#f8f9fa' : 'transparent',
                            border: '1px solid',
                            borderColor: entry.content ? '#e9ecef' : 'transparent',
                            '&:hover': { bgcolor: '#f0f4f8' },
                          }}
                        >
                          {entry.content || '+ 詳細を追加...'}
                        </Typography>
                      )}
                    </Box>
                    {supplements.map((supplement) => (
                      <Box
                        key={supplement.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.2,
                          px: 0.5,
                          borderRadius: 0.5,
                          '&:hover': { bgcolor: '#f0f4f8' },
                        }}
                      >
                        {editingSupplementId === supplement.id ? (
                          <TextField
                            size="small"
                            variant="standard"
                            value={editingSupplementText}
                            autoFocus
                            onChange={(e) => setEditingSupplementText(e.target.value)}
                            onBlur={() => handleSaveSupplement(entry.id, supplement.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveSupplement(entry.id, supplement.id);
                              if (e.key === 'Escape') setEditingSupplementId(null);
                            }}
                            sx={{ flexGrow: 1, mr: 1, '& .MuiInputBase-input': { py: 0.1, fontSize: '0.78rem' } }}
                          />
                        ) : (
                          <Typography
                            variant="body2"
                            onClick={() => {
                              setEditingSupplementId(supplement.id);
                              setEditingSupplementText(supplement.content);
                            }}
                            sx={{
                              fontSize: '0.78rem',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              flexGrow: 1,
                              mr: 1,
                              cursor: 'pointer',
                            }}
                          >
                            {supplement.content}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                            {formatDate(supplement.createdAt)}
                          </Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSupplement(supplement.id)}
                            sx={{ p: 0.1 }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}

                    {/* 補足入力 */}
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        fullWidth
                        placeholder="補足を追加..."
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
                        sx={{ '& .MuiInputBase-input': { py: 0.25, fontSize: '0.78rem' } }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAddSupplement(entry.id)}
                        disabled={!newSupplementTexts[entry.id]?.trim()}
                        sx={{ minWidth: 48, py: 0.25, px: 1, fontSize: '0.72rem' }}
                      >
                        追加
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      ) : (
        /* デスクトップ向け: 縦余白極小の超コンパクトテーブル（一画面で大量に見れる） */
        <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#ffffff' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow sx={{ '& > *': { py: 0.25, px: 0.75, fontSize: '0.75rem', fontWeight: 'bold' } }}>
                <TableCell sx={{ width: 32 }}></TableCell>
                <TableCell sx={{ width: '25%' }}>タイトル</TableCell>
                <TableCell sx={{ width: '20%' }}>タグ</TableCell>
                <TableCell>内容</TableCell>
                <TableCell sx={{ width: 120 }}>作成日時</TableCell>
                <TableCell align="right" sx={{ width: 40 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => {
                const isExpanded = Boolean(expandedIds[entry.id]);
                const supplements = entry.supplements || [];

                return (
                  <React.Fragment key={entry.id}>
                    <TableRow
                      hover
                      sx={{
                        '& > *': { borderBottom: 'unset', py: 0.2, px: 0.75 },
                        bgcolor: isExpanded ? '#fafbfd' : '#ffffff',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* 展開トグル */}
                      <TableCell sx={{ width: 32, p: 0.1 }}>
                        <IconButton
                          size="small"
                          onClick={() => toggleExpand(entry.id)}
                          aria-label="補足を展開・折りたたみ"
                          sx={{ p: 0.1 }}
                        >
                          {isExpanded ? (
                            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </TableCell>

                      {/* タイトル（インライン編集） */}
                      <TableCell>
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
                            sx={{ width: '100%', '& .MuiInputBase-input': { py: 0.1, fontSize: '0.8125rem' } }}
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
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                py: 0.1,
                                px: 0.4,
                                borderRadius: 0.5,
                                '&:hover': { bgcolor: 'action.hover', textDecoration: 'underline' },
                              }}
                            >
                              {entry.title}
                            </Typography>
                            {supplements.length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ bgcolor: 'action.hover', px: 0.4, py: 0.05, borderRadius: 0.5, fontSize: '0.68rem' }}
                              >
                                {supplements.length}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>

                      {/* タグ一覧（クリックでタグ編集ポップオーバー表示） */}
                      <TableCell>
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
                            gap: 0.3,
                            alignItems: 'center',
                            cursor: 'pointer',
                            p: 0.1,
                            borderRadius: 0.5,
                            minHeight: 20,
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
                                  fontSize: '0.68rem',
                                  fontWeight: 'bold',
                                  height: 18,
                                  px: 0.25,
                                }}
                              />
                            ))
                          ) : (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontStyle: 'italic', fontSize: '0.72rem' }}
                            >
                              + タグ
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* 内容（インライン編集・1行省略でコンパクト） */}
                      <TableCell>
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
                            sx={{ width: '100%', '& .MuiInputBase-input': { py: 0.1, fontSize: '0.78rem' } }}
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
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              py: 0.1,
                              px: 0.4,
                              borderRadius: 0.5,
                              fontStyle: entry.content ? 'normal' : 'italic',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {entry.content || '内容を入力...'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* 作成日時 */}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                          {formatDate(entry.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* 操作（削除ボタンのみ） */}
                      <TableCell align="right" sx={{ width: 40, p: 0.1 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteEntry(entry.id)}
                          sx={{ p: 0.15 }}
                          title="削除"
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* 展開時の補足行（縦スペース極小） */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, px: 0, bgcolor: '#f8f9fa' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 0.5, pl: 4, pr: 1.5 }}>
                            {/* 補足リスト */}
                            {supplements.map((supplement) => (
                              <Box
                                key={supplement.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  py: 0.15,
                                  px: 0.75,
                                  borderRadius: 0.5,
                                  '&:hover': { bgcolor: '#eceff1' },
                                }}
                              >
                                {editingSupplementId === supplement.id ? (
                                  <TextField
                                    size="small"
                                    variant="standard"
                                    value={editingSupplementText}
                                    autoFocus
                                    onChange={(e) => setEditingSupplementText(e.target.value)}
                                    onBlur={() => handleSaveSupplement(entry.id, supplement.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveSupplement(entry.id, supplement.id);
                                      if (e.key === 'Escape') setEditingSupplementId(null);
                                    }}
                                    sx={{ flexGrow: 1, mr: 1, '& .MuiInputBase-input': { py: 0.1, fontSize: '0.78rem' } }}
                                  />
                                ) : (
                                  <Typography
                                    variant="body2"
                                    onClick={() => {
                                      setEditingSupplementId(supplement.id);
                                      setEditingSupplementText(supplement.content);
                                    }}
                                    sx={{
                                      fontSize: '0.78rem',
                                      whiteSpace: 'pre-wrap',
                                      flexGrow: 1,
                                      mr: 1,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {supplement.content}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                    {formatDate(supplement.createdAt)}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteSupplement(supplement.id)}
                                    sx={{ p: 0.1 }}
                                    title="補足を削除"
                                  >
                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}

                            {/* 補足追加フォーム */}
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.35, alignItems: 'center' }}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="補足を追加..."
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
                                sx={{ '& .MuiInputBase-input': { py: 0.2, fontSize: '0.78rem' } }}
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAddSupplement(entry.id)}
                                disabled={!newSupplementTexts[entry.id]?.trim()}
                                sx={{ minWidth: 48, py: 0.2, px: 1, fontSize: '0.72rem' }}
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
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* タグインライン編集用 Popover */}
      <Popover
        open={Boolean(tagPopoverAnchor)}
        anchorEl={tagPopoverAnchor?.el}
        onClose={() => setTagPopoverAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.25, maxWidth: 260 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.75 }}>
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
                      fontSize: '0.72rem',
                      height: 22,
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
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ py: { xs: 1.5, sm: 2 } }}>エントリーを追加</DialogTitle>
        <DialogContent sx={{ pt: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            autoFocus
            label="タイトル (必須)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            fullWidth
            size="small"
          />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.75 }}>
              タグの選択:
            </Typography>
            {tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                        fontSize: '0.75rem',
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
        <DialogActions sx={{ px: 2, py: 1.5 }}>
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
