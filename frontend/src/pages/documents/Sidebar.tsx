import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  Collapse,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import DeleteIcon from '@mui/icons-material/Delete';

import { documentsApi } from '../../api/documents';
import type { DocumentListItem, DocumentType } from '../../../../shared/types/documents';

export interface TreeNode extends DocumentListItem {
  children?: TreeNode[];
  loaded?: boolean;
}

interface SidebarProps {
  selectedDocId: number | null;
  onSelectDoc: (id: number) => void;
  refreshTrigger: number;
  onTreeChange: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDocId,
  onSelectDoc,
  refreshTrigger,
  onTreeChange,
}) => {
  const [rootItems, setRootItems] = useState<TreeNode[]>([]);
  // 展開中のフォルダIDのセット
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  // フォルダIDごとの子要素キャッシュ
  const [folderChildrenMap, setFolderChildrenMap] = useState<Map<number, TreeNode[]>>(new Map());
  // 読み込み中フォルダのセット
  const [loadingFolders, setLoadingFolders] = useState<Set<number>>(new Set());
  const [loadingRoot, setLoadingRoot] = useState(false);

  // コンテキストメニュー状態
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<TreeNode | null>(null);

  // ダイアログ状態
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    type: DocumentType;
    parentId: number | null;
    parentName?: string;
  }>({
    open: false,
    type: 'document',
    parentId: null,
  });
  const [createName, setCreateName] = useState('');

  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    item: TreeNode | null;
  }>({
    open: false,
    item: null,
  });
  const [renameValue, setRenameValue] = useState('');

  const [moveDialog, setMoveDialog] = useState<{
    open: boolean;
    item: TreeNode | null;
  }>({
    open: false,
    item: null,
  });
  const [moveTargetParentId, setMoveTargetParentId] = useState<number | null>(null);
  const [allFolders, setAllFolders] = useState<{ id: number; name: string }[]>([]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: TreeNode | null;
  }>({
    open: false,
    item: null,
  });

  // ルート階層読み込み
  const loadRootItems = useCallback(async () => {
    setLoadingRoot(true);
    try {
      const items = await documentsApi.getDocuments(null);
      setRootItems(
        items.map((item) => ({
          ...item,
          children: item.type === 'folder' ? [] : undefined,
          loaded: false,
        }))
      );
    } catch (err) {
      console.error('Failed to load root documents:', err);
    } finally {
      setLoadingRoot(false);
    }
  }, []);

  // フォルダの子要素読み込み
  const loadChildren = useCallback(async (folderId: number): Promise<TreeNode[]> => {
    setLoadingFolders((prev) => new Set(prev).add(folderId));
    try {
      const children = await documentsApi.getDocuments(folderId);
      const childNodes: TreeNode[] = children.map((item) => ({
        ...item,
        children: item.type === 'folder' ? [] : undefined,
        loaded: false,
      }));
      setFolderChildrenMap((prev) => new Map(prev).set(folderId, childNodes));
      return childNodes;
    } catch (err) {
      console.error(`Failed to load children for folder ${folderId}:`, err);
      return [];
    } finally {
      setLoadingFolders((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    loadRootItems();
  }, [loadRootItems, refreshTrigger]);

  // フォルダのトグル（開閉）
  const handleToggleFolder = async (folderId: number) => {
    const isExpanded = expandedFolders.has(folderId);
    if (isExpanded) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    } else {
      setExpandedFolders((prev) => new Set(prev).add(folderId));
      // キャッシュがなければ読み込む
      if (!folderChildrenMap.has(folderId)) {
        await loadChildren(folderId);
      }
    }
  };

  // メニュー表示
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, item: TreeNode) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuTarget(item);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuTarget(null);
  };

  // 全フォルダ一覧の収集（移動ダイアログ用）
  const collectFolders = useCallback((): { id: number; name: string }[] => {
    const list: { id: number; name: string }[] = [];
    const traverse = (parentId: number | null, pathPrefix: string = '') => {
      const items = parentId === null ? rootItems : folderChildrenMap.get(parentId) ?? [];
      for (const item of items) {
        if (item.type === 'folder') {
          if (menuTarget && item.id === menuTarget.id) continue;
          const currentPath = pathPrefix ? `${pathPrefix} / ${item.name}` : item.name;
          list.push({ id: item.id, name: currentPath });
          traverse(item.id, currentPath);
        }
      }
    };
    traverse(null);
    return list;
  }, [rootItems, folderChildrenMap, menuTarget]);

  // 新規作成ダイアログを開く
  const handleOpenCreateDialog = (type: DocumentType, parentId: number | null, parentName?: string) => {
    setCreateDialog({ open: true, type, parentId, parentName });
    setCreateName(type === 'folder' ? '新規フォルダ' : '新規文書');
    handleCloseMenu();
  };

  // 新規作成実行
  const handleConfirmCreate = async () => {
    const trimmed = createName.trim();
    if (!trimmed) return;

    try {
      const created = await documentsApi.createDocument({
        name: trimmed,
        type: createDialog.type,
        parentId: createDialog.parentId,
        content: createDialog.type === 'document' ? '# ' + trimmed + '\n\n' : undefined,
      });

      setCreateDialog({ open: false, type: 'document', parentId: null });
      setCreateName('');
      onTreeChange();

      // 親フォルダ配下の場合
      if (createDialog.parentId !== null) {
        // 親フォルダを開く
        setExpandedFolders((prev) => new Set(prev).add(createDialog.parentId!));
        // 親フォルダの子要素を再読み込み
        await loadChildren(createDialog.parentId);
      } else {
        await loadRootItems();
      }

      // 新規作成した文書を即座に開く
      if (created.type === 'document') {
        onSelectDoc(created.id);
      }
    } catch (err) {
      console.error('Failed to create document/folder:', err);
    }
  };

  // 名前変更ダイアログを開く
  const handleOpenRenameDialog = () => {
    if (!menuTarget) return;
    setRenameDialog({ open: true, item: menuTarget });
    setRenameValue(menuTarget.name);
    handleCloseMenu();
  };

  // 名前変更実行
  const handleConfirmRename = async () => {
    if (!renameDialog.item) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    try {
      await documentsApi.updateDocument(renameDialog.item.id, { name: trimmed });
      const parentId = renameDialog.item.parentId;
      setRenameDialog({ open: false, item: null });
      onTreeChange();

      if (parentId) {
        await loadChildren(parentId);
      } else {
        await loadRootItems();
      }
    } catch (err) {
      console.error('Failed to rename:', err);
    }
  };

  // 複製実行
  const handleDuplicate = async () => {
    if (!menuTarget) return;
    const item = menuTarget;
    handleCloseMenu();

    try {
      const duplicated = await documentsApi.duplicateDocument(item.id);
      onTreeChange();
      if (item.parentId) {
        await loadChildren(item.parentId);
      } else {
        await loadRootItems();
      }
      if (duplicated.type === 'document') {
        onSelectDoc(duplicated.id);
      }
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  // 移動ダイアログを開く
  const handleOpenMoveDialog = () => {
    if (!menuTarget) return;
    const folders = collectFolders();
    setAllFolders(folders);
    setMoveTargetParentId(menuTarget.parentId);
    setMoveDialog({ open: true, item: menuTarget });
    handleCloseMenu();
  };

  // 移動実行
  const handleConfirmMove = async () => {
    if (!moveDialog.item) return;
    try {
      await documentsApi.moveDocument(moveDialog.item.id, {
        parentId: moveTargetParentId,
      });
      const oldParentId = moveDialog.item.parentId;
      setMoveDialog({ open: false, item: null });
      onTreeChange();

      if (oldParentId) await loadChildren(oldParentId);
      if (moveTargetParentId) {
        setExpandedFolders((prev) => new Set(prev).add(moveTargetParentId));
        await loadChildren(moveTargetParentId);
      }
      await loadRootItems();
    } catch (err) {
      console.error('Failed to move:', err);
    }
  };

  // 削除ダイアログを開く
  const handleOpenDeleteDialog = () => {
    if (!menuTarget) return;
    setDeleteDialog({ open: true, item: menuTarget });
    handleCloseMenu();
  };

  // 削除実行
  const handleConfirmDelete = async () => {
    if (!deleteDialog.item) return;
    const item = deleteDialog.item;
    try {
      await documentsApi.deleteDocument(item.id);
      setDeleteDialog({ open: false, item: null });
      onTreeChange();

      if (selectedDocId === item.id) {
        onSelectDoc(0);
      }

      if (item.parentId) {
        await loadChildren(item.parentId);
      } else {
        await loadRootItems();
      }
    } catch (err) {
      console.error('Failed to delete document/folder:', err);
    }
  };

  // 再帰的ツリーレンダラー
  const renderItems = (items: TreeNode[], depth: number = 0) => {
    return items.map((item) => {
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders.has(item.id);
      const isSelected = !isFolder && selectedDocId === item.id;
      const children = folderChildrenMap.get(item.id);
      const isLoadingChildren = loadingFolders.has(item.id);

      if (isFolder) {
        return (
          <React.Fragment key={`folder-${item.id}`}>
            <ListItemButton
              onClick={() => handleToggleFolder(item.id)}
              sx={{
                py: 0.35,
                pl: 1 + depth * 1.75,
                pr: 1,
                minHeight: 32,
                borderRadius: 1,
                mb: 0.25,
                '&:hover .more-btn': { opacity: 1 },
              }}
            >
              {/* 開閉アローアイコン */}
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  mr: 0.5,
                  color: 'text.secondary',
                }}
              >
                {isLoadingChildren ? (
                  <CircularProgress size={14} />
                ) : isExpanded ? (
                  <ExpandMoreIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                )}
              </Box>

              {/* フォルダアイコン */}
              {isExpanded ? (
                <FolderOpenIcon fontSize="small" sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
              ) : (
                <FolderIcon fontSize="small" sx={{ color: 'primary.main', mr: 1, fontSize: 18 }} />
              )}

              {/* フォルダ名 */}
              <Typography
                variant="body2"
                noWrap
                sx={{
                  flexGrow: 1,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  userSelect: 'none',
                }}
              >
                {item.name}
              </Typography>

              {/* コンテキストメニューボタン */}
              <IconButton
                size="small"
                className="more-btn"
                onClick={(e) => handleOpenMenu(e, item)}
                sx={{
                  p: 0.25,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <MoreVertIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </ListItemButton>

            {/* 子要素のアニメーション展開 */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {children && children.length > 0 ? (
                <List component="div" disablePadding>
                  {renderItems(children, depth + 1)}
                </List>
              ) : children && children.length === 0 ? (
                <Box sx={{ pl: 3.5 + depth * 1.75, py: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                    (空のフォルダ)
                  </Typography>
                </Box>
              ) : null}
            </Collapse>
          </React.Fragment>
        );
      }

      // 文書ノード
      return (
        <ListItemButton
          key={`doc-${item.id}`}
          onClick={() => onSelectDoc(item.id)}
          selected={isSelected}
          sx={{
            py: 0.35,
            pl: 3 + depth * 1.75,
            pr: 1,
            minHeight: 32,
            borderRadius: 1,
            mb: 0.25,
            bgcolor: isSelected ? 'action.selected' : 'transparent',
            '&:hover .more-btn': { opacity: 1 },
          }}
        >
          <DescriptionOutlinedIcon
            fontSize="small"
            sx={{
              mr: 1,
              fontSize: 18,
              color: isSelected ? 'primary.main' : 'text.secondary',
            }}
          />
          <Typography
            variant="body2"
            noWrap
            sx={{
              flexGrow: 1,
              fontSize: '0.85rem',
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? 'primary.main' : 'text.primary',
            }}
          >
            {item.name}
          </Typography>

          <IconButton
            size="small"
            className="more-btn"
            onClick={(e) => handleOpenMenu(e, item)}
            sx={{
              p: 0.25,
              opacity: 0,
              transition: 'opacity 0.2s',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <MoreVertIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </ListItemButton>
      );
    });
  };

  return (
    <Box
      sx={{
        width: 300,
        minWidth: 260,
        maxWidth: 360,
        height: 'calc(100vh - 120px)',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        pr: 1.5,
        mr: 2,
      }}
    >
      {/* サイドバーヘッダー */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
          文書一覧
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="フォルダを新規作成">
            <IconButton
              size="small"
              onClick={() => handleOpenCreateDialog('folder', null)}
              color="primary"
            >
              <CreateNewFolderIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="文書を新規作成">
            <IconButton
              size="small"
              onClick={() => handleOpenCreateDialog('document', null)}
              color="primary"
            >
              <NoteAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="再読み込み">
            <IconButton
              size="small"
              onClick={() => {
                setFolderChildrenMap(new Map());
                loadRootItems();
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ツリービュー */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {loadingRoot && rootItems.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : rootItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 1 }}>
              ファイルやフォルダがありません。
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<NoteAddIcon fontSize="small" />}
              onClick={() => handleOpenCreateDialog('document', null)}
              sx={{ fontSize: '0.75rem' }}
            >
              文書を作成
            </Button>
          </Box>
        ) : (
          <List component="nav" disablePadding>
            {renderItems(rootItems, 0)}
          </List>
        )}
      </Box>

      {/* コンテキストメニュー */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: { minWidth: 160, boxShadow: 3 },
          },
        }}
      >
        {menuTarget?.type === 'folder' && [
          <MenuItem
            key="add-doc"
            onClick={() => handleOpenCreateDialog('document', menuTarget.id, menuTarget.name)}
            dense
          >
            <ListItemIcon>
              <NoteAddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="文書を新規作成" />
          </MenuItem>,
          <MenuItem
            key="add-folder"
            onClick={() => handleOpenCreateDialog('folder', menuTarget.id, menuTarget.name)}
            dense
          >
            <ListItemIcon>
              <CreateNewFolderIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="フォルダを新規作成" />
          </MenuItem>,
          <Divider key="div-1" />,
        ]}
        <MenuItem onClick={handleOpenRenameDialog} dense>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="名前の変更" />
        </MenuItem>
        <MenuItem onClick={handleDuplicate} dense>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="複製" />
        </MenuItem>
        <MenuItem onClick={handleOpenMoveDialog} dense>
          <ListItemIcon>
            <DriveFileMoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="移動" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenDeleteDialog} dense sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="削除" />
        </MenuItem>
      </Menu>

      {/* 新規作成ダイアログ */}
      <Dialog open={createDialog.open} onClose={() => setCreateDialog((prev) => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          {createDialog.type === 'folder' ? 'フォルダを新規作成' : '文書を新規作成'}
        </DialogTitle>
        <DialogContent>
          {createDialog.parentName && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              作成場所: {createDialog.parentName}
            </Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="名前"
            fullWidth
            size="small"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmCreate();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog((prev) => ({ ...prev, open: false }))} size="small">
            キャンセル
          </Button>
          <Button onClick={handleConfirmCreate} variant="contained" size="small" disabled={!createName.trim()}>
            作成
          </Button>
        </DialogActions>
      </Dialog>

      {/* 名前変更ダイアログ */}
      <Dialog open={renameDialog.open} onClose={() => setRenameDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>名前の変更</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="新しい名前"
            fullWidth
            size="small"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog({ open: false, item: null })} size="small">
            キャンセル
          </Button>
          <Button onClick={handleConfirmRename} variant="contained" size="small" disabled={!renameValue.trim()}>
            変更
          </Button>
        </DialogActions>
      </Dialog>

      {/* 移動ダイアログ */}
      <Dialog open={moveDialog.open} onClose={() => setMoveDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          「{moveDialog.item?.name}」の移動先を選択
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel id="move-parent-select-label">移動先フォルダ</InputLabel>
            <Select
              labelId="move-parent-select-label"
              value={moveTargetParentId === null ? '' : String(moveTargetParentId)}
              label="移動先フォルダ"
              onChange={(e) => {
                const val = e.target.value;
                setMoveTargetParentId(val === '' ? null : Number(val));
              }}
            >
              <MenuItem value="">
                <em>/ (ルート階層)</em>
              </MenuItem>
              {allFolders.map((f) => (
                <MenuItem key={f.id} value={String(f.id)}>
                  {f.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialog({ open: false, item: null })} size="small">
            キャンセル
          </Button>
          <Button onClick={handleConfirmMove} variant="contained" size="small">
            移動する
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'error.main' }}>
          {deleteDialog.item?.type === 'folder' ? 'フォルダの削除' : '文書の削除'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>
            「{deleteDialog.item?.name}」を削除してもよろしいですか？
            {deleteDialog.item?.type === 'folder' && (
              <Typography component="span" sx={{ display: 'block', mt: 1, color: 'error.main', fontWeight: 'bold' }}>
                ※ フォルダ内のすべての文書およびサブフォルダも完全に削除されます。
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })} size="small">
            キャンセル
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
