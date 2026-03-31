import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await api.post('/token', params);
      
      // Token elmentése
      localStorage.setItem('token', response.data.access_token);
      alert('Sikeres bejelentkezés!');
      navigate('/dashboard'); // Átirányítás a táblákhoz
    } catch (error) {
      alert('Hibás email vagy jelszó!');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-center">SyncBoard Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Jelszó"
          className="w-full p-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600">
          Bejelentkezés
        </button>
        
        <div className="text-center">
          <span className="text-sm text-gray-600">Nincs még fiókod? </span>
          <Link to="/register" className="text-sm text-blue-500 hover:underline">
            Regisztrálj!
          </Link>
        </div>
      </form>
    </div>
  );
}