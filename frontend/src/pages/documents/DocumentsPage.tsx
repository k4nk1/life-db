import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Editor from './Editor';

export const DocumentsPage: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectDoc = useCallback((id: number) => {
    setSelectedDocId(id === 0 ? null : id);
  }, []);

  const handleTreeChange = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 110px)',
        width: '100%',
        maxWidth: 1600,
        mx: 'auto',
      }}
    >
      {/* 左サイドバー: ツリービューとファイル・フォルダ操作 */}
      <Sidebar
        selectedDocId={selectedDocId}
        onSelectDoc={handleSelectDoc}
        refreshTrigger={refreshTrigger}
        onTreeChange={handleTreeChange}
      />

      {/* 右メインエリア: マークダウンエディタ・プレビュー */}
      <Editor
        documentId={selectedDocId}
        onDocumentUpdated={handleTreeChange}
      />
    </Box>
  );
};

export default DocumentsPage;
