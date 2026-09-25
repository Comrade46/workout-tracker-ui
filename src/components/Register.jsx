import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Send new user data to Spring Boot
      await api.post('/auth/register', {
        username,
        email,
        password
      });
      
      setSuccess(true);
      setError('');
      
      // Send them to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      // Backend sends 409 for duplicates and 400 with field messages for validation
      const data = err.response?.data;
      const validationMessages = data?.validationErrors
        ? Object.values(data.validationErrors).join(' ')
        : '';

      setError(
        validationMessages ||
        data?.message ||
        err.userMessage ||
        'Registration failed. Please try again.'
      );
      setSuccess(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2>Create an Account</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Registration successful! Redirecting to login...</p>}
      
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required
          style={{ padding: '10px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        Already have an account? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Log in here</Link>
      </p>

      <p style={{ marginTop: '10px' }}>
        <Link to="/install" style={{ color: '#007bff', textDecoration: 'none' }}>📲 Get the app on your phone or computer</Link>
      </p>
    </div>
  );
};

export default Register;