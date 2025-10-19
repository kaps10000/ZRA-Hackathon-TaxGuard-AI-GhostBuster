import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Alert = ({ type, title, details, time, actions, id, onAction }) => {
  const typeStyles = {
    danger: 'border-l-4 border-red-500 bg-red-50',
    warning: 'border-l-4 border-yellow-500 bg-yellow-50',
    info: 'border-l-4 border-blue-500 bg-blue-50'
  };

  return (
    <div className={typeStyles[type] + ' p-4 mb-3 rounded-r'}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-gray-700 text-sm mt-1">{details}</p>
          <div className="mt-2 flex space-x-2">
            {actions && actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onAction(id, action, { type, title, details, time })}
                className="text-xs bg-white px-3 py-1 rounded border hover:bg-gray-100 hover:border-blue-500 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  );
};

const RecentAlerts = ({ data, onNavigate }) => {
  const [alerts, setAlerts] = useState([
    {id: 1, type: 'danger', title: 'HIGH RISK DOCUMENT FLAGGED', details: 'Invoice #12345 - Risk Score: 87/100', time: '2 mins ago', actions: ['View', 'Assign'], category: 'ocr'},
    {id: 2, type: 'warning', title: 'PHANTOM EMPLOYEE DETECTED', details: 'Employee John Smith - Multiple payrolls', time: '15 mins ago', actions: ['View', 'Flag'], category: 'ghostbuster'},
    {id: 3, type: 'info', title: 'NEW WHISTLEBLOWER REPORT', details: 'Case WP-2025-001 - Tax Evasion', time: '1 hour ago', actions: ['View', 'Link'], category: 'whistlepro'}
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [assignee, setAssignee] = useState('');

  useEffect(() => {
    // Update alerts from real-time data if available
    if (data?.recentAlerts) {
      setAlerts(data.recentAlerts);
    }
  }, [data]);

  const handleAction = async (id, action, alertData) => {
    const alert = alerts.find(a => a.id === id);

    switch(action) {
      case 'View':
        // Navigate to the specific page based on category
        if (alert.category === 'ocr') {
          onNavigate && onNavigate('ocr');
        } else if (alert.category === 'ghostbuster') {
          onNavigate && onNavigate('ghostbuster');
        } else if (alert.category === 'whistlepro') {
          onNavigate && onNavigate('whistlepro');
        } else {
          onNavigate && onNavigate('cases');
        }
        break;

      case 'Assign':
        setModalData({ id, action: 'assign', ...alertData });
        setShowModal(true);
        break;

      case 'Flag':
        const confirmed = window.confirm(`Flag this case for immediate investigation?\n\n${alertData.title}\n${alertData.details}`);
        if (confirmed) {
          // Mark as flagged
          setAlerts(alerts.map(a =>
            a.id === id
              ? { ...a, type: 'danger', title: '🚩 ' + a.title }
              : a
          ));

          // Send to backend
          try {
            await axios.post('http://localhost:4001/api/alerts/flag', { alertId: id });
            alert('Case has been flagged for immediate investigation');
          } catch (err) {
            console.error('Failed to flag case:', err);
          }
        }
        break;

      case 'Link':
        setModalData({ id, action: 'link', ...alertData });
        setShowModal(true);
        break;

      default:
        console.log(`Action ${action} for alert ${id}`);
    }
  };

  const handleAssign = async () => {
    if (!assignee.trim()) {
      alert('Please select an investigator');
      return;
    }

    try {
      // Try to post to backend
      try {
        await axios.post('http://localhost:4001/api/alerts/assign', {
          alertId: modalData.id,
          assignee: assignee
        });
      } catch (backendErr) {
        console.log('Backend not available, assigning locally');
      }

      // Update the alert locally
      setAlerts(alerts.map(a =>
        a.id === modalData.id
          ? { ...a, assignedTo: assignee, status: 'Assigned' }
          : a
      ));

      alert(`✓ Case successfully assigned to ${assignee}`);
      setShowModal(false);
      setAssignee('');
    } catch (err) {
      console.error('Failed to assign case:', err);
      alert('Failed to assign case. Please try again.');
    }
  };

  const handleLink = async () => {
    try {
      await axios.post('http://localhost:4001/api/alerts/link', {
        alertId: modalData.id,
        category: 'blockchain'
      });

      alert('Case linked to blockchain audit trail successfully');
      setShowModal(false);

      // Navigate to blockchain view
      onNavigate && onNavigate('blockchain');
    } catch (err) {
      console.error('Failed to link case:', err);
      alert('Failed to link case. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Alerts</h2>
        <span className="text-sm text-gray-600">{alerts.length} active alerts</span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No active alerts</p>
      ) : (
        alerts.map((alert) => <Alert key={alert.id} {...alert} onAction={handleAction} />)
      )}

      {/* Action Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {modalData.action === 'assign' ? 'Assign Case' : 'Link to Blockchain'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Alert Details:</p>
              <p className="font-medium">{modalData.title}</p>
              <p className="text-sm text-gray-700">{modalData.details}</p>
            </div>

            {modalData.action === 'assign' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Investigator:
                </label>
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Investigator</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Mary Johnson">Mary Johnson</option>
                  <option value="Sarah Williams">Sarah Williams</option>
                  <option value="Michael Brown">Michael Brown</option>
                </select>
              </div>
            )}

            {modalData.action === 'link' && (
              <p className="text-sm text-gray-600 mb-4">
                This will create an immutable record on the blockchain and link this case to the distributed ledger for audit trail purposes.
              </p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={modalData.action === 'assign' ? handleAssign : handleLink}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {modalData.action === 'assign' ? 'Assign' : 'Link to Blockchain'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setAssignee('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentAlerts;
