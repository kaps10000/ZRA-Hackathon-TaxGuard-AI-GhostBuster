import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPanel from './SettingsPanel';

describe('SettingsPanel runtime-config POST', () => {
  let _origFetch;
  beforeEach(()=>{
    _origFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });
  afterEach(()=>{
    global.fetch = _origFetch;
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('posts ghost config and calls onClose on main Save', async () => {
    const setDemoMode = jest.fn();
    const setApiBaseUrl = jest.fn();
    const onClose = jest.fn();

    render(<SettingsPanel demoMode={false} setDemoMode={setDemoMode} apiBaseUrl={'http://localhost:4000'} setApiBaseUrl={setApiBaseUrl} onClose={onClose} />);

    // switch ghost mode to proxy and enter a URL
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'proxy');
    const urlInput = screen.getByPlaceholderText('Proxy URL (e.g. https://api.example/ghost-check)');
    await userEvent.type(urlInput, 'https://example/ghost-check');

    // click the main Save button (next to Test)
    const saveBtn = screen.getByRole('button', { name: /^Save$/i });
    await userEvent.click(saveBtn);

  // wait for fetch to be called and for onClose to be invoked
  await waitFor(()=> expect(global.fetch).toHaveBeenCalled());
  expect(onClose).toHaveBeenCalled();
  expect(setApiBaseUrl).toHaveBeenCalledWith('http://localhost:4000');

  // find the POST call among fetch calls (component performs a GET on mount)
  const postCall = global.fetch.mock.calls.find((call)=> call[1] && call[1].method === 'POST');
  expect(postCall).toBeDefined();
  const [postUrl, postOpts] = postCall;
  expect(postUrl).toBe('/api/_ghost-config');
  expect(postOpts.method).toBe('POST');
  const body = JSON.parse(postOpts.body);
  expect(body).toEqual({ mode: 'proxy', url: 'https://example/ghost-check' });
  });

  test('posts ghost config when clicking "Save ghost config" button', async () => {
    render(<SettingsPanel demoMode={false} setDemoMode={jest.fn()} apiBaseUrl={'http://localhost:4000'} setApiBaseUrl={jest.fn()} onClose={jest.fn()} />);

    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'proxy');
    const urlInput = screen.getByPlaceholderText('Proxy URL (e.g. https://api.example/ghost-check)');
    await userEvent.type(urlInput, 'https://example/ghost2');

    const inlineSave = screen.getByRole('button', { name: /Save ghost config/i });
    await userEvent.click(inlineSave);

  await waitFor(()=> expect(global.fetch).toHaveBeenCalled());
  const postCall = global.fetch.mock.calls.find((c)=> c[1] && c[1].method === 'POST');
  expect(postCall).toBeDefined();
  const [postUrl, postOpts] = postCall;
  expect(postUrl).toBe('/api/_ghost-config');
  expect(JSON.parse(postOpts.body)).toEqual({ mode: 'proxy', url: 'https://example/ghost2' });
    // show feedback message 'Saved' (ghostMsg)
    expect(await screen.findByText(/Saved/)).toBeTruthy();
  });

});
