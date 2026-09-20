import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Tooltip,
  Slider,
  Popover,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import { tasksApi } from '../../api/tasks';
import type {
  RecurringTask,
  CreateRecurringTaskRequest,
} from '../../../../shared/types/tasks';

// 日曜日を左端に配置（日=0, 月=1, 火=2, 水=3, 木=4, 金=5, 土=6）
const DAYS_OF_WEEK = [
  { value: '0', label: '日' },
  { value: '1', label: '月' },
  { value: '2', label: '火' },
  { value: '3', label: '水' },
  { value: '4', label: '木' },
  { value: '5', label: '金' },
  { value: '6', label: '土' },
];

const RecurringTab = () => {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // フォームステート
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [weight, setWeight] = useState(1);
  const [repeatType, setRepeatType] = useState<string>('daily');
  const [repeatTime, setRepeatTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [monthDay, setMonthDay] = useState('1');
  const [deadlineOffsetHours, setDeadlineOffsetHours] = useState<number | ''>('');

  // インライン編集ステート
  // 内容
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState('');

  // 詳細
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editingDetailVal, setEditingDetailVal] = useState('');

  // 重さ Popover
  const [weightAnchor, setWeightAnchor] = useState<HTMLElement | null>(null);
  const [activeTaskIdForWeight, setActiveTaskIdForWeight] = useState<number | null>(null);
  const [activeWeightVal, setActiveWeightVal] = useState(1);

  // 繰り返し日時 Popover
  const [scheduleAnchor, setScheduleAnchor] = useState<HTMLElement | null>(null);
  const [scheduleTaskId, setScheduleTaskId] = useState<number | null>(null);
  const [schedType, setSchedType] = useState('daily');
  const [schedTime, setSchedTime] = useState('09:00');
  const [schedDays, setSchedDays] = useState<string[]>([]);
  const [schedMonthDay, setSchedMonthDay] = useState('1');

  // 期限 Popover
  const [offsetAnchor, setOffsetAnchor] = useState<HTMLElement | null>(null);
  const [offsetTaskId, setOffsetTaskId] = useState<number | null>(null);
  const [offsetVal, setOffsetVal] = useState<number | ''>('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getRecurringTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch recurring tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenCreate = () => {
    setTitle('');
    setDetail('');
    setWeight(1);
    setRepeatType('daily');
    setRepeatTime('09:00');
    setSelectedDays(['1', '2', '3', '4', '5']);
    setMonthDay('1');
    setDeadlineOffsetHours('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    let repeatDaysStr: string | null = null;
    if (repeatType === 'weekly') {
      repeatDaysStr = selectedDays.join(',');
    } else if (repeatType === 'monthly') {
      repeatDaysStr = monthDay;
    }

    const offsetMinutes =
      deadlineOffsetHours !== '' ? Number(deadlineOffsetHours) * 60 : null;

    const createData: CreateRecurringTaskRequest = {
      title: title.trim(),
      detail: detail.trim() ? detail.trim() : null,
      weight,
      repeatType,
      repeatTime: repeatType !== 'manual' ? repeatTime : null,
      repeatDays: repeatDaysStr,
      deadlineOffset: offsetMinutes,
    };
    await tasksApi.createRecurringTask(createData);

    setDialogOpen(false);
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('この繰り返しタスクを削除しますか？')) return;
    await tasksApi.deleteRecurringTask(id);
    fetchTasks();
  };

  const handleTrigger = async (id: number) => {
    try {
      await tasksApi.triggerRecurringTask(id);
      alert('タスク一覧に追加しました！');
    } catch (err) {
      console.error('Failed to trigger recurring task:', err);
      alert('タスクの追加に失敗しました。');
    }
  };

  // インライン保存処理
  const handleSaveInlineTitle = async (id: number) => {
    setEditingTitleId(null);
    if (!editingTitleVal.trim()) return;
    await tasksApi.updateRecurringTask(id, { title: editingTitleVal.trim() });
    fetchTasks();
  };

  const handleSaveInlineDetail = async (id: number) => {
    setEditingDetailId(null);
    await tasksApi.updateRecurringTask(id, {
      detail: editingDetailVal.trim() ? editingDetailVal.trim() : null,
    });
    fetchTasks();
  };

  const handleSaveInlineWeight = async (newWeight: number) => {
    if (!activeTaskIdForWeight) return;
    setWeightAnchor(null);
    await tasksApi.updateRecurringTask(activeTaskIdForWeight, { weight: newWeight });
    fetchTasks();
  };

  const handleOpenSchedulePopover = (e: React.MouseEvent<HTMLElement>, task: RecurringTask) => {
    setScheduleTaskId(task.id);
    setSchedType(task.repeatType);
    setSchedTime(task.repeatTime || '09:00');
    if (task.repeatType === 'weekly' && task.repeatDays) {
      setSchedDays(task.repeatDays.split(',').map(d => d.trim()));
    } else {
      setSchedDays(['1', '2', '3', '4', '5']);
    }
    if (task.repeatType === 'monthly' && task.repeatDays) {
      setSchedMonthDay(task.repeatDays);
    } else {
      setSchedMonthDay('1');
    }
    setScheduleAnchor(e.currentTarget);
  };

  const handleSaveInlineSchedule = async () => {
    if (!scheduleTaskId) return;
    setScheduleAnchor(null);

    let repeatDaysStr: string | null = null;
    if (schedType === 'weekly') {
      repeatDaysStr = schedDays.join(',');
    } else if (schedType === 'monthly') {
      repeatDaysStr = schedMonthDay;
    }

    await tasksApi.updateRecurringTask(scheduleTaskId, {
      repeatType: schedType,
      repeatTime: schedType !== 'manual' ? schedTime : null,
      repeatDays: repeatDaysStr,
    });
    fetchTasks();
  };

  const handleOpenOffsetPopover = (e: React.MouseEvent<HTMLElement>, task: RecurringTask) => {
    setOffsetTaskId(task.id);
    setOffsetVal(
      task.deadlineOffset !== null && task.deadlineOffset !== undefined
        ? task.deadlineOffset / 60
        : ''
    );
    setOffsetAnchor(e.currentTarget);
  };

  const handleSaveInlineOffset = async () => {
    if (!offsetTaskId) return;
    setOffsetAnchor(null);
    const offsetMinutes = offsetVal !== '' ? Number(offsetVal) * 60 : null;
    await tasksApi.updateRecurringTask(offsetTaskId, {
      deadlineOffset: offsetMinutes,
    });
    fetchTasks();
  };

  const formatSchedule = (task: RecurringTask) => {
    if (task.repeatType === 'daily') {
      return `毎日 ${task.repeatTime || ''}`;
    }
    if (task.repeatType === 'weekly') {
      const dayNames = (task.repeatDays || '')
        .split(',')
        .map(d => DAYS_OF_WEEK.find(day => day.value === d.trim())?.label || d)
        .join(', ');
      return `毎週 (${dayNames}) ${task.repeatTime || ''}`;
    }
    if (task.repeatType === 'monthly') {
      return `毎月 ${task.repeatDays || ''}日 ${task.repeatTime || ''}`;
    }
    return '手動';
  };

  const formatDeadlineOffset = (offset: number | null) => {
    if (offset === null || offset === undefined) return '設定なし';
    if (offset % 1440 === 0) {
      return `${offset / 1440}日後`;
    }
    if (offset % 60 === 0) {
      return `${offset / 60}時間後`;
    }
    return `${offset}分後`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* ツールバー */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          繰り返しタスク作成
        </Button>
      </Box>

      {/* 一覧テーブル */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>内容</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>詳細</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  重さ
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>繰り返し日時</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>期限（相対）</TableCell>
                <TableCell sx={{ width: 80 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      繰り返しタスクが登録されていません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map(task => (
                  <TableRow key={task.id} hover sx={{ '& > *': { py: 0.75 } }}>
                    {/* 内容（クリックでインライン編集） */}
                    <TableCell sx={{ fontWeight: '500' }}>
                      {editingTitleId === task.id ? (
                        <TextField
                          size="small"
                          variant="standard"
                          value={editingTitleVal}
                          autoFocus
                          onChange={e => setEditingTitleVal(e.target.value)}
                          onBlur={() => handleSaveInlineTitle(task.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveInlineTitle(task.id);
                            if (e.key === 'Escape') setEditingTitleId(null);
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          onClick={() => {
                            setEditingTitleId(task.id);
                            setEditingTitleVal(task.title);
                          }}
                          sx={{
                            cursor: 'pointer',
                            py: 0.25,
                            px: 0.5,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          {task.title}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 詳細（クリックでインライン編集） */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      {editingDetailId === task.id ? (
                        <TextField
                          size="small"
                          variant="standard"
                          value={editingDetailVal}
                          autoFocus
                          onChange={e => setEditingDetailVal(e.target.value)}
                          onBlur={() => handleSaveInlineDetail(task.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveInlineDetail(task.id);
                            if (e.key === 'Escape') setEditingDetailId(null);
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          onClick={() => {
                            setEditingDetailId(task.id);
                            setEditingDetailVal(task.detail || '');
                          }}
                          sx={{
                            cursor: 'pointer',
                            py: 0.25,
                            px: 0.5,
                            borderRadius: 1,
                            color: task.detail ? 'text.secondary' : 'text.disabled',
                            fontStyle: task.detail ? 'normal' : 'italic',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          {task.detail || '詳細なし'}
                        </Typography>
                      )}
                    </TableCell>

                    {/* 重さ（クリックでPopover） */}
                    <TableCell align="center">
                      <Box
                        onClick={e => {
                          setActiveTaskIdForWeight(task.id);
                          setActiveWeightVal(task.weight);
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
                        <Typography variant="body2">{task.weight}</Typography>
                      </Box>
                    </TableCell>

                    {/* 繰り返し日時（クリックでPopover） */}
                    <TableCell>
                      <Chip
                        label={formatSchedule(task)}
                        size="small"
                        color={task.repeatType === 'manual' ? 'default' : 'primary'}
                        variant="outlined"
                        onClick={e => handleOpenSchedulePopover(e, task)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </TableCell>

                    {/* 期限（相対）（クリックでPopover） */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        onClick={e => handleOpenOffsetPopover(e, task)}
                        sx={{
                          cursor: 'pointer',
                          py: 0.25,
                          px: 0.5,
                          borderRadius: 1,
                          display: 'inline-block',
                          color: task.deadlineOffset !== null ? 'text.primary' : 'text.secondary',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {formatDeadlineOffset(task.deadlineOffset)}
                      </Typography>
                    </TableCell>

                    {/* 操作（手動のときのみ追加ボタンを表示） */}
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, alignItems: 'center' }}>
                        {task.repeatType === 'manual' && (
                          <Tooltip title="タスク一覧に追加">
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<PlayArrowIcon fontSize="small" />}
                              onClick={() => handleTrigger(task.id)}
                              sx={{ py: 0.25, px: 1, fontSize: '0.75rem' }}
                            >
                              追加
                            </Button>
                          </Tooltip>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 重さ変更 Popover */}
      <Popover
        open={Boolean(weightAnchor)}
        anchorEl={weightAnchor}
        onClose={() => setWeightAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, width: 200 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            重さを変更: {activeWeightVal}
          </Typography>
          <Slider
            value={activeWeightVal}
            min={0}
            max={5}
            step={1}
            marks
            valueLabelDisplay="auto"
            onChange={(_, val) => setActiveWeightVal(val as number)}
            onChangeCommitted={(_, val) => handleSaveInlineWeight(val as number)}
            sx={{ mt: 1 }}
          />
        </Box>
      </Popover>

      {/* 繰り返し日時変更 Popover */}
      <Popover
        open={Boolean(scheduleAnchor)}
        anchorEl={scheduleAnchor}
        onClose={() => setScheduleAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 280 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            繰り返し日時を変更
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>種別</InputLabel>
            <Select
              value={schedType}
              label="種別"
              onChange={e => setSchedType(e.target.value)}
            >
              <MenuItem value="daily">毎日</MenuItem>
              <MenuItem value="weekly">毎週</MenuItem>
              <MenuItem value="monthly">毎月</MenuItem>
              <MenuItem value="manual">手動</MenuItem>
            </Select>
          </FormControl>

          {schedType !== 'manual' && (
            <TextField
              label="時刻"
              type="time"
              size="small"
              value={schedTime}
              onChange={e => setSchedTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          )}

          {schedType === 'weekly' && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                曜日 (日曜日始まり):
              </Typography>
              <FormGroup row sx={{ mt: 0.5 }}>
                {DAYS_OF_WEEK.map(day => (
                  <FormControlLabel
                    key={day.value}
                    sx={{ mr: 1 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={schedDays.includes(day.value)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSchedDays([...schedDays, day.value]);
                          } else {
                            setSchedDays(schedDays.filter(d => d !== day.value));
                          }
                        }}
                      />
                    }
                    label={<Typography variant="body2">{day.label}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {schedType === 'monthly' && (
            <TextField
              label="毎月の日 (1〜31)"
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 1, max: 31 } }}
              value={schedMonthDay}
              onChange={e => setSchedMonthDay(e.target.value)}
              fullWidth
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" variant="contained" onClick={handleSaveInlineSchedule}>
              保存
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* 期限（相対）変更 Popover */}
      <Popover
        open={Boolean(offsetAnchor)}
        anchorEl={offsetAnchor}
        onClose={() => setOffsetAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, minWidth: 240 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            期限（相対）を変更
          </Typography>
          <TextField
            label="追加からの時間数"
            placeholder="例: 24 (1日後), 2 (2時間後)"
            type="number"
            size="small"
            slotProps={{ htmlInput: { min: 0 } }}
            value={offsetVal}
            onChange={e => setOffsetVal(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button
              size="small"
              color="error"
              onClick={async () => {
                if (!offsetTaskId) return;
                setOffsetAnchor(null);
                await tasksApi.updateRecurringTask(offsetTaskId, { deadlineOffset: null });
                fetchTasks();
              }}
            >
              設定なし
            </Button>
            <Button size="small" variant="contained" onClick={handleSaveInlineOffset}>
              保存
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* 作成ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          新しい繰り返しタスク
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

          <FormControl fullWidth size="small">
            <InputLabel>繰り返し種別</InputLabel>
            <Select
              value={repeatType}
              label="繰り返し種別"
              onChange={e => setRepeatType(e.target.value)}
            >
              <MenuItem value="daily">毎日</MenuItem>
              <MenuItem value="weekly">毎週</MenuItem>
              <MenuItem value="monthly">毎月</MenuItem>
              <MenuItem value="manual">手動</MenuItem>
            </Select>
          </FormControl>

          {repeatType !== 'manual' && (
            <TextField
              label="時刻"
              type="time"
              size="small"
              value={repeatTime}
              onChange={e => setRepeatTime(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          )}

          {/* 日曜日始まりのカレンダー順 */}
          {repeatType === 'weekly' && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                曜日を選択 (日曜日始まり):
              </Typography>
              <FormGroup row sx={{ mt: 0.5 }}>
                {DAYS_OF_WEEK.map(day => (
                  <FormControlLabel
                    key={day.value}
                    sx={{ mr: 1 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedDays.includes(day.value)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedDays([...selectedDays, day.value]);
                          } else {
                            setSelectedDays(selectedDays.filter(d => d !== day.value));
                          }
                        }}
                      />
                    }
                    label={<Typography variant="body2">{day.label}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {repeatType === 'monthly' && (
            <TextField
              label="毎月の日 (1〜31)"
              type="number"
              size="small"
              slotProps={{ htmlInput: { min: 1, max: 31 } }}
              value={monthDay}
              onChange={e => setMonthDay(e.target.value)}
              fullWidth
            />
          )}

          <TextField
            label="期限（タスク追加からの相対時間：時間数）"
            placeholder="例: 24 (1日後), 2 (2時間後) 空欄なら期限なし"
            type="number"
            size="small"
            slotProps={{ htmlInput: { min: 0 } }}
            value={deadlineOffsetHours}
            onChange={e => setDeadlineOffsetHours(e.target.value === '' ? '' : Number(e.target.value))}
            fullWidth
          />
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

export default RecurringTab;
