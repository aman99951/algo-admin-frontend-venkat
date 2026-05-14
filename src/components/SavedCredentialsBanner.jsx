import { Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function SavedCredentialsBanner({ credentialCount }) {
  const navigate = useNavigate();

  if (credentialCount === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '8px',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Database size={24} color="#4ade80" />
        <div>
          <strong style={{ color: '#86efac', display: 'block' }}>
            Saved Credentials Available
          </strong>
          <p style={{ margin: 0, color: '#86efac', fontSize: '0.9rem' }}>
            You have {credentialCount} saved broker credential(s) in PostgreSQL
          </p>
        </div>
      </div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/credentials')}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#60a5fa',
          cursor: 'pointer',
          fontWeight: '500',
        }}
      >
        Manage Credentials
      </button>
    </div>
  );
}

export default SavedCredentialsBanner;
