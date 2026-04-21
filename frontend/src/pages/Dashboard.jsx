import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, LogOut, Layout, Clock, User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newCardInputs, setNewCardInputs] = useState({});
  const [activeBoardId, setActiveBoardId] = useState(null);
  
  // ÚJ: Állapot a bejelentkezett felhasználónak
  const [currentUser, setCurrentUser] = useState(null); 
  const navigate = useNavigate();

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  useEffect(() => {
    fetchBoards();
    fetchCurrentUser(); // ÚJ: Felhasználó lekérése indításkor

    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8000/ws/sync?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === "update") {
         fetchBoards(); 
      }
    };

    return () => ws.close();
  }, []);

  // --- ÚJ: Felhasználó lekérése az API-ból ---
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Hiba a felhasználó lekérésekor:", error);
    }
  };

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards/');
      setBoards(response.data);
      if (!activeBoardId && response.data.length > 0) {
        setActiveBoardId(response.data[0].id);
      }
    } catch (error) {
      console.error("Hiba a táblák lekérésekor:", error);
    }
  };

  // --- TÁBLA MŰVELETEK ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    try {
      await api.post('/boards/', { title: newBoardTitle });
      setNewBoardTitle('');
      fetchBoards();
    } catch (error) {
      console.error("Hiba a tábla létrehozásakor:", error);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm("Biztosan törlöd ezt a táblát?")) return;
    try {
      await api.delete(`/boards/${boardId}`);
      if (activeBoardId === boardId) setActiveBoardId(null);
      fetchBoards();
    } catch (error) {
      console.error("Hiba a tábla törlésekor:", error);
    }
  };

  // --- OSZLOP MŰVELETEK ---
  const handleCreateColumn = async () => {
    const title = window.prompt("Új oszlop neve:");
    if (!title || !title.trim()) return;
    
    try {
      await api.post('/columns/', { title: title, board_id: activeBoard.id });
      fetchBoards();
    } catch (error) {
      console.error("Hiba az oszlop létrehozásakor:", error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm("Biztosan törlöd ezt az oszlopot az összes kártyájával együtt?")) return;
    try {
      await api.delete(`/columns/${columnId}`);
      fetchBoards();
    } catch (error) {
      console.error("Hiba az oszlop törlésekor:", error);
    }
  };

  // --- KÁRTYA MŰVELETEK ---
  const handleCreateCard = async (columnId) => {
    const title = newCardInputs[columnId];
    if (!title || !title.trim()) return;
    
    try {
      await api.post('/cards/', { title: title, column_id: columnId });
      setNewCardInputs({ ...newCardInputs, [columnId]: '' });
      fetchBoards();
    } catch (error) {
      console.error("Hiba a kártya létrehozásakor:", error);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Törlöd ezt a kártyát?")) return;
    try {
      await api.delete(`/cards/${cardId}`);
      fetchBoards();
    } catch (error) {
      console.error("Hiba a kártya törlésekor:", error);
    }
  };

  // --- DRAG AND DROP ---
  const onDragStart = (e, cardId, sourceColumnId) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColumnId', sourceColumnId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetColumnId) => {
    const cardId = e.dataTransfer.getData('cardId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
    
    if (!cardId || sourceColumnId === targetColumnId) return;

    try {
      await api.put(`/cards/${cardId}`, { column_id: targetColumnId });
      fetchBoards();
    } catch (error) {
      console.error("Hiba a kártya mozgatásakor:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="flex flex-col shrink-0 w-64 bg-white border-r border-slate-200">
        <div className="flex items-center gap-3 p-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">SyncBoard</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">Tábláim</div>
          
          {boards.length === 0 && <div className="px-2 text-sm text-gray-400">Nincs még táblád.</div>}
          
          {boards.map(board => (
            <button
              key={board.id}
              onClick={() => setActiveBoardId(board.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all group ${
                activeBoard?.id === board.id 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="truncate">{board.title}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}
                className="p-1 transition-opacity opacity-0 group-hover:opacity-100 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
          
          <form onSubmit={handleCreateBoard} className="px-2 mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Új tábla..."
                className="w-full py-2 pl-3 pr-8 text-sm transition-all border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
              />
              <button type="submit" className="absolute text-slate-400 right-2 top-1/2 -translate-y-1/2 hover:text-indigo-600">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>
        </nav>

        {/* ÚJ: Felhasználói profil és Kijelentkezés rész */}
        <div className="p-4 border-t border-slate-100">
          {currentUser && (
            <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-md bg-slate-50">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bejelentkezve</p>
                <p className="text-sm font-medium truncate text-slate-700" title={currentUser.email}>
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2 transition-all rounded-md text-slate-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Kijelentkezés</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-8 bg-white border-b shrink-0 border-slate-200">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">
              {activeBoard ? activeBoard.title : 'Válassz vagy hozz létre egy táblát'}
            </h1>
          </div>
          
          {activeBoard && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded text-slate-500 bg-slate-100">
                <Clock className="w-3 h-3" />
                <span>Szinkronizálva</span>
              </div>
            </div>
          )}
        </header>

        {/* Board Area */}
        <div className="flex items-start flex-1 gap-6 p-8 overflow-x-auto">
          <AnimatePresence mode="popLayout">
            {activeBoard?.columns?.map(column => (
              <motion.div 
                key={column.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col shrink-0 w-80 max-h-full border rounded-xl bg-slate-100/50 border-slate-200/60"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, column.id)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-wider uppercase text-slate-700">{column.title}</h3>
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {column.cards?.length || 0}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteColumn(column.id)}
                    className="text-slate-400 hover:text-red-500"
                    title="Oszlop törlése"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto min-h-[100px]">
                  {column.cards?.map(card => (
                    <motion.div
                      key={card.id}
                      layout
                      draggable
                      onDragStart={(e) => onDragStart(e, card.id, column.id)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98, cursor: 'grabbing' }}
                      className="relative p-4 bg-white border rounded-lg shadow-sm cursor-grab group border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter bg-amber-50 text-amber-600">
                          Feladat
                        </div>
                        <button 
                          onClick={() => handleDeleteCard(card.id)}
                          className="transition-all opacity-0 text-slate-300 group-hover:opacity-100 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <p className="text-sm font-medium leading-relaxed text-slate-700">{card.title}</p>
                      
                      <div className="absolute left-0 w-1 h-8 transition-opacity opacity-0 top-1/2 -translate-y-1/2 bg-indigo-500 rounded-r-full group-hover:opacity-100" />
                    </motion.div>
                  ))}
                </div>

                <div className="p-3 mt-auto">
                  <div className="relative group/input">
                    <input
                      type="text"
                      placeholder="Új kártya..."
                      className="w-full py-2 pl-3 pr-10 text-sm transition-all border border-transparent rounded-lg bg-white/50 focus:bg-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
                      value={newCardInputs[column.id] || ''}
                      onChange={(e) => setNewCardInputs({ ...newCardInputs, [column.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCard(column.id)}
                    />
                    <button 
                      onClick={() => handleCreateCard(column.id)}
                      className="absolute p-1 transition-all rounded right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {activeBoard && (
            <button 
              onClick={handleCreateColumn}
              className="flex items-center justify-center h-12 gap-2 transition-all border-2 border-dashed shrink-0 w-80 border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 group"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-semibold">Új oszlop</span>
            </button>
          )}

        </div>
      </main>
    </div>
  );
}