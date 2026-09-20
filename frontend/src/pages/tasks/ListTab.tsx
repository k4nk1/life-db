import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Menu,
  Slider,
  Popover,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

import { tasksApi } from '../../api/tasks';
import type {
  TaskItem,
  CreateTaskRequest,
} from '../../../../shared/types/tasks';

// 進行状況のバッジスタイル判定
const getStatusChip = (
  status: string,
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
) => {
  if (status === 'completed') {
    return (
      <Chip
        label="完了"
        color="success"
        size="small"
        onClick={onClick}
        sx={{ cursor: onClick ? 'pointer' : 'default', fontWeight: 'bold' }}
      />
    );
  }
  if (status === 'not_started') {
    return (
      <Chip
        label="未着手"
        color="error"
        size="small"
        onClick={onClick}
        sx={{ cursor: onClick ? 'pointer' : 'default', fontWeight: 'bold' }}
      />
    );
  }
  // 自由記述 (黄色)
  return (
    <Chip
      label={status}
      size="small"
      onClick={onClick}
      sx={{
        backgroundColor: '#fbc02d',
        color: '#000',
        fontWeight: 'bold',
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  );
};

// 1時間単位 (00〜23) と 15分単位 (00, 15, 30, 45)
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

// =========================================================
// PC向け: 単一タスク行コンポーネント (TaskRow)
// =========================================================
interface TaskRowProps {
  task: TaskItem;
  level?: number;
  onRefresh: (silent?: boolean) => void;
  onAddChild: (parentTask: TaskItem) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  level = 0,
  onRefresh,
  onAddChild,
}) => {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<TaskItem[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // タイトルインライン編集
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);

  // 詳細インライン編集
  const [editingDetail, setEditingDetail] = useState(false);
  const [detailValue, setDetailValue] = useState(task.detail || '');

  // 重さインライン変更 Popover
  const [weightAnchor, setWeightAnchor] = useState<HTMLElement | null>(null);
  const [weightValue, setWeightValue] = useState(task.weight);

  // 期限インライン変更 Popover
  const [deadlineAnchor, setDeadlineAnchor] = useState<HTMLElement | null>(null);
  const [dlDate, setDlDate] = useState('');
  const [dlHour, setDlHour] = useState('23');
  const [dlMinute, setDlMinute] = useState('45');

  // 進行状況メニュー
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null);
  const [customStatusDialogOpen, setCustomStatusDialogOpen] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');

  useEffect(() => {
    setTitleValue(task.title);
    setDetailValue(task.detail || '');
    setWeightValue(task.weight);
  }, [task.title, task.detail, task.weight]);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const data = await tasksApi.getChildTasks(task.id);
      setChildren(data);
    } catch (err) {
      console.error('Failed to load child tasks:', err);
    } finally {
      setLoadingChildren(false);
    }
  }, [task.id]);

  useEffect(() => {
    if (open) {
      loadChildren();
    }
  }, [open, loadChildren]);

  // タイトル更新
  const handleSaveTitle = async () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleValue(task.title);
      return;
    }
    await tasksApi.updateTask(task.id, { title: trimmed });
    onRefresh(true);
  };

  // 詳細更新
  const handleSaveDetail = async () => {
    setEditingDetail(false);
    const trimmed = detailValue.trim();
    if (trimmed === (task.detail || '')) return;
    await tasksApi.updateTask(task.id, { detail: trimmed ? trimmed : null });
    onRefresh(true);
  };

  // 重さ更新
  const handleSaveWeight = async (newWeight: number) => {
    setWeightValue(newWeight);
    setWeightAnchor(null);
    if (newWeight === task.weight) return;
    await tasksApi.updateTask(task.id, { weight: newWeight });
    onRefresh(true);
  };

  // 期限更新
  const handleOpenDeadlinePopover = (e: React.MouseEvent<HTMLElement>) => {
    if (task.deadline) {
      const d = typeof task.deadline === 'string' ? parseISO(task.deadline) : task.deadline;
      setDlDate(format(d, 'yyyy-MM-dd'));
      setDlHour(format(d, 'HH'));
      const mins = Number(format(d, 'mm'));
      const roundedMin = Math.round(mins / 15) * 15;
      setDlMinute(String(roundedMin === 60 ? 45 : roundedMin).padStart(2, '0'));
    } else {
      setDlDate(format(new Date(), 'yyyy-MM-dd'));
      setDlHour('23');
      setDlMinute('45');
    }
    setDeadlineAnchor(e.currentTarget);
  };

  const handleSaveDeadline = async () => {
    setDeadlineAnchor(null);
    let deadlineIso: string | null = null;
    if (dlDate) {
      deadlineIso = new Date(`${dlDate}T${dlHour}:${dlMinute}:00`).toISOString();
    }
    await tasksApi.updateTask(task.id, { deadline: deadlineIso });
    onRefresh(true);
  };

  const handleClearDeadline = async () => {
    setDeadlineAnchor(null);
    await tasksApi.updateTask(task.id, { deadline: null });
    onRefresh(true);
  };

  // 進行状況の変更
  const handleChangeStatus = async (newStatus: string) => {
    setStatusMenuAnchor(null);
    if (newStatus === 'custom') {
      setCustomStatusText(
        task.status !== 'not_started' && task.status !== 'completed'
          ? task.status
          : ''
      );
      setCustomStatusDialogOpen(true);
      return;
    }
    await tasksApi.updateTask(task.id, { status: newStatus });
    onRefresh(true);
    if (open) loadChildren();
  };

  const handleSaveCustomStatus = async () => {
    if (!customStatusText.trim()) return;
    await tasksApi.updateTask(task.id, { status: customStatusText.trim() });
    setCustomStatusDialogOpen(false);
    onRefresh(true);
    if (open) loadChildren();
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${task.title}」を削除しますか？\n（前提タスクもすべて削除されます）`)) {
      return;
    }
    await tasksApi.deleteTask(task.id);
    onRefresh(true);
  };

  const formatDeadline = (dl: string | Date | null) => {
    if (!dl) return '期限なし';
    try {
      const date = typeof dl === 'string' ? parseISO(dl) : dl;
      return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
    } catch {
      return String(dl);
    }
  };

  const renderWeight = () => {
    const subWeight = task.totalWeight - task.weight;
    return (
      <Box
        onClick={e => {
          setWeightValue(task.weight);
          setWeightAnchor(e.currentTarget);
        }}
        sx={{
          cursor: 'pointer',
          px: 1,
          py: 0.25,
          borderRadius: 1,
          display: 'inline-block',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Typography variant="body2" component="span" sx={{ fontWeight: '500' }}>
          {task.weight}
        </Typography>
        {subWeight > 0 && (
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            ({subWeight})
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <>
      <TableRow
        hover
        sx={{
          backgroundColor: level > 0 ? 'action.hover' : 'inherit',
          '& > *': { borderBottom: 'unset', py: 0.75 },
        }}
      >
        {/* 展開矢印 */}
        <TableCell sx={{ pl: 1 + level * 2.5, width: 36, py: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            aria-label="展開"
            sx={{ p: 0.25 }}
          >
            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>
        </TableCell>

        {/* 内容 */}
        <TableCell sx={{ fontWeight: '500' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {level > 0 && <SubdirectoryArrowRightIcon fontSize="small" color="action" />}
            {editingTitle ? (
              <TextField
                size="small"
                variant="standard"
                value={titleValue}
                autoFocus
                onChange={e => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleValue(task.title);
                    setEditingTitle(false);
                  }
                }}
                sx={{ width: '100%', maxWidth: 360 }}
              />
            ) : (
              <Typography
                variant="body2"
                onClick={() => setEditingTitle(true)}
                sx={{
                  cursor: 'pointer',
                  py: 0.25,
                  px: 0.5,
                  borderRadius: 1,
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {task.title}
              </Typography>
            )}
          </Box>
        </TableCell>

        {/* 重さ */}
        <TableCell align="center">{renderWeight()}</TableCell>

        {/* 期限 */}
        <TableCell>
          <Typography
            variant="body2"
            onClick={handleOpenDeadlinePopover}
            sx={{
              cursor: 'pointer',
              py: 0.25,
              px: 0.5,
              borderRadius: 1,
              display: 'inline-block',
              color: task.deadline ? 'text.primary' : 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {formatDeadline(task.deadline)}
          </Typography>
        </TableCell>

        {/* 進行状況 */}
        <TableCell>
          {getStatusChip(task.status, e => setStatusMenuAnchor(e.currentTarget))}
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={() => setStatusMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleChangeStatus('not_started')}>
              <Chip label="未着手" color="error" size="small" sx={{ mr: 1.5, fontWeight: 'bold' }} />
              未着手
            </MenuItem>
            <MenuItem onClick={() => handleChangeStatus('custom')}>
              <Chip
                label="自由記述"
                size="small"
                sx={{ mr: 1.5, bgcolor: '#fbc02d', color: '#000', fontWeight: 'bold' }}
              />
              自由記述...
            </MenuItem>
            <MenuItem onClick={() => handleChangeStatus('completed')}>
              <Chip label="完了" color="success" size="small" sx={{ mr: 1.5, fontWeight: 'bold' }} />
              完了
            </MenuItem>
          </Menu>
        </TableCell>

        {/* 操作 */}
        <TableCell align="right" sx={{ py: 0.5, width: 48 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="削除">
              <IconButton size="small" color="error" onClick={handleDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      {/* 展開パネル */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: 'none' }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                py: 1,
                pl: 3 + level * 2,
                pr: 1,
                borderLeft: '2px solid',
                borderColor: 'primary.light',
                backgroundColor: 'action.hover',
              }}
            >
              {/* 詳細 */}
              <Box sx={{ mb: 1 }}>
                {editingDetail ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      multiline
                      rows={2}
                      size="small"
                      placeholder="詳細を入力..."
                      value={detailValue}
                      autoFocus
                      onChange={e => setDetailValue(e.target.value)}
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" onClick={() => setEditingDetail(false)}>
                        キャンセル
                      </Button>
                      <Button size="small" variant="contained" onClick={handleSaveDetail}>
                        保存
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    onClick={() => {
                      setDetailValue(task.detail || '');
                      setEditingDetail(true);
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: task.detail ? 'text.primary' : 'text.disabled',
                      fontStyle: task.detail ? 'normal' : 'italic',
                      py: 0.25,
                      px: 0.5,
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    {task.detail || '詳細なし（クリックして追加）'}
                  </Typography>
                )}
              </Box>

              {/* 前提タスク追加ボタン */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 0.5 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => onAddChild(task)}
                  sx={{ py: 0.25, fontSize: '0.8rem' }}
                >
                  前提タスクを追加
                </Button>
              </Box>

              {/* 前提タスク子テーブル */}
              {loadingChildren ? (
                <Box sx={{ display: 'flex', p: 1 }}>
                  <CircularProgress size={18} />
                </Box>
              ) : children.length > 0 ? (
                <Table size="small" sx={{ mb: 0.5 }}>
                  <TableBody>
                    {children.map(child => (
                      <TaskRow
                        key={child.id}
                        task={child}
                        level={level + 1}
                        onRefresh={silent => {
                          onRefresh(silent);
                          loadChildren();
                        }}
                        onAddChild={onAddChild}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* 重さ変更用 Popover (Slider) */}
      <Popover
        open={Boolean(weightAnchor)}
        anchorEl={weightAnchor}
        onClose={() => setWeightAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            重さを変更: {weightValue}
          </Typography>
          <Slider
            value={weightValue}
            min={0}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, val) => setWeightValue(val as number)}
            onChangeCommitted={(_, val) => handleSaveWeight(val as number)}
            sx={{ mt: 1 }}
          />
        </Box>
      </Popover>

      {/* 期限変更用 Popover (日付 ＋ 時 ＋ 分) */}
      <Popover
        open={Boolean(deadlineAnchor)}
        anchorEl={deadlineAnchor}
        onClose={() => setDeadlineAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 260 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            期限を設定
          </Typography>
          <TextField
            label="日付"
            type="date"
            size="small"
            value={dlDate}
            onChange={e => setDlDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>時</InputLabel>
              <Select
                value={dlHour}
                label="時"
                onChange={e => setDlHour(e.target.value)}
              >
                {HOUR_OPTIONS.map(h => (
                  <MenuItem key={h} value={h}>
                    {h}時
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>分</InputLabel>
              <Select
                value={dlMinute}
                label="分"
                onChange={e => setDlMinute(e.target.value)}
              >
                {MINUTE_OPTIONS.map(m => (
                  <MenuItem key={m} value={m}>
                    {m}分
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button size="small" color="error" onClick={handleClearDeadline}>
              期限なし
            </Button>
            <Button size="small" variant="contained" onClick={handleSaveDeadline}>
              保存
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* 自由記述ダイアログ */}
      <Dialog
        open={customStatusDialogOpen}
        onClose={() => setCustomStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>進行状況を自由記述</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="進行状況 *"
            fullWidth
            placeholder="例: 進行中, レビュー待ち, 保留"
            value={customStatusText}
            onChange={e => setCustomStatusText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomStatusDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomStatus}
            disabled={!customStatusText.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// =========================================================
// スマホ向け: 単一タスクカードコンポーネント (TaskCard)
// =========================================================
interface TaskCardProps {
  task: TaskItem;
  level?: number;
  onRefresh: (silent?: boolean) => void;
  onAddChild: (parentTask: TaskItem) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  level = 0,
  onRefresh,
  onAddChild,
}) => {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<TaskItem[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  // タイトルインライン編集
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);

  // 詳細インライン編集
  const [editingDetail, setEditingDetail] = useState(false);
  const [detailValue, setDetailValue] = useState(task.detail || '');

  // 重さインライン変更 Popover
  const [weightAnchor, setWeightAnchor] = useState<HTMLElement | null>(null);
  const [weightValue, setWeightValue] = useState(task.weight);

  // 期限インライン変更 Popover
  const [deadlineAnchor, setDeadlineAnchor] = useState<HTMLElement | null>(null);
  const [dlDate, setDlDate] = useState('');
  const [dlHour, setDlHour] = useState('23');
  const [dlMinute, setDlMinute] = useState('45');

  // 進行状況メニュー
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null);
  const [customStatusDialogOpen, setCustomStatusDialogOpen] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');

  useEffect(() => {
    setTitleValue(task.title);
    setDetailValue(task.detail || '');
    setWeightValue(task.weight);
  }, [task.title, task.detail, task.weight]);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const data = await tasksApi.getChildTasks(task.id);
      setChildren(data);
    } catch (err) {
      console.error('Failed to load child tasks:', err);
    } finally {
      setLoadingChildren(false);
    }
  }, [task.id]);

  useEffect(() => {
    if (open) {
      loadChildren();
    }
  }, [open, loadChildren]);

  const handleSaveTitle = async () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleValue(task.title);
      return;
    }
    await tasksApi.updateTask(task.id, { title: trimmed });
    onRefresh(true);
  };

  const handleSaveDetail = async () => {
    setEditingDetail(false);
    const trimmed = detailValue.trim();
    if (trimmed === (task.detail || '')) return;
    await tasksApi.updateTask(task.id, { detail: trimmed ? trimmed : null });
    onRefresh(true);
  };

  const handleSaveWeight = async (newWeight: number) => {
    setWeightValue(newWeight);
    setWeightAnchor(null);
    if (newWeight === task.weight) return;
    await tasksApi.updateTask(task.id, { weight: newWeight });
    onRefresh(true);
  };

  const handleOpenDeadlinePopover = (e: React.MouseEvent<HTMLElement>) => {
    if (task.deadline) {
      const d = typeof task.deadline === 'string' ? parseISO(task.deadline) : task.deadline;
      setDlDate(format(d, 'yyyy-MM-dd'));
      setDlHour(format(d, 'HH'));
      const mins = Number(format(d, 'mm'));
      const roundedMin = Math.round(mins / 15) * 15;
      setDlMinute(String(roundedMin === 60 ? 45 : roundedMin).padStart(2, '0'));
    } else {
      setDlDate(format(new Date(), 'yyyy-MM-dd'));
      setDlHour('23');
      setDlMinute('45');
    }
    setDeadlineAnchor(e.currentTarget);
  };

  const handleSaveDeadline = async () => {
    setDeadlineAnchor(null);
    let deadlineIso: string | null = null;
    if (dlDate) {
      deadlineIso = new Date(`${dlDate}T${dlHour}:${dlMinute}:00`).toISOString();
    }
    await tasksApi.updateTask(task.id, { deadline: deadlineIso });
    onRefresh(true);
  };

  const handleClearDeadline = async () => {
    setDeadlineAnchor(null);
    await tasksApi.updateTask(task.id, { deadline: null });
    onRefresh(true);
  };

  const handleChangeStatus = async (newStatus: string) => {
    setStatusMenuAnchor(null);
    if (newStatus === 'custom') {
      setCustomStatusText(
        task.status !== 'not_started' && task.status !== 'completed'
          ? task.status
          : ''
      );
      setCustomStatusDialogOpen(true);
      return;
    }
    await tasksApi.updateTask(task.id, { status: newStatus });
    onRefresh(true);
    if (open) loadChildren();
  };

  const handleSaveCustomStatus = async () => {
    if (!customStatusText.trim()) return;
    await tasksApi.updateTask(task.id, { status: customStatusText.trim() });
    setCustomStatusDialogOpen(false);
    onRefresh(true);
    if (open) loadChildren();
  };

  const handleDelete = async () => {
    if (!window.confirm(`「${task.title}」を削除しますか？\n（前提タスクもすべて削除されます）`)) {
      return;
    }
    await tasksApi.deleteTask(task.id);
    onRefresh(true);
  };

  const formatDeadline = (dl: string | Date | null) => {
    if (!dl) return '期限なし';
    try {
      const date = typeof dl === 'string' ? parseISO(dl) : dl;
      return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
    } catch {
      return String(dl);
    }
  };

  const subWeight = task.totalWeight - task.weight;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 1.5,
        ml: level * 1.5,
        bgcolor: level > 0 ? 'action.hover' : 'background.paper',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* 上段: 展開矢印 ＆ タイトル ＆ 削除 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
            aria-label="展開"
            sx={{ p: 0.5, mt: -0.25 }}
          >
            {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
          </IconButton>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {editingTitle ? (
              <TextField
                size="small"
                variant="standard"
                value={titleValue}
                autoFocus
                fullWidth
                onChange={e => setTitleValue(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleValue(task.title);
                    setEditingTitle(false);
                  }
                }}
              />
            ) : (
              <Typography
                variant="body2"
                onClick={() => setEditingTitle(true)}
                sx={{
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  py: 0.25,
                  wordBreak: 'break-word',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                }}
              >
                {task.title}
              </Typography>
            )}
          </Box>

          <IconButton size="small" color="error" onClick={handleDelete} sx={{ p: 0.5 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 中段: 進行状況 ＆ 重さ ＆ 期限 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1, ml: 4 }}>
          {/* 進行状況 */}
          {getStatusChip(task.status, e => setStatusMenuAnchor(e.currentTarget))}
          <Menu
            anchorEl={statusMenuAnchor}
            open={Boolean(statusMenuAnchor)}
            onClose={() => setStatusMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleChangeStatus('not_started')}>
              <Chip label="未着手" color="error" size="small" sx={{ mr: 1.5, fontWeight: 'bold' }} />
              未着手
            </MenuItem>
            <MenuItem onClick={() => handleChangeStatus('custom')}>
              <Chip
                label="自由記述"
                size="small"
                sx={{ mr: 1.5, bgcolor: '#fbc02d', color: '#000', fontWeight: 'bold' }}
              />
              自由記述...
            </MenuItem>
            <MenuItem onClick={() => handleChangeStatus('completed')}>
              <Chip label="完了" color="success" size="small" sx={{ mr: 1.5, fontWeight: 'bold' }} />
              完了
            </MenuItem>
          </Menu>

          {/* 重さ */}
          <Box
            onClick={e => {
              setWeightValue(task.weight);
              setWeightAnchor(e.currentTarget);
            }}
            sx={{
              cursor: 'pointer',
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              重さ: {task.weight}
              {subWeight > 0 && ` (${subWeight})`}
            </Typography>
          </Box>

          {/* 期限 */}
          <Typography
            variant="caption"
            onClick={handleOpenDeadlinePopover}
            sx={{
              cursor: 'pointer',
              px: 0.5,
              py: 0.25,
              borderRadius: 1,
              color: task.deadline ? 'text.primary' : 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            期限: {formatDeadline(task.deadline)}
          </Typography>
        </Box>

        {/* 展開パネル（詳細 ＋ 前提タスク） */}
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 1.5,
              pt: 1,
              pl: 1,
              borderLeft: '2px solid',
              borderColor: 'primary.light',
            }}
          >
            {/* 詳細 */}
            <Box sx={{ mb: 1 }}>
              {editingDetail ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    multiline
                    rows={2}
                    size="small"
                    placeholder="詳細を入力..."
                    value={detailValue}
                    autoFocus
                    onChange={e => setDetailValue(e.target.value)}
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => setEditingDetail(false)}>
                      キャンセル
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSaveDetail}>
                      保存
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography
                  variant="caption"
                  onClick={() => {
                    setDetailValue(task.detail || '');
                    setEditingDetail(true);
                  }}
                  sx={{
                    cursor: 'pointer',
                    display: 'block',
                    color: task.detail ? 'text.secondary' : 'text.disabled',
                    fontStyle: task.detail ? 'normal' : 'italic',
                    py: 0.25,
                    px: 0.5,
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {task.detail || '詳細なし（タップして追加）'}
                </Typography>
              )}
            </Box>

            {/* 前提タスク追加ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => onAddChild(task)}
                sx={{ py: 0.25, fontSize: '0.75rem' }}
              >
                前提タスクを追加
              </Button>
            </Box>

            {/* 前提タスクカード一覧 */}
            {loadingChildren ? (
              <Box sx={{ display: 'flex', p: 1 }}>
                <CircularProgress size={18} />
              </Box>
            ) : children.length > 0 ? (
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                {children.map(child => (
                  <TaskCard
                    key={child.id}
                    task={child}
                    level={level + 1}
                    onRefresh={silent => {
                      onRefresh(silent);
                      loadChildren();
                    }}
                    onAddChild={onAddChild}
                  />
                ))}
              </Stack>
            ) : null}
          </Box>
        </Collapse>
      </CardContent>

      {/* 重さ変更用 Popover (Slider) */}
      <Popover
        open={Boolean(weightAnchor)}
        anchorEl={weightAnchor}
        onClose={() => setWeightAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            重さを変更: {weightValue}
          </Typography>
          <Slider
            value={weightValue}
            min={0}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, val) => setWeightValue(val as number)}
            onChangeCommitted={(_, val) => handleSaveWeight(val as number)}
            sx={{ mt: 1 }}
          />
        </Box>
      </Popover>

      {/* 期限変更用 Popover (日付 ＋ 時 ＋ 分) */}
      <Popover
        open={Boolean(deadlineAnchor)}
        anchorEl={deadlineAnchor}
        onClose={() => setDeadlineAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 260 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            期限を設定
          </Typography>
          <TextField
            label="日付"
            type="date"
            size="small"
            value={dlDate}
            onChange={e => setDlDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>時</InputLabel>
              <Select
                value={dlHour}
                label="時"
                onChange={e => setDlHour(e.target.value)}
              >
                {HOUR_OPTIONS.map(h => (
                  <MenuItem key={h} value={h}>
                    {h}時
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>分</InputLabel>
              <Select
                value={dlMinute}
                label="分"
                onChange={e => setDlMinute(e.target.value)}
              >
                {MINUTE_OPTIONS.map(m => (
                  <MenuItem key={m} value={m}>
                    {m}分
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button size="small" color="error" onClick={handleClearDeadline}>
              期限なし
            </Button>
            <Button size="small" variant="contained" onClick={handleSaveDeadline}>
              保存
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* 自由記述ダイアログ */}
      <Dialog
        open={customStatusDialogOpen}
        onClose={() => setCustomStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>進行状況を自由記述</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="進行状況 *"
            fullWidth
            placeholder="例: 進行中, レビュー待ち, 保留"
            value={customStatusText}
            onChange={e => setCustomStatusText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomStatusDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomStatus}
            disabled={!customStatusText.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

// =========================================================
// ListTab メインコンポーネント
// =========================================================
const ListTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 検索
  const [search, setSearch] = useState('');

  // 見出しソート（昇順 -> 降順 -> ソートなし）
  const [sort, setSort] = useState<'id' | 'weight' | 'deadline' | 'status'>('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // タスク作成ダイアログ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [parentTaskForNew, setParentTaskForNew] = useState<TaskItem | null>(null);

  // ダイアログ入力フォーム（日付初期値は今日）
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [weight, setWeight] = useState(1);
  const [deadlineDate, setDeadlineDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [deadlineHour, setDeadlineHour] = useState('23');
  const [deadlineMinute, setDeadlineMinute] = useState('45');

  // ソート切り替え（昇順 -> 降順 -> ソートなし）
  const handleSortClick = (field: 'weight' | 'deadline' | 'status') => {
    if (sort !== field) {
      setSort(field);
      setOrder('asc');
    } else if (order === 'asc') {
      setOrder('desc');
    } else {
      setSort('id');
      setOrder('desc');
    }
  };

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await tasksApi.getTasks({
        search: search.trim() ? search.trim() : undefined,
        sort: sort !== 'id' ? sort : undefined,
        order: sort !== 'id' ? order : 'desc',
        limit: 100,
      });
      setTasks(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [search, sort, order]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 新規タスク（ルート）作成を開く（日付は今日デフォルト、進行状況は未着手固定）
  const handleOpenCreateRoot = () => {
    setParentTaskForNew(null);
    setTitle('');
    setDetail('');
    setWeight(1);
    setDeadlineDate(format(new Date(), 'yyyy-MM-dd'));
    setDeadlineHour('23');
    setDeadlineMinute('45');
    setDialogOpen(true);
  };

  // 前提タスク（子タスク）作成を開く
  const handleOpenCreateChild = (parent: TaskItem) => {
    setParentTaskForNew(parent);
    setTitle('');
    setDetail('');
    setWeight(1);
    setDeadlineDate(format(new Date(), 'yyyy-MM-dd'));
    setDeadlineHour('23');
    setDeadlineMinute('45');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    let deadlineIso: string | null = null;
    if (deadlineDate) {
      deadlineIso = new Date(`${deadlineDate}T${deadlineHour}:${deadlineMinute}:00`).toISOString();
    }

    const createData: CreateTaskRequest = {
      title: title.trim(),
      detail: detail.trim() ? detail : null,
      weight,
      deadline: deadlineIso,
      status: 'not_started',
      parentTaskId: parentTaskForNew ? parentTaskForNew.id : null,
    };
    await tasksApi.createTask(createData);

    setDialogOpen(false);
    fetchTasks(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* ツールバー（検索・追加） */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <TextField
          size="small"
          placeholder="内容・詳細で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          fullWidth={isMobile}
          sx={{ minWidth: { sm: 260 } }}
        />

        {/* スマホ時のみソートボタンを表示 */}
        {isMobile && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={sort === 'weight' ? 'contained' : 'outlined'}
              onClick={() => handleSortClick('weight')}
              sx={{ fontSize: '0.75rem', flexGrow: 1 }}
            >
              重さ {sort === 'weight' ? (order === 'asc' ? '▲' : '▼') : ''}
            </Button>
            <Button
              size="small"
              variant={sort === 'deadline' ? 'contained' : 'outlined'}
              onClick={() => handleSortClick('deadline')}
              sx={{ fontSize: '0.75rem', flexGrow: 1 }}
            >
              期限 {sort === 'deadline' ? (order === 'asc' ? '▲' : '▼') : ''}
            </Button>
            <Button
              size="small"
              variant={sort === 'status' ? 'contained' : 'outlined'}
              onClick={() => handleSortClick('status')}
              sx={{ fontSize: '0.75rem', flexGrow: 1 }}
            >
              状況 {sort === 'status' ? (order === 'asc' ? '▲' : '▼') : ''}
            </Button>
          </Box>
        )}

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateRoot}
          fullWidth={isMobile}
        >
          タスク作成
        </Button>
      </Stack>

      {/* タスク一覧表示 */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : isMobile ? (
        /* スマホ向け: カードリスト表示 */
        <Stack spacing={1}>
          {tasks.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              {search ? '一致するタスクは見つかりませんでした' : 'タスクが登録されていません'}
            </Paper>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                level={0}
                onRefresh={silent => fetchTasks(silent)}
                onAddChild={handleOpenCreateChild}
              />
            ))
          )}
        </Stack>
      ) : (
        /* PC向け: テーブル表示 */
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ width: 36, py: 0.75 }} />
                <TableCell sx={{ fontWeight: 'bold' }}>内容</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  <TableSortLabel
                    active={sort === 'weight'}
                    direction={sort === 'weight' ? order : 'asc'}
                    onClick={() => handleSortClick('weight')}
                  >
                    重さ (前提合計)
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sort === 'deadline'}
                    direction={sort === 'deadline' ? order : 'asc'}
                    onClick={() => handleSortClick('deadline')}
                  >
                    期限
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sort === 'status'}
                    direction={sort === 'status' ? order : 'asc'}
                    onClick={() => handleSortClick('status')}
                  >
                    進行状況
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      {search ? '一致するタスクは見つかりませんでした' : 'タスクが登録されていません'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    level={0}
                    onRefresh={silent => fetchTasks(silent)}
                    onAddChild={handleOpenCreateChild}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 件数表示 */}
      <Typography variant="caption" color="text.secondary" align="right">
        合計: {total}件
      </Typography>

      {/* 作成ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          {parentTaskForNew
            ? `前提タスクの追加 (親: ${parentTaskForNew.title})`
            : '新しいタスク'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="内容 *"
            fullWidth
            size="small"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />

          <TextField
            label="詳細"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={detail}
            onChange={e => setDetail(e.target.value)}
          />

          {/* 重さ (スライダー) */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              重さ: {weight}
            </Typography>
            <Slider
              value={weight}
              min={0}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
              onChange={(_, val) => setWeight(val as number)}
              sx={{ mt: 0.5 }}
            />
          </Box>

          {/* 期限 (日付 ＋ 時 ＋ 分) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              期限
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 1 }}>
              <TextField
                label="日付"
                type="date"
                size="small"
                value={deadlineDate}
                onChange={e => setDeadlineDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <FormControl size="small" fullWidth disabled={!deadlineDate}>
                  <InputLabel>時</InputLabel>
                  <Select
                    value={deadlineHour}
                    label="時"
                    onChange={e => setDeadlineHour(e.target.value)}
                  >
                    {HOUR_OPTIONS.map(h => (
                      <MenuItem key={h} value={h}>
                        {h}時
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth disabled={!deadlineDate}>
                  <InputLabel>分</InputLabel>
                  <Select
                    value={deadlineMinute}
                    label="分"
                    onChange={e => setDeadlineMinute(e.target.value)}
                  >
                    {MINUTE_OPTIONS.map(m => (
                      <MenuItem key={m} value={m}>
                        {m}分
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSave} disabled={!title.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListTab;
