import React from 'react';

const Alert = ({ type, title, details, time, actions }) => {
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
              <button key={idx} className="text-xs bg-white px-3 py-1 rounded border">
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

const RecentAlerts = () => {
  const alerts = [
    {type: 'danger', title: 'HIGH RISK DOCUMENT FLAGGED', details: 'Invoice #12345 - Risk Score: 87/100', time: '2 mins ago', actions: ['View', 'Assign']},
    {type: 'warning', title: 'PHANTOM EMPLOYEE DETECTED', details: 'Employee John Smith - Multiple payrolls', time: '15 mins ago', actions: ['View', 'Flag']},
    {type: 'info', title: 'NEW WHISTLEBLOWER REPORT', details: 'Case WP-2025-001 - Tax Evasion', time: '1 hour ago', actions: ['View', 'Link']}
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Recent Alerts</h2>
      {alerts.map((alert, idx) => <Alert key={idx} {...alert} />)}
    </div>
  );
};

export default RecentAlerts;
