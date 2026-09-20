import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import PeriodSelector from '../../components/PeriodSelector';
import { tasksApi } from '../../api/tasks';
import type { CompletedStatsResponse, TaskItem } from '../../../../shared/types/tasks';

const HistoryTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [stats, setStats] = useState<CompletedStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2026-09-01',
    end: '2026-09-30',
  });

  const fetchStats = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const data = await tasksApi.getCompletedStats(start, end);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch completed stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePeriodChange = (start: string, end: string) => {
    setDateRange({ start, end });
    fetchStats(start, end);
  };

  useEffect(() => {
    fetchStats(dateRange.start, dateRange.end);
  }, [fetchStats, dateRange.start, dateRange.end]);

  const formatDateTime = (dt: string | Date | null) => {
    if (!dt) return '-';
    try {
      const d = typeof dt === 'string' ? parseISO(dt) : dt;
      return format(d, 'yyyy/MM/dd HH:mm', { locale: ja });
    } catch {
      return String(dt);
    }
  };

  // 完了した日時で降順ソート（最新が上）
  const completedTasks: TaskItem[] = useMemo(() => {
    const list = [...(stats?.tasks || [])];
    return list.sort((a, b) => {
      const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return db - da;
    });
  }, [stats?.tasks]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 期間セレクタ */}
      <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' }, alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <PeriodSelector defaultMode="month" onChange={handlePeriodChange} />
      </Box>

      {/* 統計表示 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <CheckCircleIcon color="success" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    完了タスク数
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    {stats?.count ?? 0}
                    <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>
                      件
                    </Typography>
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <FitnessCenterIcon color="primary" sx={{ fontSize: { xs: 32, sm: 40 } }} />
                <Box>
                  <Typography color="text.secondary" variant="caption">
                    完了タスクの重さ合計
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    {stats?.totalWeight ?? 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* 期間内に完了したタスク一覧 */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              完了タスク一覧 ({completedTasks.length}件)
            </Typography>

            {isMobile ? (
              /* スマホ向け: カードリスト表示 */
              <Stack spacing={1}>
                {completedTasks.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                    この期間に完了したタスクはありません
                  </Paper>
                ) : (
                  completedTasks.map(task => (
                    <Card key={task.id} variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', wordBreak: 'break-word', flexGrow: 1 }}>
                            {task.title}
                          </Typography>
                          <Typography variant="caption" sx={{ ml: 1, px: 1, py: 0.25, bgcolor: 'action.hover', borderRadius: 1, fontWeight: 'bold' }}>
                            重さ: {task.weight}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            期限: {formatDateTime(task.deadline)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: '500' }}>
                            完了: {formatDateTime(task.completedAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Stack>
            ) : (
              /* PC向け: テーブル表示 */
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>内容</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">
                        重さ
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>期限</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>完了した日時</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completedTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          この期間に完了したタスクはありません
                        </TableCell>
                      </TableRow>
                    ) : (
                      completedTasks.map(task => (
                        <TableRow key={task.id} hover>
                          <TableCell sx={{ fontWeight: '500' }}>{task.title}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{task.weight}</Typography>
                          </TableCell>
                          <TableCell>{formatDateTime(task.deadline)}</TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: '500' }}>
                            {formatDateTime(task.completedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default HistoryTab;
