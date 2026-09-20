import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import { dailyApi } from '../../api/daily';
import type { Action, ActionType } from '../../../../shared/types/daily';

interface TimelineProps {
  date: string;
  actions: Action[];
  onActionsChange: () => void;
}

const minutesToTimeString = (minutes: number): string => {
  const h = Math.min(24, Math.max(0, Math.floor(minutes / 60)))
    .toString()
    .padStart(2, '0');
  const m = Math.min(59, Math.max(0, minutes % 60))
    .toString()
    .padStart(2, '0');
  return `${h}:${m}`;
};

const timeStringToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  return Math.min(1440, Math.max(0, h * 60 + m));
};

const Timeline = ({ date, actions, onActionsChange }: TimelineProps) => {
  const hourHeight = 60; // 1時間 = 60px (1分 = 1px)
  const totalHours = 24;

  const [types, setTypes] = useState<ActionType[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 今日かどうかの判定と現在時刻（分）の管理
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = date === todayStr;

  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // スクロールコンテナのref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, [isToday]);

  // 初期スクロール位置: 今日を見ているときは今の時間が中央になるようにする（0時/24時で飛び出さないようにクランプ）
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (isToday) {
        const containerHeight = scrollContainerRef.current.clientHeight || 550;
        const targetScroll = currentMinutes - containerHeight / 2;
        const maxScroll = totalHours * hourHeight - containerHeight;
        const clampedScroll = Math.max(0, Math.min(maxScroll, targetScroll));
        scrollContainerRef.current.scrollTop = clampedScroll;
      } else {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [date, isToday, currentMinutes]);

  // ダイアログ状態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);

  // フォーム状態
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [selectedSubtypeId, setSelectedSubtypeId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [detail, setDetail] = useState('');

  const fetchTypes = async () => {
    try {
      const data = await dailyApi.getTypes();
      setTypes(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // 空白時間をクリック -> 作成ダイアログ
  const handleSlotClick = (hour: number) => {
    const startM = hour * 60;
    const endM = Math.min(1440, startM + 30);

    setEditingActionId(null);
    setStartTime(minutesToTimeString(startM));
    setEndTime(minutesToTimeString(endM));
    setDetail('');

    if (types.length > 0) {
      const firstType = types[0]!;
      setSelectedTypeId(firstType.id);
      if (firstType.subtypes && firstType.subtypes.length > 0) {
        setSelectedSubtypeId(firstType.subtypes[0]!.id);
      } else {
        setSelectedSubtypeId('');
      }
    } else {
      setSelectedTypeId('');
      setSelectedSubtypeId('');
    }

    setDialogOpen(true);
  };

  // 既存行動をクリック -> 編集ダイアログ
  const handleActionClick = (e: React.MouseEvent, action: Action) => {
    e.stopPropagation();

    let foundTypeId: number | '' = '';
    for (const t of types) {
      if (t.subtypes?.some((s) => s.id === action.subtypeId)) {
        foundTypeId = t.id;
        break;
      }
    }

    setEditingActionId(action.id);
    setSelectedTypeId(foundTypeId);
    setSelectedSubtypeId(action.subtypeId);
    setStartTime(minutesToTimeString(action.startMinutes));
    setEndTime(minutesToTimeString(action.endMinutes));
    setDetail(action.detail || '');

    setDialogOpen(true);
  };

  const handleTypeChange = (typeId: number) => {
    setSelectedTypeId(typeId);
    const t = types.find((item) => item.id === typeId);
    if (t?.subtypes && t.subtypes.length > 0) {
      setSelectedSubtypeId(t.subtypes[0]!.id);
    } else {
      setSelectedSubtypeId('');
    }
  };

  const handleSave = async () => {
    if (selectedSubtypeId === '') {
      setErrorMessage('小分類を選択してください');
      return;
    }

    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = timeStringToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      setErrorMessage('終了時刻は開始時刻より後に設定してください');
      return;
    }

    try {
      if (editingActionId === null) {
        await dailyApi.createAction(date, {
          subtypeId: Number(selectedSubtypeId),
          startMinutes,
          endMinutes,
          detail: detail.trim() || undefined,
        });
      } else {
        await dailyApi.updateAction(editingActionId, {
          subtypeId: Number(selectedSubtypeId),
          startMinutes,
          endMinutes,
          detail: detail.trim() || undefined,
        });
      }
      setDialogOpen(false);
      onActionsChange();
    } catch {
      setErrorMessage('保存に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (editingActionId === null) return;
    try {
      await dailyApi.deleteAction(editingActionId);
      setDialogOpen(false);
      onActionsChange();
    } catch {
      setErrorMessage('削除に失敗しました');
    }
  };

  const getSubtypeInfo = (subtypeId: number) => {
    for (const t of types) {
      const s = t.subtypes?.find((sub) => sub.id === subtypeId);
      if (s) {
        return {
          typeName: t.name,
          subtypeName: s.name,
          color: t.color,
        };
      }
    }
    return {
      typeName: '未分類',
      subtypeName: '未分類',
      color: '#757575',
    };
  };

  const activeType = types.find((t) => t.id === selectedTypeId);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: '#ffffff',
        backgroundImage: 'none',
        boxShadow: 'none',
      }}
    >
      <Typography variant="h6" sx={{ pb: 1, fontWeight: 'bold' }}>
        タイムライン
      </Typography>

      {/* スクロール領域: 高さを550pxに固定 */}
      <Box
        ref={scrollContainerRef}
        sx={{
          height: 550,
          overflowY: 'auto',
          overflowX: 'hidden',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          bgcolor: '#ffffff',
          position: 'relative',
        }}
      >
        {/* タイムライン本体: 24 * 60 = 1440px ちょうど */}
        <Box
          sx={{
            position: 'relative',
            height: totalHours * hourHeight,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* 各時間帯（0時〜23時）の行 */}
          {Array.from({ length: totalHours }, (_, h) => (
            <Box
              key={h}
              sx={{
                display: 'flex',
                height: hourHeight,
                boxSizing: 'border-box',
                position: 'relative',
              }}
            >
              {/* 時刻ラベル（0:00 〜 23:00、0:00が見切れないよう top: 0 に調整） */}
              <Box
                sx={{
                  width: 55,
                  flexShrink: 0,
                  textAlign: 'right',
                  pr: 1,
                  position: 'relative',
                  userSelect: 'none',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: h === 0 ? 0 : -9,
                    right: 8,
                    color: 'text.secondary',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    bgcolor: '#ffffff',
                    px: 0.5,
                  }}
                >
                  {`${h}:00`}
                </Typography>
              </Box>

              {/* 時間枠（クリックして行動作成） */}
              <Box
                onClick={() => handleSlotClick(h)}
                sx={{
                  flex: 1,
                  borderTop: '1px solid #e0e0e0',
                  borderLeft: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                  },
                }}
              />
            </Box>
          ))}

          {/* 最下部の24:00境界マーク */}
          <Box
            sx={{
              display: 'flex',
              height: 0,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: 55,
                flexShrink: 0,
                textAlign: 'right',
                pr: 1,
                position: 'relative',
                userSelect: 'none',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -9,
                  right: 8,
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  lineHeight: 1,
                  bgcolor: '#ffffff',
                  px: 0.5,
                }}
              >
                24:00
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                borderTop: '1px solid #e0e0e0',
                borderLeft: '1px solid #e0e0e0',
              }}
            />
          </Box>

          {/* 現在時刻の赤い線（今日を見ているときのみ表示） */}
          {isToday && (
            <Box
              sx={{
                position: 'absolute',
                top: currentMinutes,
                left: 0,
                right: 0,
                height: 2,
                bgcolor: '#f44336',
                zIndex: 10,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {/* 左端のポインタードット */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 49,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                  transform: 'translateY(-3px)',
                }}
              />
            </Box>
          )}

          {/* 行動ブロックレイヤー */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 55,
              right: 0,
              height: totalHours * hourHeight,
              pointerEvents: 'none',
            }}
          >
            {actions.map((action) => {
              const info = getSubtypeInfo(action.subtypeId);
              const duration = action.endMinutes - action.startMinutes;
              const isShort = duration < 25;

              return (
                <Tooltip
                  key={action.id}
                  arrow
                  placement="top"
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {info.subtypeName} ({info.typeName})
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>
                        {minutesToTimeString(action.startMinutes)} 〜 {minutesToTimeString(action.endMinutes)} ({duration}分)
                      </Typography>
                      {action.detail && (
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                          {action.detail}
                        </Typography>
                      )}
                    </Box>
                  }
                >
                  <Box
                    onClick={(e) => handleActionClick(e, action)}
                    sx={{
                      position: 'absolute',
                      top: action.startMinutes,
                      height: Math.max(16, duration),
                      left: 8,
                      right: 16,
                      bgcolor: info.color,
                      color: '#ffffff',
                      px: isShort ? 0.5 : 1.5,
                      py: 0.25,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      '&:hover': { opacity: 0.9 },
                    }}
                  >
                    {!isShort && (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.825rem' }} noWrap>
                          {info.subtypeName}
                          <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.85 }}>
                            ({info.typeName})
                          </Typography>
                        </Typography>
                        {duration >= 45 && action.detail && (
                          <Typography variant="caption" sx={{ opacity: 0.95 }} noWrap>
                            {action.detail}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* 行動作成・編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingActionId === null ? '行動ブロックを作成' : '行動ブロックを編集'}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* 大分類選択 */}
          <FormControl fullWidth size="small">
            <InputLabel>大分類</InputLabel>
            <Select
              value={selectedTypeId}
              label="大分類"
              onChange={(e) => handleTypeChange(Number(e.target.value))}
            >
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: t.color }} />
                    {t.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 小分類選択 */}
          <FormControl fullWidth size="small" disabled={!activeType?.subtypes?.length}>
            <InputLabel>小分類</InputLabel>
            <Select
              value={selectedSubtypeId}
              label="小分類"
              onChange={(e) => setSelectedSubtypeId(Number(e.target.value))}
            >
              {activeType?.subtypes?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 時間指定 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="開始時刻"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="終了時刻"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {/* 詳細メモ */}
          <TextField
            label="詳細（メモ）"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            multiline
            rows={2}
            fullWidth
            size="small"
          />
        </DialogContent>

        <DialogActions sx={{ justifyContent: editingActionId !== null ? 'space-between' : 'flex-end', px: 3, pb: 2 }}>
          {editingActionId !== null && (
            <Button onClick={handleDelete} color="error">
              削除
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} variant="contained" disabled={selectedSubtypeId === ''}>
              {editingActionId === null ? '作成' : '保存'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* エラーSnackbar */}
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Timeline;
