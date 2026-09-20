import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import PeriodSelector from '../../components/PeriodSelector';
import { dailyApi } from '../../api/daily';
import type { DailyStats } from '../../../../shared/types/daily';

const formatHoursMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}時間${m}分`;
};

const StatsTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [groupBy, setGroupBy] = useState<'type' | 'subtype'>('type');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2026-09-01',
    end: '2026-09-30',
  });
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(
    async (start: string, end: string, group: 'type' | 'subtype') => {
      setLoading(true);
      try {
        const data = await dailyApi.getStats(start, end, group);
        setStats(data);
      } catch {
        setStats([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchStats(dateRange.start, dateRange.end, groupBy);
  }, [dateRange, groupBy, fetchStats]);

  const handlePeriodChange = (start: string, end: string) => {
    setDateRange({ start, end });
  };

  const pieData = stats
    .filter((s) => s.totalMinutes > 0)
    .map((s) => ({
      id: s.id,
      value: s.totalMinutes,
      label: s.typeName ? `${s.name} (${s.typeName})` : s.name,
      color: s.color,
    }));

  return (
    <Box>
      {/* 期間セレクタ ＆ 大分類/小分類の切り替え */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'space-between' },
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <PeriodSelector defaultMode="month" onChange={handlePeriodChange} />

        <ToggleButtonGroup
          value={groupBy}
          exclusive
          onChange={(_, newval) => {
            if (newval) setGroupBy(newval);
          }}
          size="small"
          color="primary"
        >
          <ToggleButton value="type" sx={{ px: { xs: 2, sm: 2.5 }, fontWeight: 'bold' }}>
            大分類
          </ToggleButton>
          <ToggleButton value="subtype" sx={{ px: { xs: 2, sm: 2.5 }, fontWeight: 'bold' }}>
            小分類
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : stats.length === 0 || pieData.length === 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 4, sm: 6 }, textAlign: 'center', bgcolor: '#ffffff' }}>
          <Typography color="text.secondary">
            指定された期間（{dateRange.start} 〜 {dateRange.end}）の行動データはありません。
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#ffffff',
                overflow: 'hidden',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', alignSelf: 'flex-start' }}>
                {groupBy === 'type' ? '大分類別割合' : '小分類別割合'}
              </Typography>
              <PieChart
                series={[
                  {
                    data: pieData,
                    innerRadius: 0,
                    outerRadius: isMobile ? 75 : 105,
                    paddingAngle: 0,
                    cornerRadius: 0,
                  },
                ]}
                width={isMobile ? 300 : 420}
                height={isMobile ? 220 : 280}
                hideLegend={isMobile}
              />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#ffffff' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                内訳詳細
              </Typography>
              <List disablePadding>
                {stats.map((stat) => (
                  <ListItem
                    key={stat.id}
                    sx={{
                      py: 1.5,
                      borderBottom: '1px solid #f0f0f0',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: stat.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {stat.name}
                          {stat.typeName && (
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 'normal' }}>
                              ({stat.typeName})
                            </Typography>
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          合計: {formatHoursMinutes(stat.totalMinutes)} ({Math.round(stat.percentage)}%) / 1日平均: {formatHoursMinutes(stat.dailyAverageMinutes)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StatsTab;
