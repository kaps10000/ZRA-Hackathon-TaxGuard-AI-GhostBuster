import React from 'react';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function ExampleChart({ data: scores }){
  const labels = scores ? scores.map((_, i) => `#${i+1}`) : ['1','2','3','4','5'];
  const dataset = scores || [20,40,35,50,45];
  const chartData = {
    labels,
    datasets: [{ label: 'Risk Score', data: dataset, borderColor: 'rgba(75,192,192,1)', tension: 0.3 }]
  };
  return <Line data={chartData} />;
}
