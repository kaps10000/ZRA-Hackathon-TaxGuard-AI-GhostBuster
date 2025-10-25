import React, { useState, useEffect } from 'react';
import { Eye, UserPlus, Flag, Link, AlertTriangle, Info, AlertCircle, X, Check } from 'lucide-react';

const Alert = ({ type, title, details, time, actions, id, onAction, assignedTo, status }) => {
  const typeConfig = {
    danger: {
      bg: 'bg-red-50 hover:bg-red-100',
      border: 'border-l-red-500',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      badge: 'bg-red-100 text-red-700'
    },
    warning: {
      bg: 'bg-amber-50 hover:bg-amber-100',
      border: 'border-l-amber-500',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700'
    },
    info: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-l-blue-500',
      icon: Info,
      iconColor: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  const actionIcons = {
    'View': Eye,
    'Assign': UserPlus,
    'Flag': Flag,
    'Link': Link
  };

  return (
    <div className={`${config.bg} ${config.border} border-l-4 rounded-lg p-4 transition-all duration-200 group`}>
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`${config.iconColor} mt-0.5 flex-shrink-0`}>
          <Icon size={20} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight">
              {title}
            </h4>
            <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            {details}
          </p>

          {/* Status Badge */}
          {status && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Check size={12} />
                {status} {assignedTo && `to ${assignedTo}`}
              </span>
            </div>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const ActionIcon = actionIcons[action];
                return (
                  <button
                    key={action}
                    onClick={() => onAction(id, action, { type, title, details, time })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    {ActionIcon && <ActionIcon size={14} />}
                    {action}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RecentAlerts = ({ data, onNavigate }) => {
  const [alerts, setAlerts] = useState([
    {id: 1, type: 'danger', title: 'High Risk Document Flagged', details: 'Invoice #12345 shows potential fraud indicators with a risk score of 87/100', time: '2 mins ago', actions: ['View', 'Assign'], category: 'ocr'},
    {id: 2, type: 'warning', title: 'Phantom Employee Detected', details: 'Employee John Smith appears on multiple payrolls across different companies', time: '15 mins ago', actions: ['View', 'Flag'], category: 'ghostbuster'},
    {id: 3, type: 'info', title: 'New Whistleblower Report', details: 'Case WP-2025-001 regarding suspected tax evasion scheme', time: '1 hour ago', actions: ['View', 'Link'], category: 'whistlepro'}
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (data?.recentAlerts) {
      setAlerts(data.recentAlerts);
    }
  }, [data]);

  const handleAction = async (id, action, alertData) => {
    const alert = alerts.find(a => a.id === id);

    switch(action) {
      case 'View':
        if (alert.category === 'ocr') {
          onNavigate?.('ocr');
        } else if (alert.category === 'ghostbuster') {
          onNavigate?.('ghostbuster');
        } else if (alert.category === 'whistlepro') {
          onNavigate?.('whistlepro');
        } else {
          onNavigate?.('cases');
        }
        break;

      case 'Assign':
        setModalData({ id, action: 'assign', ...alertData });
        setShowModal(true);
        break;

      case 'Flag':
        setModalData({ id, action: 'flag', ...alertData });
        setShowModal(true);
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
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setAlerts(alerts.map(a =>
        a.id === modalData.id
          ? { ...a, assignedTo: assignee, status: 'Assigned', actions: ['View'] }
          : a
      ));

      setShowModal(false);
      setAssignee('');
    } catch (err) {
      console.error('Failed to assign case:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlag = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setAlerts(alerts.map(a =>
        a.id === modalData.id
          ? { ...a, type: 'danger', title: '🚩 ' + a.title, status: 'Flagged' }
          : a
      ));

      setShowModal(false);
    } catch (err) {
      console.error('Failed to flag case:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLink = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowModal(false);
      onNavigate?.('blockchain');
    } catch (err) {
      console.error('Failed to link case:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalAction = () => {
    if (modalData.action === 'assign') {
      handleAssign();
    } else if (modalData.action === 'flag') {
      handleFlag();
    } else if (modalData.action === 'link') {
      handleLink();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <AlertTriangle className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Alerts</h2>
              <p className="text-xs text-gray-600">{alerts.length} active alerts requiring attention</p>
            </div>
          </div>
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-gray-100 rounded-full mb-3">
              <Check className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-500 font-medium">No active alerts</p>
            <p className="text-sm text-gray-400 mt-1">All cases have been addressed</p>
          </div>
        ) : (
          alerts.map((alert) => <Alert key={alert.id} {...alert} onAction={handleAction} />)
        )}
      </div>

      {/* Action Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {modalData.action === 'assign' && 'Assign Case'}
                {modalData.action === 'flag' && 'Flag for Investigation'}
                {modalData.action === 'link' && 'Link to Blockchain'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setAssignee('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Alert Details */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Alert Details</p>
                <p className="font-semibold text-gray-900 mb-1">{modalData.title}</p>
                <p className="text-sm text-gray-700">{modalData.details}</p>
              </div>

              {/* Assign Form */}
              {modalData.action === 'assign' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Investigator
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select an investigator...</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Mary Johnson">Mary Johnson</option>
                    <option value="Sarah Williams">Sarah Williams</option>
                    <option value="Michael Brown">Michael Brown</option>
                  </select>
                </div>
              )}

              {/* Flag Confirmation */}
              {modalData.action === 'flag' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    This will flag the case for immediate investigation and notify the review team.
                  </p>
                </div>
              )}

              {/* Link Info */}
              {modalData.action === 'link' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This will create an immutable record on the blockchain and link this case to the distributed ledger for audit trail purposes.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false);
                  setAssignee('');
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleModalAction}
                disabled={isProcessing || (modalData.action === 'assign' && !assignee.trim())}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    {modalData.action === 'assign' && 'Assign Case'}
                    {modalData.action === 'flag' && 'Flag Case'}
                    {modalData.action === 'link' && 'Link to Blockchain'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentAlerts;