import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PredictiveAnalytics = () => {
  const [activeTab, setActiveTab] = useState('forecast');
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [copperScenario, setCopperScenario] = useState(null);
  const [complianceScenario, setComplianceScenario] = useState(null);
  const [error, setError] = useState(null);

  // Form states
  const [forecastMonths, setForecastMonths] = useState(6);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5003/revenue-forecast?months=${forecastMonths}`);
      setForecast(response.data);
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err.response?.data?.error || 'Unable to connect to Predictive Analytics service');
      // Set mock data as fallback
      setForecast({
        current_revenue: 145000000,
        forecasts: Array.from({ length: forecastMonths }, (_, i) => ({
          month: i + 1,
          forecast: 145000000 * (1 + (i + 1) * 0.03),
          confidence_level: 78,
          confidence_lower: 145000000 * (1 + (i + 1) * 0.03) * 0.9,
          confidence_upper: 145000000 * (1 + (i + 1) * 0.03) * 1.1
        }))
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeCopperImpact = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use realistic market volatility scenario: -5% copper price projection
      // Based on historical LME copper price fluctuations
      const response = await axios.post('http://localhost:5003/copper-impact', {
        price_change_percent: -5
      });
      setCopperScenario(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze copper impact');
    } finally {
      setLoading(false);
    }
  };

  const analyzeComplianceImpact = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use 5% improvement as baseline forecast with current market factors
      const response = await axios.post('http://localhost:5003/scenario-analysis', {
        compliance_change_percent: 5
      });
      setComplianceScenario(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze compliance impact');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'forecast') {
      fetchForecast();
    } else if (activeTab === 'copper') {
      analyzeCopperImpact();
    } else if (activeTab === 'compliance') {
      analyzeComplianceImpact();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return `ZMW ${(amount / 1000000).toFixed(2)}M`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Predictive Analytics System</h2>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'forecast'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Revenue Forecast
            </button>
            <button
              onClick={() => setActiveTab('copper')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'copper'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Copper Price Impact
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'compliance'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Compliance Impact
            </button>
          </nav>
        </div>

        {/* Revenue Forecast Tab */}
        {activeTab === 'forecast' && (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Period (Months)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={forecastMonths}
                  onChange={(e) => setForecastMonths(e.target.value)}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-blue-600">{forecastMonths} months</span>
                <button
                  onClick={fetchForecast}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Update Forecast'}
                </button>
              </div>
            </div>

            {forecast && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(forecast.current_revenue)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Forecasted Revenue ({forecastMonths}m)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(forecast.forecasts[forecast.forecasts.length - 1]?.forecast || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {forecast.forecasts[0]?.confidence_level || 0}%
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">Monthly Forecast Breakdown</h4>
                  <div className="space-y-2">
                    {forecast.forecasts.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            {formatCurrency(item.confidence_lower)} - {formatCurrency(item.confidence_upper)}
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(item.forecast)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Copper Price Impact Tab */}
        {activeTab === 'copper' && (
          <div>
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading copper impact forecast...</p>
              </div>
            )}

            {copperScenario && (
              <div className="space-y-4">
                {/* Severity Banner */}
                {copperScenario.severity && (
                  <div className={`p-4 rounded-lg border-l-4 ${
                    copperScenario.severity === 'CRITICAL' ? 'bg-red-50 border-red-600' :
                    copperScenario.severity === 'HIGH' ? 'bg-orange-50 border-orange-600' :
                    copperScenario.severity === 'MEDIUM' ? 'bg-yellow-50 border-yellow-600' :
                    'bg-blue-50 border-blue-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">Impact Severity: {copperScenario.severity}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Total Impact: {copperScenario.total_impact >= 0 ? '+' : ''}{formatCurrency(copperScenario.total_impact)} over 10 months
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        copperScenario.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                        copperScenario.severity === 'HIGH' ? 'bg-orange-600 text-white' :
                        copperScenario.severity === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {copperScenario.severity}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Copper Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${copperScenario.current_copper_price}/ton
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{copperScenario.copper_price_source}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Projected Price</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      ${copperScenario.projected_copper_price}/ton
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {copperScenario.scenario_params?.price_change >= 0 ? '+' : ''}
                      {copperScenario.scenario_params?.price_change}% change
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">10-Month Forecasted Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(copperScenario.forecasts?.[copperScenario.forecasts.length - 1]?.impacted_forecast || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Copper contributes {copperScenario.copper_contribution_pct}%</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Economic Indicators</p>
                    <p className="text-lg font-bold text-purple-600">
                      Inflation: {copperScenario.current_economic_factors?.inflation_rate}%
                    </p>
                    <p className="text-lg font-bold text-purple-600">
                      GDP: {copperScenario.current_economic_factors?.gdp_growth_rate}%
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">Monthly Forecast Breakdown</h4>
                  <div className="space-y-2">
                    {copperScenario.forecasts?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Baseline: {formatCurrency(item.baseline_forecast)}
                          </span>
                          <span className={`text-sm font-medium ${item.copper_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Impact: {item.copper_impact >= 0 ? '+' : ''}{formatCurrency(item.copper_impact)}
                          </span>
                          {item.breakdown && (
                            <span className="text-xs text-gray-500">
                              (Direct: {formatCurrency(item.breakdown.direct_mining_tax_impact)} |
                              Indirect: {formatCurrency(item.breakdown.indirect_economic_impact)})
                            </span>
                          )}
                          <span className="text-lg font-bold text-blue-600">
                            Final: {formatCurrency(item.impacted_forecast)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Affected Sectors */}
                {copperScenario.affected_sectors && copperScenario.affected_sectors.length > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3">Affected Revenue Sectors</h4>
                    <div className="flex flex-wrap gap-2">
                      {copperScenario.affected_sectors.map((sector, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                          {sector.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mitigation Strategies */}
                {copperScenario.mitigation_strategies && copperScenario.mitigation_strategies.length > 0 && (
                  <div className={`p-4 rounded-lg ${
                    copperScenario.scenario_params?.price_change < 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <h4 className="font-bold text-gray-800 mb-3">
                      {copperScenario.scenario_params?.price_change < 0 ? 'Mitigation Strategies' : 'Opportunity Strategies'}
                    </h4>
                    <ul className="space-y-2">
                      {copperScenario.mitigation_strategies.map((strategy, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className={`mr-2 mt-1 ${
                            copperScenario.scenario_params?.price_change < 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>•</span>
                          <span className="text-sm text-gray-700">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compliance Impact Tab */}
        {activeTab === 'compliance' && (
          <div>
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading compliance impact forecast...</p>
              </div>
            )}

            {complianceScenario && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Current Compliance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {complianceScenario.current_compliance_rate}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Target Compliance</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {complianceScenario.target_compliance_rate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">+{complianceScenario.scenario_params?.compliance_improvement}% improvement</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Revenue Gain (10mo)</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{formatCurrency(complianceScenario.total_revenue_gain)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">ROI: {complianceScenario.enforcement_investment?.roi_percentage}%</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">Monthly Forecast Breakdown</h4>
                  <div className="space-y-2">
                    {complianceScenario.forecasts?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm font-medium text-gray-700">{item.month}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Baseline: {formatCurrency(item.baseline_forecast)}
                          </span>
                          <span className="text-sm font-medium text-green-600">
                            Gain: +{formatCurrency(item.compliance_gain)}
                          </span>
                          <span className="text-sm text-purple-600">
                            Rate: {item.compliance_rate}%
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            Final: {formatCurrency(item.improved_forecast)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Investment Analysis */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm font-medium text-blue-800 mb-3">Investment Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Estimated Cost:</span>
                        <span className="text-sm font-bold text-blue-900">
                          {formatCurrency(complianceScenario.enforcement_investment?.estimated_cost)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Total Revenue Gain (10mo):</span>
                        <span className="text-sm font-bold text-green-700">
                          +{formatCurrency(complianceScenario.total_revenue_gain)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-blue-300 pt-2">
                        <span className="text-sm text-blue-700">ROI:</span>
                        <span className="text-lg font-bold text-green-600">
                          {complianceScenario.enforcement_investment?.roi_percentage}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Payback Period:</span>
                        <span className="text-sm font-bold text-blue-900">
                          {complianceScenario.enforcement_investment?.payback_months} months
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-sm font-medium text-green-800 mb-3">Compliance Improvement Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Current Rate:</span>
                        <span className="text-sm font-bold text-green-900">
                          {complianceScenario.current_compliance_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Target Rate:</span>
                        <span className="text-sm font-bold text-green-900">
                          {complianceScenario.target_compliance_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-green-300 pt-2">
                        <span className="text-sm text-green-700">Improvement:</span>
                        <span className="text-lg font-bold text-green-600">
                          +{complianceScenario.scenario_params?.compliance_improvement}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Avg Monthly Gain:</span>
                        <span className="text-sm font-bold text-green-900">
                          {formatCurrency(complianceScenario.total_revenue_gain / 10)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                {complianceScenario.recommended_actions && complianceScenario.recommended_actions.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-4">
                    <h4 className="font-bold text-purple-800 mb-3">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {complianceScenario.recommended_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-purple-600 mr-2 mt-1">✓</span>
                          <span className="text-sm text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Investment Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded p-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">💡 Investment Summary</p>
                  <p className="text-sm text-gray-700">
                    Improving tax compliance by <strong>{complianceScenario.scenario_params?.compliance_improvement}%</strong> would require an estimated investment of <strong>{formatCurrency(complianceScenario.enforcement_investment?.estimated_cost)}</strong> but generate <strong className="text-green-700">{formatCurrency(complianceScenario.total_revenue_gain)}</strong> in additional revenue over 10 months, delivering an exceptional ROI of <strong className="text-green-700">{complianceScenario.enforcement_investment?.roi_percentage}%</strong> with a payback period of just <strong>{complianceScenario.enforcement_investment?.payback_months} months</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
