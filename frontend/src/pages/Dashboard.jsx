import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom'; // Ezt beimportáltuk a navigációhoz

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newCardInputs, setNewCardInputs] = useState({});
  const navigate = useNavigate(); // Navigációs hook inicializálása

  useEffect(() => {
    fetchBoards();

    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8000/ws/sync?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.action === "update") {
         fetchBoards(); 
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards/');
      setBoards(response.data);
    } catch (error) {
      console.error("Hiba a táblák lekérésekor:", error);
    }
  };

  // --- KIJELENTKEZÉS ---
  const handleLogout = () => {
    localStorage.removeItem('token'); // Töröljük a tokent
    navigate('/login'); // Visszadobjuk a bejelentkezéshez
  };

  // --- TÁBLA MŰVELETEK ---
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
    if (!window.confirm("Biztosan törlöd ezt a táblát az összes kártyájával együtt?")) return;
    try {
      await api.delete(`/boards/${boardId}`);
      fetchBoards();
    } catch (error) {
      console.error("Hiba a tábla törlésekor:", error);
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

  // --- DRAG AND DROP LOGIKA ---
  const onDragStart = (e, cardId) => {
    e.dataTransfer.setData('cardId', cardId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetColumnId) => {
    const cardId = e.dataTransfer.getData('cardId');
    if (!cardId) return;

    try {
      await api.put(`/cards/${cardId}`, { column_id: targetColumnId });
      fetchBoards();
    } catch (error) {
      console.error("Hiba a kártya mozgatásakor:", error);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tábláim</h1>
        
        {/* Felső vezérlőpult a gombokkal */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleCreateBoard} className="flex gap-2">
            <input
              type="text"
              placeholder="Új tábla neve..."
              className="p-2 border rounded shadow-sm outline-none focus:ring-2 focus:ring-blue-400"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
            />
            <button type="submit" className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-600">
              + Új Tábla
            </button>
          </form>
          
          {/* Új Kijelentkezés gomb */}
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 font-bold text-gray-700 transition-colors bg-gray-300 rounded hover:bg-red-500 hover:text-white"
          >
            Kijelentkezés
          </button>
        </div>
      </div>

      <div className="flex gap-6 pb-4 overflow-x-auto">
        {boards.length === 0 ? (
          <p className="italic text-gray-500">Még nincsenek tábláid. Hozz létre egyet fent!</p>
        ) : (
          boards.map(board => (
            <div key={board.id} className="min-w-[320px] p-4 bg-gray-200 rounded-lg shadow-md shrink-0 relative flex flex-col">
              <button 
                onClick={() => handleDeleteBoard(board.id)}
                className="absolute text-red-500 top-4 right-4 hover:text-red-700"
                title="Tábla törlése"
              >
                ✖
              </button>
              <h2 className="mb-4 text-xl font-bold text-gray-700">{board.title}</h2>
              
              <div className="flex flex-col flex-1 gap-4">
                {board.columns?.map(col => (
                  <div 
                    key={col.id} 
                    className="flex flex-col flex-1 p-3 bg-white rounded shadow-sm"
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, col.id)}
                  >
                    <h3 className="pb-1 mb-2 font-semibold text-gray-600 border-b">{col.title}</h3>
                    
                    <div className="flex flex-col flex-1 gap-2 min-h-[50px]">
                      {col.cards?.map(card => (
                        <div 
                          key={card.id} 
                          draggable 
                          onDragStart={(e) => onDragStart(e, card.id)}
                          className="relative p-2 text-sm bg-yellow-100 border border-yellow-300 rounded shadow-sm cursor-grab active:cursor-grabbing hover:bg-yellow-200 group"
                        >
                          {card.title}
                          <button 
                            onClick={() => handleDeleteCard(card.id)}
                            className="absolute hidden text-red-500 right-2 top-2 group-hover:block hover:text-red-700"
                            title="Kártya törlése"
                          >
                            ✖
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1 mt-3">
                      <input 
                        type="text" 
                        placeholder="Új feladat..." 
                        className="w-full p-1 text-sm border rounded outline-none focus:ring-1 focus:ring-blue-400"
                        value={newCardInputs[col.id] || ''}
                        onChange={(e) => setNewCardInputs({ ...newCardInputs, [col.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCard(col.id)}
                      />
                      <button 
                        onClick={() => handleCreateCard(col.id)}
                        className="px-2 text-white bg-green-500 rounded hover:bg-green-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}