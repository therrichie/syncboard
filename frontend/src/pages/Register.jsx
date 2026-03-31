import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', {
        email: email,
        password: password,
        full_name: fullName
      });
      
      alert('Sikeres regisztráció! Most már bejelentkezhetsz.');
      navigate('/login'); // Sikeres regisztráció után átirányítjuk a bejelentkezéshez
    } catch (error) {
      // Ha a backend hibaüzenetet küld (pl. "Email already registered"), azt kiírjuk
      const errorMsg = error.response?.data?.detail || 'Hiba történt!';
      alert(`Regisztráció sikertelen: ${errorMsg}`);
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center">SyncBoard Regisztráció</h2>
        
        <input
          type="text"
          placeholder="Teljes név (opcionális)"
          className="w-full p-2 mb-4 border rounded"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Jelszó"
          className="w-full p-2 mb-4 border rounded"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button type="submit" className="w-full p-2 mb-4 text-white bg-green-500 rounded hover:bg-green-600">
          Regisztráció
        </button>
        
        <div className="text-center">
          <span className="text-sm text-gray-600">Már van fiókod? </span>
          <Link to="/login" className="text-sm text-blue-500 hover:underline">
            Jelentkezz be!
          </Link>
        </div>
      </form>
    </div>
  );
}