import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
    }
  };

  // Same look as the Login page, using the theme colours.
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>

        <p style={styles.subtitle}>Join Workout Tracker - it's free</p>

        {error && <div style={styles.error} role="alert">{error}</div>}

        {success && (
          <div style={styles.success} role="status">
            Registration successful! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="register-username" style={styles.label}>Username</label>
            <input
              id="register-username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="register-email" style={styles.label}>Email</label>
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="register-password" style={styles.label}>Password</label>
            <input
              id="register-password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button} disabled={submitting || success}>
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Log in here</Link>
        </p>

        <p style={styles.footerText}>
          <Link to="/install" style={styles.link}>📲 Get the app on your phone or computer</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '30px 20px',
    backgroundColor: 'var(--wt-page-background)'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '32px',
    borderRadius: '16px',
    backgroundColor: 'var(--wt-surface)',
    border: '1px solid var(--wt-border)',
    boxShadow: 'var(--wt-shadow)',
    color: 'var(--wt-text-primary)'
  },
  title: {
    margin: 0,
    textAlign: 'center',
    color: 'var(--wt-text-primary)',
    fontSize: '28px'
  },
  subtitle: {
    textAlign: 'center',
    marginTop: '8px',
    marginBottom: '24px',
    color: 'var(--wt-text-secondary)'
  },
  error: {
    padding: '12px',
    marginBottom: '18px',
    borderRadius: '8px',
    backgroundColor: 'var(--wt-danger-soft)',
    color: 'var(--wt-danger)',
    fontSize: '14px'
  },
  success: {
    padding: '12px',
    marginBottom: '18px',
    borderRadius: '8px',
    backgroundColor: 'var(--wt-success-soft)',
    color: 'var(--wt-success)',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },
  label: {
    fontWeight: 600,
    color: 'var(--wt-text-primary)'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--wt-input-border)',
    backgroundColor: 'var(--wt-input-background)',
    color: 'var(--wt-input-text)',
    fontSize: '15px',
    outline: 'none'
  },
  button: {
    marginTop: '5px',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'var(--wt-button-background)',
    color: 'var(--wt-button-text)',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  footerText: {
    marginTop: '18px',
    marginBottom: 0,
    textAlign: 'center',
    color: 'var(--wt-text-secondary)'
  },
  link: {
    color: 'var(--wt-accent)',
    fontWeight: 600,
    textDecoration: 'none'
  }
};

export default Register;
