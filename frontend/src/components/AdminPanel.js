import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [editingActivity, setEditingActivity] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      loadActivities();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    try {
      // Use API base URL from environment or default to relative path
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
      
      // Test the password by making an authenticated request
      const response = await fetch(`${apiBaseUrl}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify({ activities: [] }) // Dummy data just to test auth
      });

      if (response.ok) {
        localStorage.setItem('adminToken', password);
        setIsAuthenticated(true);
        setAuthError('');
        loadActivities();
      } else {
        setAuthError('Neplatné heslo');
      }
    } catch (error) {
      setAuthError('Chyba při přihlašování');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setActivities([]);
    setPassword('');
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Use API base URL from environment or default to relative path
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
      
      // Fetch unprotected data for admin editing
      const response = await fetch(`${apiBaseUrl}/api/activities?admin=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        console.error('Failed to load activities:', response.status);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveActivities = async () => {
    try {
      setSaveStatus('Ukládám...');
      const token = localStorage.getItem('adminToken');
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '';
      
      const response = await fetch(`${apiBaseUrl}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activities })
      });

      if (response.ok) {
        setSaveStatus('✅ Uloženo!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('❌ Chyba při ukládání');
      }
    } catch (error) {
      setSaveStatus('❌ Chyba při ukládání');
      console.error('Error saving activities:', error);
    }
  };

  const addActivity = () => {
    const newActivity = {
      id: Math.max(0, ...activities.map(a => a.id)) + 1,
      title: '',
      short_description: '',
      long_description: '',
      tags: [],
      location: [],
      education_level: [],
      thumbnail_url: ''
    };
    setActivities([...activities, newActivity]);
    setEditingActivity(newActivity.id);
    setShowAddForm(false);
  };

  const deleteActivity = (id) => {
    if (window.confirm('Opravdu chcete smazat tuto aktivitu?')) {
      setActivities(activities.filter(a => a.id !== id));
    }
  };

  const updateActivity = (id, field, value) => {
    setActivities(activities.map(activity => 
      activity.id === id 
        ? { ...activity, [field]: value }
        : activity
    ));
  };

  const updateArrayField = (id, field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    updateActivity(id, field, arrayValue);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-form">
          <h2>Admin Panel - Přihlášení</h2>
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button onClick={handleLogin}>Přihlásit</button>
          {authError && <p className="error">{authError}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="admin-loading">Načítám...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel - Správa aktivit</h1>
        <div className="admin-actions">
          <span>Aktivit: {activities.length}</span>
          <button onClick={saveActivities} className="save-btn">
            Uložit změny
          </button>
          <button onClick={addActivity} className="add-btn">
            Přidat aktivitu
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Odhlásit
          </button>
        </div>
        {saveStatus && <div className="save-status">{saveStatus}</div>}
      </div>

      <div className="activities-admin-list">
        {activities.map(activity => (
          <div key={activity.id} className="activity-admin-item">
            <div className="activity-admin-header">
              <h3>#{activity.id} {activity.title || 'Nová aktivita'}</h3>
              <div className="activity-actions">
                <button 
                  onClick={() => setEditingActivity(editingActivity === activity.id ? null : activity.id)}
                  className="edit-btn"
                >
                  {editingActivity === activity.id ? 'Zavřít' : 'Editovat'}
                </button>
                <button 
                  onClick={() => deleteActivity(activity.id)}
                  className="delete-btn"
                >
                  Smazat
                </button>
              </div>
            </div>

            {editingActivity === activity.id && (
              <div className="activity-edit-form">
                <div className="form-group">
                  <label>Název:</label>
                  <input
                    type="text"
                    value={activity.title}
                    onChange={(e) => updateActivity(activity.id, 'title', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Krátký popis:</label>
                  <textarea
                    value={activity.short_description}
                    onChange={(e) => updateActivity(activity.id, 'short_description', e.target.value)}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Dlouhý popis:</label>
                  <textarea
                    value={activity.long_description}
                    onChange={(e) => updateActivity(activity.id, 'long_description', e.target.value)}
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tagy (oddělené čárkou):</label>
                    <input
                      type="text"
                      value={Array.isArray(activity.tags) ? activity.tags.join(', ') : ''}
                      onChange={(e) => updateArrayField(activity.id, 'tags', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Lokalita (oddělené čárkou):</label>
                    <input
                      type="text"
                      value={Array.isArray(activity.location) ? activity.location.join(', ') : ''}
                      onChange={(e) => updateArrayField(activity.id, 'location', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Úroveň vzdělání (oddělené čárkou):</label>
                    <input
                      type="text"
                      value={Array.isArray(activity.education_level) ? activity.education_level.join(', ') : ''}
                      onChange={(e) => updateArrayField(activity.id, 'education_level', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>URL obrázku:</label>
                    <input
                      type="text"
                      value={activity.thumbnail_url || ''}
                      onChange={(e) => updateActivity(activity.id, 'thumbnail_url', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="no-activities">
          <p>Žádné aktivity. Přidejte první aktivitu.</p>
          <button onClick={addActivity} className="add-first-btn">
            Přidat první aktivitu
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;