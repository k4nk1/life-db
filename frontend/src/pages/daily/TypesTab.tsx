import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Collapse,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ColorPicker, { PRESET_COLORS } from '../../components/ColorPicker';
import { dailyApi } from '../../api/daily';
import type { ActionType, ActionSubtype } from '../../../../shared/types/daily';

const TypesTab = () => {
  const [types, setTypes] = useState<ActionType[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // ドラッグ＆ドロップ用ステート
  const [draggedTypeIndex, setDraggedTypeIndex] = useState<number | null>(null);
  const [draggedSubtype, setDraggedSubtype] = useState<{ typeId: number; index: number } | null>(null);

  // 大分類追加ダイアログ
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState(PRESET_COLORS[0] ?? '#1976d2');

  // 小分類追加ダイアログ
  const [openSubtypeDialog, setOpenSubtypeDialog] = useState(false);
  const [targetTypeId, setTargetTypeId] = useState<number | null>(null);
  const [newSubtypeName, setNewSubtypeName] = useState('');

  // 分類名編集ダイアログ（大分類・小分類共通）
  const [editTarget, setEditTarget] = useState<{ kind: 'type' | 'subtype'; id: number; name: string } | null>(null);
  const [editName, setEditName] = useState('');

  // エラーメッセージ
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTypes = async () => {
    try {
      const data = await dailyApi.getTypes();
      setTypes(data);
    } catch {
      setErrorMessage('分類一覧の取得に失敗しました');
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- 大分類の作成 ---
  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await dailyApi.createType({
        name: newTypeName.trim(),
        color: newTypeColor,
        sortOrder: types.length,
      });
      setNewTypeName('');
      setOpenTypeDialog(false);
      await fetchTypes();
    } catch {
      setErrorMessage('大分類の作成に失敗しました');
    }
  };

  // --- 大分類の削除 ---
  const handleDeleteType = async (id: number) => {
    try {
      await dailyApi.deleteType(id);
      await fetchTypes();
    } catch {
      setErrorMessage('大分類の削除に失敗しました');
    }
  };

  // --- 大分類の色の変更 ---
  const handleUpdateTypeColor = async (id: number, color: string) => {
    try {
      await dailyApi.updateType(id, { color });
      setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
    } catch {
      setErrorMessage('色の更新に失敗しました');
    }
  };

  // --- 小分類の作成 ---
  const handleOpenAddSubtype = (typeId: number) => {
    setTargetTypeId(typeId);
    setNewSubtypeName('');
    setOpenSubtypeDialog(true);
  };

  const handleCreateSubtype = async () => {
    if (!newSubtypeName.trim() || targetTypeId === null) return;
    const parent = types.find((t) => t.id === targetTypeId);
    const sortOrder = parent?.subtypes ? parent.subtypes.length : 0;
    try {
      await dailyApi.createSubtype({
        name: newSubtypeName.trim(),
        typeId: targetTypeId,
        sortOrder,
      });
      setNewSubtypeName('');
      setOpenSubtypeDialog(false);
      // 自動でその大分類を展開
      setExpandedIds((prev) => ({ ...prev, [targetTypeId]: true }));
      await fetchTypes();
    } catch {
      setErrorMessage('小分類の作成に失敗しました');
    }
  };

  // --- 小分類の削除 ---
  const handleDeleteSubtype = async (subtypeId: number) => {
    try {
      await dailyApi.deleteSubtype(subtypeId);
      await fetchTypes();
    } catch (err: any) {
      if (err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('小分類の削除に失敗しました');
      }
    }
  };

  // --- 分類名の編集 ---
  const handleOpenEditName = (kind: 'type' | 'subtype', id: number, currentName: string) => {
    setEditTarget({ kind, id, name: currentName });
    setEditName(currentName);
  };

  const handleSaveEditName = async () => {
    if (!editTarget || !editName.trim()) return;
    try {
      if (editTarget.kind === 'type') {
        await dailyApi.updateType(editTarget.id, { name: editName.trim() });
      } else {
        await dailyApi.updateSubtype(editTarget.id, { name: editName.trim() });
      }
      setEditTarget(null);
      await fetchTypes();
    } catch {
      setErrorMessage('名称の更新に失敗しました');
    }
  };

  // --- 大分類のドラッグ＆ドロップ ---
  const handleTypeDragStart = (index: number) => {
    setDraggedTypeIndex(index);
  };

  const handleTypeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTypeDrop = async (targetIndex: number) => {
    if (draggedTypeIndex === null || draggedTypeIndex === targetIndex) return;
    const item = types[draggedTypeIndex];
    if (!item) return;

    // 楽観的更新
    const newTypes = [...types];
    const [removed] = newTypes.splice(draggedTypeIndex, 1);
    if (removed) {
      newTypes.splice(targetIndex, 0, removed);
      setTypes(newTypes);
    }
    setDraggedTypeIndex(null);

    try {
      await dailyApi.updateType(item.id, { sortOrder: targetIndex });
      await fetchTypes();
    } catch {
      setErrorMessage('並び替えに失敗しました');
      fetchTypes();
    }
  };

  // --- 小分類のドラッグ＆ドロップ ---
  const handleSubtypeDragStart = (typeId: number, index: number) => {
    setDraggedSubtype({ typeId, index });
  };

  const handleSubtypeDrop = async (targetTypeId: number, targetIndex: number) => {
    if (!draggedSubtype || draggedSubtype.typeId !== targetTypeId || draggedSubtype.index === targetIndex) return;
    const parent = types.find((t) => t.id === targetTypeId);
    const item = parent?.subtypes?.[draggedSubtype.index];
    if (!item) return;

    // 楽観的更新
    const newTypes = types.map((t) => {
      if (t.id === targetTypeId && t.subtypes) {
        const newSubtypes = [...t.subtypes];
        const [removed] = newSubtypes.splice(draggedSubtype.index, 1);
        if (removed) {
          newSubtypes.splice(targetIndex, 0, removed);
        }
        return { ...t, subtypes: newSubtypes };
      }
      return t;
    });
    setTypes(newTypes);
    setDraggedSubtype(null);

    try {
      await dailyApi.updateSubtype(item.id, { sortOrder: targetIndex });
      await fetchTypes();
    } catch {
      setErrorMessage('小分類の並び替えに失敗しました');
      fetchTypes();
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setNewTypeName('');
            setOpenTypeDialog(true);
          }}
        >
          大分類を追加
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#ffffff' }}>
        <Table>
          <TableBody>
            {types.map((type, index) => {
              const isExpanded = Boolean(expandedIds[type.id]);
              return (
                <TypeRow
                  key={type.id}
                  type={type}
                  index={index}
                  isExpanded={isExpanded}
                  onToggleExpand={() => toggleExpand(type.id)}
                  onColorChange={(color) => handleUpdateTypeColor(type.id, color)}
                  onEditName={() => handleOpenEditName('type', type.id, type.name)}
                  onDelete={() => handleDeleteType(type.id)}
                  onAddSubtype={() => handleOpenAddSubtype(type.id)}
                  onEditSubtypeName={(s) => handleOpenEditName('subtype', s.id, s.name)}
                  onDeleteSubtype={(sid) => handleDeleteSubtype(sid)}
                  onDragStart={() => handleTypeDragStart(index)}
                  onDragOver={handleTypeDragOver}
                  onDrop={() => handleTypeDrop(index)}
                  onSubtypeDragStart={handleSubtypeDragStart}
                  onSubtypeDragOver={handleTypeDragOver}
                  onSubtypeDrop={handleSubtypeDrop}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 大分類追加ダイアログ */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>大分類を追加</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            autoFocus
            label="大分類名"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            fullWidth
            size="small"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              カラー:
            </Typography>
            <ColorPicker color={newTypeColor} onChange={setNewTypeColor} size={28} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTypeDialog(false)}>キャンセル</Button>
          <Button onClick={handleCreateType} variant="contained" disabled={!newTypeName.trim()}>
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 小分類追加ダイアログ */}
      <Dialog open={openSubtypeDialog} onClose={() => setOpenSubtypeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>小分類を追加</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            label="小分類名"
            value={newSubtypeName}
            onChange={(e) => setNewSubtypeName(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubtypeDialog(false)}>キャンセル</Button>
          <Button onClick={handleCreateSubtype} variant="contained" disabled={!newSubtypeName.trim()}>
            追加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 分類名編集ダイアログ */}
      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{editTarget?.kind === 'type' ? '大分類名を編集' : '小分類名を編集'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            label="名前"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>キャンセル</Button>
          <Button onClick={handleSaveEditName} variant="contained" disabled={!editName.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* エラー通知 */}
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
    </Box>
  );
};

interface TypeRowProps {
  type: ActionType;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onColorChange: (color: string) => void;
  onEditName: () => void;
  onDelete: () => void;
  onAddSubtype: () => void;
  onEditSubtypeName: (subtype: ActionSubtype) => void;
  onDeleteSubtype: (subtypeId: number) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onSubtypeDragStart: (typeId: number, index: number) => void;
  onSubtypeDragOver: (e: React.DragEvent) => void;
  onSubtypeDrop: (typeId: number, index: number) => void;
}

const TypeRow = ({
  type,
  isExpanded,
  onToggleExpand,
  onColorChange,
  onEditName,
  onDelete,
  onAddSubtype,
  onEditSubtypeName,
  onDeleteSubtype,
  onDragStart,
  onDragOver,
  onDrop,
  onSubtypeDragStart,
  onSubtypeDragOver,
  onSubtypeDrop,
}: TypeRowProps) => {
  const subtypes = type.subtypes ?? [];

  return (
    <>
      <TableRow
        hover
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        sx={{
          '& > *': { borderBottom: 'unset' },
          bgcolor: '#ffffff',
          transition: 'background-color 0.2s',
        }}
      >
        {/* ドラッグハンドル */}
        <TableCell sx={{ width: 40, py: 1, pl: 2, pr: 0 }}>
          <Tooltip title="ドラッグして大分類の順序を変更" arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'grab',
                color: 'action.active',
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </Box>
          </Tooltip>
        </TableCell>

        {/* 展開ボタン */}
        <TableCell sx={{ width: 44, py: 1, px: 0 }}>
          <IconButton size="small" onClick={onToggleExpand} aria-label="展開・折りたたみ">
            {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          </IconButton>
        </TableCell>

        {/* 色（クリックで色変更） */}
        <TableCell sx={{ width: 48, py: 1, px: 1 }}>
          <ColorPicker color={type.color} onChange={onColorChange} size={24} />
        </TableCell>

        {/* 分類名（クリックで名前編集） */}
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <Tooltip title="クリックして大分類名を編集" arrow>
            <Typography
              component="span"
              onClick={onEditName}
              sx={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-block',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                transition: 'background-color 0.15s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  textDecoration: 'underline',
                },
              }}
            >
              {type.name}
            </Typography>
          </Tooltip>
        </TableCell>

        {/* 操作 */}
        <TableCell align="right" sx={{ py: 1, pr: 2 }}>
          <Button size="small" variant="text" startIcon={<AddIcon />} onClick={onAddSubtype} sx={{ mr: 1 }}>
            小分類を追加
          </Button>
          <IconButton size="small" color="error" title="大分類を削除" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* 展開時に下に縦に並ぶ小分類一覧 */}
      <TableRow>
        <TableCell colSpan={5} sx={{ py: 0, px: 0, bgcolor: '#fafafa' }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1, pl: 7, pr: 2 }}>
              <Table size="small" sx={{ bgcolor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <TableBody>
                  {subtypes.map((subtype, sIndex) => (
                    <TableRow
                      key={subtype.id}
                      hover
                      draggable
                      onDragStart={() => onSubtypeDragStart(type.id, sIndex)}
                      onDragOver={onSubtypeDragOver}
                      onDrop={() => onSubtypeDrop(type.id, sIndex)}
                    >
                      {/* 小分類ドラッグハンドル */}
                      <TableCell sx={{ width: 36, py: 0.75, pl: 1.5, pr: 0 }}>
                        <Tooltip title="ドラッグして小分類の順序を変更" arrow>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'grab',
                              color: 'action.active',
                              '&:active': { cursor: 'grabbing' },
                            }}
                          >
                            <DragIndicatorIcon fontSize="small" sx={{ fontSize: 18 }} />
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* 小分類名（クリックで名前編集） */}
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <Tooltip title="クリックして小分類名を編集" arrow>
                          <Typography
                            component="span"
                            onClick={() => onEditSubtypeName(subtype)}
                            sx={{
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              display: 'inline-block',
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'action.hover',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {subtype.name}
                          </Typography>
                        </Tooltip>
                      </TableCell>

                      {/* 小分類操作 */}
                      <TableCell align="right" sx={{ py: 0.75, pr: 1.5 }}>
                        <IconButton
                          size="small"
                          color="error"
                          title="小分類を削除"
                          onClick={() => onDeleteSubtype(subtype.id)}
                        >
                          <DeleteIcon fontSize="small" sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subtypes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ py: 1.5, textAlign: 'center', color: 'text.secondary' }}>
                        小分類がまだありません。「小分類を追加」から登録してください。
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default TypesTab;
