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
  Tooltip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { format, parseISO } from 'date-fns';

import { assetsApi } from '../../api/assets';
import type { Transaction, TransactionType } from '../../../../shared/types/assets';

// 現在のローカル日時文字列（yyyy-MM-ddTHH:mm）を取得するヘルパー
const getCurrentLocalDateTime = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const TransactionsTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // フィルタステート
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  // 新規取引入力ステート（取引日時はデフォルトで現在日時）
  const [newDate, setNewDate] = useState<string>(getCurrentLocalDateTime());
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDetail, setNewDetail] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // インライン編集ステート
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: 'date' | 'amount' | 'detail';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement | null>(null);

  // 一覧取得
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await assetsApi.getTransactions({
        type: filterType === 'all' ? undefined : filterType,
        page,
        limit,
      });
      setTransactions(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // 新規作成
  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = Number(newAmount);
    if (isNaN(amountNum) || newAmount.trim() === '' || creating) return;

    setCreating(true);
    try {
      await assetsApi.createTransaction({
        date: newDate ? new Date(newDate) : new Date(),
        amount: amountNum,
        detail: newDetail.trim() || undefined,
      });
      // フォーム初期化（日時は再度現在日時にリセット）
      setNewDate(getCurrentLocalDateTime());
      setNewAmount('');
      setNewDetail('');
      await fetchTransactions();
    } catch (err) {
      console.error('Failed to create transaction:', err);
    } finally {
      setCreating(false);
    }
  };

  // 削除
  const handleDelete = async (id: number) => {
    try {
      await assetsApi.deleteTransaction(id);
      await fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // インライン編集開始
  const handleStartEdit = (
    id: number,
    field: 'date' | 'amount' | 'detail',
    currentVal: string | number | Date | null
  ) => {
    setEditingCell({ id, field });
    if (field === 'date') {
      try {
        const d = typeof currentVal === 'string' ? parseISO(currentVal) : new Date(currentVal as any);
        setEditValue(format(d, "yyyy-MM-dd'T'HH:mm"));
      } catch {
        setEditValue(getCurrentLocalDateTime());
      }
    } else {
      setEditValue(currentVal !== null && currentVal !== undefined ? String(currentVal) : '');
    }
  };

  // インライン編集保存
  const handleSaveEdit = async () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const currentItem = transactions.find((t) => t.id === id);
    if (!currentItem) {
      setEditingCell(null);
      return;
    }

    const trimmed = editValue.trim();

    if (field === 'amount') {
      const parsedNum = Number(trimmed);
      if (!isNaN(parsedNum) && parsedNum !== currentItem.amount) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, amount: parsedNum } : t))
        );
        try {
          await assetsApi.updateTransaction(id, { amount: parsedNum });
        } catch (err) {
          console.error('Failed to update amount:', err);
          await fetchTransactions();
        }
      }
    } else if (field === 'detail') {
      if (trimmed !== (currentItem.detail ?? '')) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, detail: trimmed || null } : t))
        );
        try {
          await assetsApi.updateTransaction(id, { detail: trimmed || null });
        } catch (err) {
          console.error('Failed to update detail:', err);
          await fetchTransactions();
        }
      }
    } else if (field === 'date') {
      if (trimmed) {
        const newIso = new Date(trimmed).toISOString();
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, date: newIso } : t))
        );
        try {
          await assetsApi.updateTransaction(id, { date: new Date(trimmed) });
        } catch (err) {
          console.error('Failed to update date:', err);
          await fetchTransactions();
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

  // 編集開始時にフォーカス
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editingCell.field !== 'date') {
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  // 金額フォーマット
  const formatAmount = (amount: number) => {
    if (amount > 0) {
      return `+¥${amount.toLocaleString()}`;
    } else if (amount < 0) {
      return `-¥${Math.abs(amount).toLocaleString()}`;
    }
    return `¥0`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Box sx={{ width: '100%' }}>
      {/* ツールバー部: 種別フィルタ + 新規追加インラインバー（極限まで高さを抑えた設計） */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1,
        }}
      >
        {/* 種別フィルタ */}
        <ToggleButtonGroup
          value={filterType}
          exclusive
          onChange={(_e, val) => {
            if (val !== null) {
              setFilterType(val);
              setPage(1);
            }
          }}
          size="small"
          sx={{ height: 28 }}
        >
          <ToggleButton value="all" sx={{ px: 1.25, py: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>
            すべて
          </ToggleButton>
          <ToggleButton value="income" sx={{ px: 1.25, py: 0, fontSize: '0.75rem', fontWeight: 'bold', color: 'info.main' }}>
            収入のみ
          </ToggleButton>
          <ToggleButton value="expense" sx={{ px: 1.25, py: 0, fontSize: '0.75rem', fontWeight: 'bold', color: 'error.main' }}>
            支出のみ
          </ToggleButton>
        </ToggleButtonGroup>

        {/* 総件数 */}
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          全 {total} 件
        </Typography>
      </Box>

      {/* 新規取引追加バー（デフォルト現在日時、1行でコンパクトに配置） */}
      <Box
        component="form"
        onSubmit={handleCreate}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 0.75,
          mb: 1,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        {/* 取引日時（デフォルト現在日時） */}
        <TextField
          type="datetime-local"
          size="small"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          disabled={creating}
          sx={{
            width: 190,
            '& .MuiInputBase-input': { py: 0.4, px: 1, fontSize: '0.8rem' },
          }}
        />

        {/* 金額 */}
        <TextField
          type="number"
          size="small"
          placeholder="金額 (+収入 / -支出)"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          disabled={creating}
          sx={{
            width: 170,
            '& .MuiInputBase-input': { py: 0.4, px: 1, fontSize: '0.8rem' },
          }}
        />

        {/* 詳細 */}
        <TextField
          size="small"
          placeholder="詳細・メモ（任意）"
          value={newDetail}
          onChange={(e) => setNewDetail(e.target.value)}
          disabled={creating}
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-input': { py: 0.4, px: 1, fontSize: '0.8rem' },
          }}
        />

        {/* 追加ボタン */}
        <Button
          type="submit"
          variant="contained"
          size="small"
          disabled={creating || !newAmount.trim()}
          startIcon={<AddIcon fontSize="small" />}
          sx={{ height: 28, px: 1.5, fontSize: '0.75rem', flexShrink: 0 }}
        >
          追加
        </Button>
      </Box>

      {/* 取引一覧テーブル（高密度・コンパクト・インライン編集・操作ヘッダーなし） */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          borderRadius: 1,
          maxHeight: 'calc(100vh - 220px)',
          overflowY: 'auto',
        }}
      >
        <Table size="small" stickyHeader aria-label="取引一覧">
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 'bold', py: 0.5, px: 1.25, fontSize: '0.78rem' } }}>
              <TableCell sx={{ width: 170 }}>取引日時</TableCell>
              <TableCell sx={{ width: 140 }} align="right">金額</TableCell>
              <TableCell sx={{ minWidth: 200 }}>詳細</TableCell>
              {/* 操作ヘッダーは不要との指定に基づき、空セル */}
              <TableCell sx={{ width: 44, minWidth: 44, p: 0 }} align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={22} />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.85rem' }}>
                  取引がありません。上の入力バーから追加してください。
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((item) => {
                const isEditingDate = editingCell?.id === item.id && editingCell?.field === 'date';
                const isEditingAmount = editingCell?.id === item.id && editingCell?.field === 'amount';
                const isEditingDetail = editingCell?.id === item.id && editingCell?.field === 'detail';

                return (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '& td': { py: 0.35, px: 1.25, fontSize: '0.825rem' },
                      '&:hover .delete-btn': { opacity: 0.8 },
                    }}
                  >
                    {/* 取引日時セル（インライン編集） */}
                    <TableCell
                      onClick={() => !isEditingDate && handleStartEdit(item.id, 'date', item.date)}
                      sx={{
                        cursor: isEditingDate ? 'default' : 'pointer',
                        '&:hover': isEditingDate ? {} : { bgcolor: 'action.hover' },
                      }}
                    >
                      {isEditingDate ? (
                        <TextField
                          inputRef={editInputRef}
                          type="datetime-local"
                          size="small"
                          fullWidth
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          variant="standard"
                          sx={{ '& .MuiInputBase-input': { py: 0, fontSize: '0.825rem' } }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                          {format(new Date(item.date), 'yyyy/MM/dd HH:mm')}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 金額セル（インライン編集） */}
                    <TableCell
                      align="right"
                      onClick={() => !isEditingAmount && handleStartEdit(item.id, 'amount', item.amount)}
                      sx={{
                        cursor: isEditingAmount ? 'default' : 'pointer',
                        fontWeight: 600,
                        color:
                          item.amount > 0
                            ? 'info.main'
                            : item.amount < 0
                            ? 'error.main'
                            : 'text.secondary',
                        '&:hover': isEditingAmount ? {} : { bgcolor: 'action.hover' },
                      }}
                    >
                      {isEditingAmount ? (
                        <TextField
                          inputRef={editInputRef}
                          type="number"
                          size="small"
                          fullWidth
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          variant="standard"
                          sx={{ '& .MuiInputBase-input': { py: 0, textAlign: 'right', fontSize: '0.825rem' } }}
                        />
                      ) : (
                        formatAmount(item.amount)
                      )}
                    </TableCell>

                    {/* 詳細セル（インライン編集） */}
                    <TableCell
                      onClick={() => !isEditingDetail && handleStartEdit(item.id, 'detail', item.detail)}
                      sx={{
                        cursor: isEditingDetail ? 'default' : 'pointer',
                        '&:hover': isEditingDetail ? {} : { bgcolor: 'action.hover' },
                      }}
                    >
                      {isEditingDetail ? (
                        <TextField
                          inputRef={editInputRef}
                          size="small"
                          fullWidth
                          placeholder="詳細を入力..."
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleKeyDown}
                          variant="standard"
                          sx={{ '& .MuiInputBase-input': { py: 0, fontSize: '0.825rem' } }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.825rem',
                            wordBreak: 'break-word',
                            color: item.detail ? 'text.primary' : 'text.disabled',
                            fontStyle: item.detail ? 'normal' : 'italic',
                          }}
                        >
                          {item.detail || 'クリックして詳細を入力...'}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 削除ボタンセル（操作ヘッダーなし） */}
                    <TableCell align="center" sx={{ p: 0.2 }}>
                      <Tooltip title="削除">
                        <IconButton
                          size="small"
                          className="delete-btn"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                          sx={{ p: 0.35, opacity: 0.3, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
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

      {/* ページネーション（複数ページある場合のみ） */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e, val) => setPage(val)}
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

export default TransactionsTab;
