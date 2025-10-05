import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GhostCheckForm from './GhostCheckForm';
import axios from 'axios';

jest.mock('axios');

describe('GhostCheckForm', ()=>{
  test('happy path: performs check and creates report', async ()=>{
    const mockResult = { alert_id: 'G-MOCK1', ghost_score: 93, issues: ['X'] };
    axios.create = jest.fn(() => ({ post: jest.fn() }));
    const fakeClient = { post: jest.fn() };
    axios.create.mockReturnValue(fakeClient);
    // first post /api/ghost-check returns check result
    fakeClient.post.mockResolvedValueOnce({ data: { result: mockResult } });
    // second post /api/report returns report
    fakeClient.post.mockResolvedValueOnce({ data: { status: 'ok', case_id: 'R-999', proof_hash: 'phash' } });

  // suppress console.error from React internal warnings during this test
  const originalError = console.error; console.error = ()=>{};
  render(<GhostCheckForm demoMode={true} apiBaseUrl={''} />);

    const input = screen.getByPlaceholderText(/Enter Company ID/i);
    fireEvent.change(input, { target: { value: 'G-9001' } });
    const runBtn = screen.getByText(/Run Check/i);
    fireEvent.click(runBtn);

    await waitFor(()=> expect(fakeClient.post).toHaveBeenCalled());
    // after check, Create report button should be present
    const createBtn = await screen.findByText(/Create report/i);
    fireEvent.click(createBtn);

  // wait for the modal containing the case id to appear, and assert inside the modal
  const modalTitle = await screen.findByText(/Report Created/i);
  const modal = modalTitle.closest('div');
  const { getByText: getByTextWithin } = require('@testing-library/dom');
  // ensure there's at least one R-999 inside the document
  const nodes = await screen.findAllByText('R-999');
  expect(nodes.length).toBeGreaterThan(0);
  // find at least one node that is inside the modal overlay (has a .fixed ancestor)
  const insideModal = nodes.some(n => !!n.closest && n.closest('.fixed'));
  expect(insideModal).toBe(true);
    // restore console.error
    console.error = originalError;
  });
});
