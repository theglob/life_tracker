import React, { useState } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { API_URL } from '../config';

const VerwaltungPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackup = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/backup/drive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Backup failed');
      }
      setSuccess('Backup erfolgreich!');
    } catch (err: any) {
      setError(err.message || 'Backup fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" sx={{ fontSize: '1.2rem', mb: 1.5 }}>
        Verwaltung
      </Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button variant="contained" color="primary" onClick={handleBackup} disabled={loading}>
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Daten auf Drive sichern'}
      </Button>
    </Box>
  );
};

export default VerwaltungPage; 