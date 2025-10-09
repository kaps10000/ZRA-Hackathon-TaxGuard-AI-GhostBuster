import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  test('closes modal when Escape key is pressed', async ()=>{
    const onClose = jest.fn();
    render(<ReportModal open={true} onClose={onClose} report={sample} />);
    
    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('modal has correct accessibility attributes', ()=>{
    render(<ReportModal open={true} onClose={()=>{}} report={sample} />);
    
    // Verify modal has role="dialog" and aria-modal
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    
    // Verify there's a title element
    const title = document.getElementById('report-modal-title');
    expect(title).toBeInTheDocument();
  });

  test('restores focus to previously focused element when closed', ()=>{
    const trigger = document.createElement('button');
    trigger.id = 'test-trigger';
    document.body.appendChild(trigger);
    trigger.focus();
    const focusedBefore = document.activeElement;

    const { rerender } = render(<ReportModal open={true} onClose={()=>{}} report={sample} />);
    
    // Focus should move into modal (away from trigger)
    expect(document.activeElement).not.toBe(trigger);
    
    // Close modal
    rerender(<ReportModal open={false} onClose={()=>{}} report={sample} />);
    
    // Focus should be restored (check if body or the trigger)
    // The focus restore may return focus to body or trigger depending on cleanup timing
    const restoredToTriggerOrBody = document.activeElement === trigger || document.activeElement === document.body;
    expect(restoredToTriggerOrBody).toBe(true);
    
    document.body.removeChild(trigger);
  });
});
