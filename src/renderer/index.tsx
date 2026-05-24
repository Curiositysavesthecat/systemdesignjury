import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles.css';

// Suppress ResizeObserver loop error before webpack dev server overlay catches it
const origAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions
) {
  if (type === 'error' && typeof listener === 'function') {
    const orig = listener;
    const wrapped: EventListener = (event: Event) => {
      if ((event as ErrorEvent).message?.includes('ResizeObserver loop')) return;
      orig.call(window, event);
    };
    return origAddEventListener.call(this, type, wrapped, options);
  }
  return origAddEventListener.call(this, type, listener, options);
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
