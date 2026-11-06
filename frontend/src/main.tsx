import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { config } from '@/shared/config';
import './index.css';

// Start MSW BEFORE the first render, otherwise the first requests escape to the network.
// Dynamic import: with mocks off, MSW is never downloaded.
async function enableMocking(): Promise<void> {
  if (!config.useMocks) return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: false });
}

void enableMocking().then(() => {
  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
