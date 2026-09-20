import { useState } from 'react';
import { Box, Typography, IconButton, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';

export type PeriodMode = 'day' | 'week' | 'month';

interface PeriodSelectorProps {
  defaultMode?: PeriodMode;
  initialDate?: Date;
  onChange?: (start: string, end: string, mode: PeriodMode) => void;
}

export const PeriodSelector = ({
  defaultMode = 'month',
  initialDate = new Date('2026-09-20'),
  onChange,
}: PeriodSelectorProps) => {
  const [mode, setMode] = useState<PeriodMode>(defaultMode);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  const handlePrev = () => {
    let nextDate = currentDate;
    if (mode === 'day') nextDate = subDays(currentDate, 1);
    else if (mode === 'week') nextDate = subWeeks(currentDate, 1);
    else if (mode === 'month') nextDate = subMonths(currentDate, 1);
    setCurrentDate(nextDate);
    notifyChange(nextDate, mode);
  };

  const handleNext = () => {
    let nextDate = currentDate;
    if (mode === 'day') nextDate = addDays(currentDate, 1);
    else if (mode === 'week') nextDate = addWeeks(currentDate, 1);
    else if (mode === 'month') nextDate = addMonths(currentDate, 1);
    setCurrentDate(nextDate);
    notifyChange(nextDate, mode);
  };

  const handleModeChange = (newMode: PeriodMode | null) => {
    if (!newMode) return;
    setMode(newMode);
    notifyChange(currentDate, newMode);
  };

  const notifyChange = (date: Date, m: PeriodMode) => {
    if (!onChange) return;
    let s = date;
    let e = date;
    if (m === 'day') {
      s = date;
      e = date;
    } else if (m === 'week') {
      s = startOfWeek(date, { weekStartsOn: 1 });
      e = endOfWeek(date, { weekStartsOn: 1 });
    } else if (m === 'month') {
      s = startOfMonth(date);
      e = endOfMonth(date);
    }
    onChange(format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd'), m);
  };

  const getPeriodLabel = () => {
    if (mode === 'day') {
      return format(currentDate, 'yyyy年M月d日 (E)', { locale: ja });
    } else if (mode === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (s.getFullYear() === e.getFullYear()) {
        return `${format(s, 'yyyy年M月d日')} 〜 ${format(e, 'M月d日')}`;
      }
      return `${format(s, 'yyyy年M月d日')} 〜 ${format(e, 'yyyy年M月d日')}`;
    } else {
      return format(currentDate, 'yyyy年M月');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      {/* 日 / 週 / 月 切り替えボタン */}
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, val) => handleModeChange(val)}
        size="small"
        color="primary"
      >
        <ToggleButton value="day" sx={{ px: 1.5, py: 0.5, fontWeight: 'bold' }}>
          日
        </ToggleButton>
        <ToggleButton value="week" sx={{ px: 1.5, py: 0.5, fontWeight: 'bold' }}>
          週
        </ToggleButton>
        <ToggleButton value="month" sx={{ px: 1.5, py: 0.5, fontWeight: 'bold' }}>
          月
        </ToggleButton>
      </ToggleButtonGroup>

      {/* 左右矢印 ＆ 期間ラベル */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton size="small" onClick={handlePrev} aria-label="前の期間">
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            minWidth: 160,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {getPeriodLabel()}
        </Typography>
        <IconButton size="small" onClick={handleNext} aria-label="次の期間">
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default PeriodSelector;
