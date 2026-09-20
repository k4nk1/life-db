import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BarChartIcon from '@mui/icons-material/BarChart';

import TransactionsTab from './TransactionsTab';
import StatsTab from './StatsTab';

export const AssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'stats'>('transactions');

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      {/* 画面ヘッダー: タイトル + タブ切り替え（1行に集約して縦幅を削減） */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          pb: 0.5,
        }}
      >
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          資産
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              px: 2,
              fontSize: '0.85rem',
              fontWeight: 600,
            },
          }}
        >
          <Tab
            value="transactions"
            icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="取引"
          />
          <Tab
            value="stats"
            icon={<BarChartIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="統計"
          />
        </Tabs>
      </Box>

      {/* タブコンテンツ */}
      {activeTab === 'transactions' && <TransactionsTab />}
      {activeTab === 'stats' && <StatsTab />}
    </Box>
  );
};

export default AssetsPage;
