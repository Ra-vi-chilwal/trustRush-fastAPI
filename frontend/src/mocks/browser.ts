import { setupWorker } from 'msw/browser';
import type { RequestHandler } from 'msw';
import { config, type MockableFeature } from '@/shared/config';
import { authHandlers } from './handlers/auth';
import { bookingHandlers } from './handlers/bookings';
import { eventHandlers } from './handlers/events';

const handlersByFeature: Record<MockableFeature, RequestHandler[]> = {
  auth: authHandlers,
  events: eventHandlers,
  bookings: bookingHandlers,
};

// Only the features listed in VITE_MOCKS are intercepted. Every other request
// is "unhandled" and MSW lets it through to the network (the real backend).
export const worker = setupWorker(...[...config.mocks].flatMap((f) => handlersByFeature[f]));
