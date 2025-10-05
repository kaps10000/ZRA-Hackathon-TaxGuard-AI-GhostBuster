import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportModal from './ReportModal';

describe('ReportModal', ()=>{
  const sample = { case_id: 'R-12345', proof_hash: 'abc123', created_at: Date.now() };
  test('renders report and copies proof hash', async ()=>{
    render(<ReportModal open={true} onClose={()=>{}} report={sample} />);
    expect(screen.getByText(/Report Created/i)).toBeInTheDocument();
  // The label "Case ID:" is in a <strong>, so assert the value exists instead
  expect(screen.getByText('R-12345')).toBeInTheDocument();
    const copyBtn = screen.getByText(/Copy proof hash/i);
    fireEvent.click(copyBtn);
    // clipboard.writeText should have been called with sample.proof_hash
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(sample.proof_hash);
    // Copied! text should appear (it may be async due to setTimeout; but jest mock is immediate)
    expect(await screen.findByText(/Copied!/i)).toBeInTheDocument();
  });
});
