import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';

import { assetsApi } from '../../api/assets';
import type { Transaction, AssetStatsResponse } from '../../../../shared/types/assets';

type PeriodMode = 'month' | 'week';

export const StatsTab: React.FC = () => {
  const [mode, setMode] = useState<PeriodMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const [stats, setStats] = useState<AssetStatsResponse>({
    incomeTotal: 0,
    expenseTotal: 0,
    netProfit: 0,
  });
  const [incomeItems, setIncomeItems] = useState<Transaction[]>([]);
  const [expenseItems, setExpenseItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // 期間計算
  const getPeriodRange = useCallback(() => {
    if (mode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        start: format(s, 'yyyy-MM-dd'),
        end: format(e, 'yyyy-MM-dd'),
        label: `${format(s, 'yyyy年M月d日')} 〜 ${format(e, 'M月d日')}`,
      };
    } else {
      const s = startOfMonth(currentDate);
      const e = endOfMonth(currentDate);
      return {
        start: format(s, 'yyyy-MM-dd'),
        end: format(e, 'yyyy-MM-dd'),
        label: format(currentDate, 'yyyy年M月'),
      };
    }
  }, [mode, currentDate]);

  const { start, end, label } = getPeriodRange();

  // データフェッチ
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, incomeRes, expenseRes] = await Promise.all([
        assetsApi.getStats(start, end),
        assetsApi.getTransactions({ start, end, type: 'income', limit: 100 }),
        assetsApi.getTransactions({ start, end, type: 'expense', limit: 100 }),
      ]);
      setStats(statsRes);
      setIncomeItems(incomeRes.items);
      setExpenseItems(expenseRes.items);
    } catch (err) {
      console.error('Failed to fetch stats data:', err);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ナビゲーションハンドラ
  const handlePrev = () => {
    setCurrentDate((prev) => (mode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)));
  };

  const handleNext = () => {
    setCurrentDate((prev) => (mode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)));
  };

  const handleCurrent = () => {
    setCurrentDate(new Date());
  };

  // 金額フォーマット
  const formatAmount = (amount: number) => {
    if (amount > 0) return `+¥${amount.toLocaleString()}`;
    if (amount < 0) return `-¥${Math.abs(amount).toLocaleString()}`;
    return `¥0`;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 上部バー: 期間セレクタ + サマリーバッジ（1行にコンパクトに集約） */}
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
        {/* 期間セレクタ（月 / 週、日は不要との指定） */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_e, val) => {
              if (val !== null) setMode(val);
            }}
            size="small"
            sx={{ height: 28 }}
          >
            <ToggleButton value="month" sx={{ px: 1.25, py: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>
              月
            </ToggleButton>
            <ToggleButton value="week" sx={{ px: 1.25, py: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>
              週
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <IconButton size="small" onClick={handlePrev} sx={{ p: 0.5 }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                minWidth: 150,
                textAlign: 'center',
                userSelect: 'none',
                fontSize: '0.85rem',
              }}
            >
              {label}
            </Typography>
            <IconButton size="small" onClick={handleNext} sx={{ p: 0.5 }}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<TodayIcon fontSize="small" />}
            onClick={handleCurrent}
            sx={{ py: 0.2, px: 1, fontSize: '0.725rem', height: 26 }}
          >
            {mode === 'month' ? '今月' : '今週'}
          </Button>
        </Box>

        {/* 収支サマリーカード（収入合計・支出合計・総損益をコンパクトに横並び） */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 1.5,
            py: 0.5,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              収入合計:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main' }}>
              {formatAmount(stats.incomeTotal)}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: 'divider' }}>|</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              支出合計:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {formatAmount(stats.expenseTotal)}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: 'divider' }}>|</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              総損益:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'bold',
                color: stats.netProfit >= 0 ? 'info.main' : 'error.main',
              }}
            >
              {formatAmount(stats.netProfit)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2ペイン別テーブル表示（収入一覧と支出一覧） */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* 左: 収入テーブル */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'info.main', fontSize: '0.85rem' }}>
              収入 ({incomeItems.length}件)
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 1,
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
            }}
          >
            <Table size="small" stickyHeader aria-label="収入一覧">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 'bold', py: 0.4, px: 1, fontSize: '0.75rem' } }}>
                  <TableCell sx={{ width: 130 }}>日時</TableCell>
                  <TableCell sx={{ width: 110 }} align="right">金額</TableCell>
                  <TableCell>詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && incomeItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : incomeItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                      収入の記録がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeItems.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '& td': { py: 0.25, px: 1, fontSize: '0.8rem' },
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {format(new Date(item.date), 'M/d HH:mm')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'info.main' }}>
                        {formatAmount(item.amount)}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>
                        {item.detail || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* 右: 支出テーブル */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'error.main', fontSize: '0.85rem' }}>
              支出 ({expenseItems.length}件)
            </Typography>
          </Box>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 1,
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
            }}
          >
            <Table size="small" stickyHeader aria-label="支出一覧">
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: 'bold', py: 0.4, px: 1, fontSize: '0.75rem' } }}>
                  <TableCell sx={{ width: 130 }}>日時</TableCell>
                  <TableCell sx={{ width: 110 }} align="right">金額</TableCell>
                  <TableCell>詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && expenseItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={20} />
                    </TableCell>
                  </TableRow>
                ) : expenseItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 2, color: 'text.secondary', fontSize: '0.8rem' }}>
                      支出の記録がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseItems.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '& td': { py: 0.25, px: 1, fontSize: '0.8rem' },
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {format(new Date(item.date), 'M/d HH:mm')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {formatAmount(item.amount)}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>
                        {item.detail || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default StatsTab;
