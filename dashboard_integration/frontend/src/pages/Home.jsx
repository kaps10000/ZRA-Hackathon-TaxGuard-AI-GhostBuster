import React, { useEffect, useState } from 'react';
import Placeholder from '../components/Placeholder';
import ExampleChart from '../charts/ExampleChart';
import axios from 'axios';

export default function Home({ demoMode = true }){
  const [riskTop, setRiskTop] = useState(null);
  const [ghostAlerts, setGhostAlerts] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAll(){
      try {
        const client = axios.create({ baseURL: demoMode ? '' : 'http://localhost:4000' });
        const [r1, r2, r3] = await Promise.all([
          client.get('/api/risk-top'),
          client.get('/api/ghost-alerts'),
          client.get('/api/forecast')
        ]);

        if(!mounted) return;
        setRiskTop(r1.data);
        setGhostAlerts(r2.data);
        setForecast(r3.data);
      } catch (err){
        setError(err.message || 'Failed to fetch');
      }
    }
    fetchAll();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <Placeholder title="Overview">
        {error && <div className="text-red-600">Error: {error}</div>}
        {!riskTop && !error && <div>Loading overview…</div>}
        {riskTop && (
          <div className="grid grid-cols-3 gap-4">
            {riskTop.map(r => (
              <div key={r.taxpayer_id} className="p-3 bg-white rounded shadow-sm">
                <div className="text-sm text-gray-500">{r.sector}</div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-lg text-red-600">Score: {r.score}</div>
              </div>
            ))}
          </div>
        )}
      </Placeholder>

      <Placeholder title="Risk Scores (trend)">
        {riskTop ? <ExampleChart data={riskTop.map(r => r.score)} /> : <div>Loading chart…</div>}
      </Placeholder>

      <Placeholder title="Ghost Alerts">
        {!ghostAlerts && <div>Loading alerts…</div>}
        {ghostAlerts && (
          <ul className="space-y-2">
            {ghostAlerts.map(a => (
              <li key={a.alert_id} className="p-3 bg-white rounded shadow-sm">
                <div className="font-semibold">{a.company_name} <span className="text-sm text-gray-500">({a.alert_id})</span></div>
                <div className="text-sm">Score: {a.ghost_score}</div>
                <div className="text-xs text-gray-600">Issues: {a.issues.join(', ')}</div>
              </li>
            ))}
          </ul>
        )}
      </Placeholder>

      <Placeholder title="Forecast">
        {!forecast && <div>Loading forecast…</div>}
        {forecast && (
          <div>
            <div>Baseline: {forecast.baseline}</div>
            <ul>
              {forecast.scenarios.map(s => (
                <li key={s.name}>{s.name}: {s.impact}</li>
              ))}
            </ul>
          </div>
        )}
      </Placeholder>
    </div>
  );
}
