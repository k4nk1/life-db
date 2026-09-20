import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';

import MDEditor from '@uiw/react-md-editor';

import { documentsApi } from '../../api/documents';
import type { DocumentItem } from '../../../../shared/types/documents';

interface EditorProps {
  documentId: number | null;
  onDocumentUpdated?: () => void;
}

export const Editor: React.FC<EditorProps> = ({ documentId, onDocumentUpdated }) => {
  const [, setDoc] = useState<DocumentItem | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 最新ステートと読み込み済みIDの追跡
  const docRef = useRef<DocumentItem | null>(null);
  const loadedDocIdRef = useRef<number | null>(null);

  const stateRef = useRef({
    documentId,
    title,
    content,
    isDirty,
  });

  useEffect(() => {
    stateRef.current = {
      documentId,
      title,
      content,
      isDirty,
    };
  }, [documentId, title, content, isDirty]);

  // 保存処理本体
  const saveDocument = useCallback(
    async (targetId: number, targetTitle: string, targetContent: string) => {
      if (!targetId || targetId <= 0) return;
      try {
        setSaving(true);
        const nameToSave = targetTitle.trim() || undefined;
        const updated = await documentsApi.updateDocument(targetId, {
          name: nameToSave,
          content: targetContent,
        });

        setIsDirty(false);
        setDoc((prev) => (prev && prev.id === targetId ? updated : prev));

        // タイトルが実際に変更された場合のみツリーを更新
        if (onDocumentUpdated && docRef.current && docRef.current.name !== updated.name) {
          onDocumentUpdated();
        }
        docRef.current = updated;
      } catch (err) {
        console.error('Failed to save document:', err);
        setToastMessage('自動保存に失敗しました');
      } finally {
        setSaving(false);
      }
    },
    [onDocumentUpdated]
  );

  const saveRef = useRef(saveDocument);
  useEffect(() => {
    saveRef.current = saveDocument;
  }, [saveDocument]);

  // ドキュメントデータ読み込み（IDが変わったときのみ）
  const loadDocument = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const data = await documentsApi.getDocument(id);
      docRef.current = data;
      loadedDocIdRef.current = id;
      setDoc(data);
      setTitle(data.name);
      setContent(data.content ?? '');
      setIsDirty(false);
    } catch (err) {
      console.error(`Failed to load document ${id}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ドキュメントIDが変更されたときの切り替え処理
  useEffect(() => {
    const prev = stateRef.current;
    // 前のドキュメントに未保存変更があれば保存
    if (prev.documentId && prev.isDirty && prev.documentId !== documentId) {
      saveRef.current(prev.documentId, prev.title, prev.content);
    }

    if (documentId && documentId > 0) {
      // 既に読み込み済みのIDと同じならリロードしない
      if (loadedDocIdRef.current !== documentId) {
        loadDocument(documentId);
      }
    } else {
      loadedDocIdRef.current = null;
      docRef.current = null;
      setDoc(null);
      setTitle('');
      setContent('');
      setIsDirty(false);
    }

    return () => {
      // アンマウント時に未保存変更があれば保存
      const current = stateRef.current;
      if (current.documentId && current.isDirty) {
        saveRef.current(current.documentId, current.title, current.content);
      }
    };
  }, [documentId, loadDocument]);

  // しばらく編集がなかったら自動保存（Debounce: 1.5秒）
  useEffect(() => {
    if (!isDirty || !documentId || saving) return;

    const timer = setTimeout(() => {
      saveDocument(documentId, title, content);
    }, 1500);

    return () => clearTimeout(timer);
  }, [content, title, isDirty, documentId, saving, saveDocument]);

  // 手動保存ハンドラ
  const handleManualSave = () => {
    if (documentId && isDirty) {
      saveDocument(documentId, title, content);
      setToastMessage('保存しました');
    }
  };

  // ショートカットキー (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // 未選択状態
  if (!documentId || documentId <= 0) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          height: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          p: 4,
        }}
      >
        <DescriptionIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1 }}>
          文書が選択されていません
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          左サイドバーから文書を選択するか、新しい文書を作成してください。
        </Typography>
      </Box>
    );
  }

  // 読み込み中状態
  if (loading) {
    return (
      <Box
        sx={{
          flexGrow: 1,
          height: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        height: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* エディタヘッダーツールバー */}
      {/* エディタヘッダーツールバー（固定48pxで上下ブレを防止） */}
      <Box
        sx={{
          height: 48,
          minHeight: 48,
          maxHeight: 48,
          boxSizing: 'border-box',
          flexShrink: 0,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          bgcolor: 'grey.50',
        }}
      >
        {/* 文書タイトル入力 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, maxWidth: 600 }}>
          <DescriptionIcon color="primary" fontSize="small" />
          <Box
            component="input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="タイトルを入力..."
            sx={{
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              width: '100%',
              py: 0.5,
              px: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'white' },
              '&:focus': { bgcolor: 'white', boxShadow: '0 0 0 1px #1976d2' },
            }}
          />
        </Box>

        {/* 自動保存ステータス & 保存ボタン */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          {saving ? (
            <Chip
              icon={
                <SyncIcon
                  sx={{
                    fontSize: '16px !important',
                    animation: 'spin 1.5s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              }
              label="自動保存中..."
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 26, fontSize: '0.75rem', boxSizing: 'border-box' }}
            />
          ) : isDirty ? (
            <Chip
              icon={<EditIcon sx={{ fontSize: '14px !important' }} />}
              label="編集中（未保存）"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 26, fontSize: '0.75rem', boxSizing: 'border-box' }}
            />
          ) : (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
              label="自動保存済み"
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 26, fontSize: '0.75rem', boxSizing: 'border-box' }}
            />
          )}

          <Button
            variant={isDirty ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            startIcon={
              saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />
            }
            onClick={handleManualSave}
            disabled={saving || !isDirty}
            sx={{ height: 28, px: 1.5, fontSize: '0.75rem', boxSizing: 'border-box' }}
          >
            保存 (Ctrl+S)
          </Button>
        </Box>
      </Box>

      {/* マークダウンエディタ本体 (@uiw/react-md-editor) */}
      <Box
        data-color-mode="light"
        sx={{
          flexGrow: 1,
          height: 'calc(100% - 48px)',
          overflow: 'hidden',
          '& .w-md-editor': {
            '--md-editor-font-family': 'Consolas, Monaco, "Courier New", monospace !important',
            height: '100% !important',
            boxShadow: 'none',
            border: 'none',
            borderRadius: 0,
          },
          '& .w-md-editor-toolbar': {
            bgcolor: 'grey.100',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 1,
            py: 0.5,
          },
          '& .w-md-editor-content': {
            height: 'calc(100% - 40px) !important',
          },
          '& .w-md-editor-area': {
            borderRight: '1px solid',
            borderColor: 'divider',
          },
          // textarea と syntax highlight (pre > code) のフォント・行間・文字間を完全に統一してズレを解消
          '& .w-md-editor-text, & .w-md-editor-text-pre, & .w-md-editor-text-input, & .w-md-editor-text-pre > code': {
            fontSize: '14px !important',
            lineHeight: '20px !important',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace !important',
            letterSpacing: 'normal !important',
          },
        }}
      >
        <MDEditor
          value={content}
          onChange={(val) => {
            setContent(val ?? '');
            setIsDirty(true);
          }}
          height="100%"
          preview="live"
        />
      </Box>

      {/* 通知トースト */}
      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={2000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toastMessage?.includes('失敗') ? 'error' : 'success'} variant="filled" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Editor;
