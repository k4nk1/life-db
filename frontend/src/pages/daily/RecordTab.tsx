import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Grid, Typography, IconButton, Popover } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import Timeline from './Timeline';
import { dailyApi } from '../../api/daily';
import type { DailyRecord } from '../../../../shared/types/daily';

const RecordTab = () => {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [goal, setGoal] = useState('');
  const [reflection, setReflection] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // 未保存の変更を追跡するためのref
  const isDirtyRef = useRef(false);
  const goalRef = useRef(goal);
  const reflectionRef = useRef(reflection);
  const selectedDateRef = useRef(selectedDate);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  goalRef.current = goal;
  reflectionRef.current = reflection;
  selectedDateRef.current = selectedDate;

  // 記録の保存処理
  const saveRecord = useCallback(async (targetDate: string, g: string, r: string) => {
    try {
      setSaveStatus('saving');
      await dailyApi.updateRecord(targetDate, {
        goal: g,
        reflection: r,
      });
      isDirtyRef.current = false;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('saved');
    }
  }, []);

  // 日付の記録を取得
  const fetchRecord = useCallback(async (targetDate: string) => {
    try {
      const data = await dailyApi.getRecord(targetDate);
      setRecord(data);
      setGoal(data.goal || '');
      setReflection(data.reflection || '');
      isDirtyRef.current = false;
      setSaveStatus('saved');
    } catch {
      setRecord(null);
      setGoal('');
      setReflection('');
    }
  }, []);

  // 日付変更時の処理
  const changeDate = (newDateStr: string) => {
    // 既存の未保存内容を即座に保存
    if (isDirtyRef.current) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      saveRecord(selectedDateRef.current, goalRef.current, reflectionRef.current);
    }
    setSelectedDate(newDateStr);
  };

  useEffect(() => {
    fetchRecord(selectedDate);
  }, [selectedDate, fetchRecord]);

  // アンマウント時・タブ移動時にも即時保存
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        saveRecord(selectedDateRef.current, goalRef.current, reflectionRef.current);
      }
    };
  }, [saveRecord]);

  // 目標・振り返り入力時の自動保存（デバウンス）
  const triggerAutoSave = () => {
    isDirtyRef.current = true;
    setSaveStatus('saving');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      saveRecord(selectedDateRef.current, goalRef.current, reflectionRef.current);
    }, 800);
  };

  const handleGoalChange = (val: string) => {
    setGoal(val);
    triggerAutoSave();
  };

  const handleReflectionChange = (val: string) => {
    setReflection(val);
    triggerAutoSave();
  };

  const parsedDate = parseISO(selectedDate);

  const handlePrevDay = () => {
    changeDate(format(subDays(parsedDate, 1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    changeDate(format(addDays(parsedDate, 1), 'yyyy-MM-dd'));
  };

  const handleOpenCalendar = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseCalendar = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      changeDate(format(newDate, 'yyyy-MM-dd'));
      handleCloseCalendar();
    }
  };

  const formattedDate = format(parsedDate, 'yyyy年M月d日 (E)', { locale: ja });

  return (
    <Box>
      {/* 日付ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={handlePrevDay} aria-label="前日" size="large">
          <ChevronLeftIcon fontSize="large" />
        </IconButton>

        <Box
          onClick={handleOpenCalendar}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            px: 2.5,
            py: 1,
            borderRadius: 2,
            userSelect: 'none',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <CalendarMonthIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
            {formattedDate}
          </Typography>
        </Box>

        <IconButton onClick={handleNextDay} aria-label="翌日" size="large">
          <ChevronRightIcon fontSize="large" />
        </IconButton>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseCalendar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <DateCalendar value={parsedDate} onChange={handleDateChange} />
          </LocalizationProvider>
        </Popover>
      </Box>

      <Grid container spacing={3}>
        {/* 目標・振り返り */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', minHeight: 20 }}>
              <Typography variant="caption" color="text.secondary">
                {saveStatus === 'saving' ? '保存中...' : '自動保存済み'}
              </Typography>
            </Box>

            <TextField
              label="目標"
              multiline
              rows={4}
              value={goal}
              onChange={(e) => handleGoalChange(e.target.value)}
              placeholder="今日の目標を入力..."
              fullWidth
            />
            <TextField
              label="振り返り"
              multiline
              rows={5}
              value={reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="1日の終わりに記入..."
              fullWidth
            />
          </Box>
        </Grid>

        {/* タイムライン */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Timeline
            date={selectedDate}
            actions={record?.actions || []}
            onActionsChange={() => fetchRecord(selectedDate)}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecordTab;
