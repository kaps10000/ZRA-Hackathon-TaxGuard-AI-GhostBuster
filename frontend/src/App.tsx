import { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, TrendingUp, Users, FileText, Brain, BarChart3, Blocks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardApi, ghostbusterApi, whistleproApi, aiRiskApi, predictiveApi } from '@/lib/api';
import type { DashboardSummary, DashboardEvent } from '@/types/api';
import BlockchainExplorer from '@/components/BlockchainExplorer';

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [liveEvents, setLiveEvents] = useState<DashboardEvent[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryData, eventsData, alertsData] = await Promise.all([
        dashboardApi.getSummary().catch(() => null),
        dashboardApi.getLiveEvents().catch(() => []),
        dashboardApi.getAlerts().catch(() => [])
      ]);

      setSummary(summaryData);
      setLiveEvents(eventsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading TaxGuard Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TaxGuard AI GhostBuster</h1>
                <p className="text-sm text-gray-500">Blockchain-Powered Tax Compliance System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                System Online
              </Badge>
              <div className="text-sm text-gray-500">
                Block #{summary?.blockchain.latestBlock || 0}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'blockchain', name: 'Blockchain', icon: Blocks },
              { id: 'ghostbuster', name: 'GhostBuster', icon: Users },
              { id: 'whistlepro', name: 'WhistlePro', icon: FileText },
              { id: 'ai-risk', name: 'AI Risk', icon: Brain },
              { id: 'predictive', name: 'Predictive', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'blockchain' && (
          <BlockchainExplorer />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.blockchain.totalEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.activity.last24h || 0} in last 24h
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{summary?.alerts.critical || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.alerts.high || 0} high priority
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blockchain Blocks</CardTitle>
                  <Shield className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.blockchain.totalBlocks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Chain integrity: {summary?.blockchain.chainValid ? 'Valid' : 'Invalid'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events/Hour</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.activity.eventsPerHour || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary?.activity.lastHour || 0} this hour
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Module Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Module Activity (24h)</CardTitle>
                  <CardDescription>Events processed by each module</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary?.modules && Object.entries(summary.modules).map(([module, count]) => (
                      <div key={module} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="capitalize font-medium">{module}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Live Event Stream</CardTitle>
                  <CardDescription>Real-time system activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {liveEvents.length > 0 ? liveEvents.map((event) => (
                      <div key={event.eventId} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                        <span className="text-lg">{event.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.summary}
                          </p>
                          <p className="text-xs text-gray-500">{event.timeAgo}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${getSeverityColor(event.severity)} text-white border-0`}
                        >
                          {event.severity}
                        </Badge>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent events</p>
                        <p className="text-xs">Events will appear here as they occur</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts */}
            {alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Critical Alerts</span>
                  </CardTitle>
                  <CardDescription>Alerts requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-red-900">{alert.message}</p>
                          <p className="text-sm text-red-700">{alert.module} • {alert.timeAgo}</p>
                        </div>
                        <Badge variant="destructive">{alert.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Module-specific content would go here */}
        {activeTab !== 'dashboard' && (
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">{activeTab} Module</CardTitle>
              <CardDescription>
                {activeTab === 'ghostbuster' && 'Phantom employee and ghost company detection system'}
                {activeTab === 'whistlepro' && 'Anonymous whistleblower reporting platform'}
                {activeTab === 'ai-risk' && 'AI-powered risk assessment and scoring'}
                {activeTab === 'predictive' && 'Predictive analytics and forecasting'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Module Interface Coming Soon</h3>
                <p className="text-gray-500">
                  The {activeTab} module interface is being developed by the team.
                  <br />
                  API endpoints are ready and documented in the integration guide.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
