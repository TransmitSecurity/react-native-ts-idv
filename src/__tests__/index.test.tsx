jest.mock('react-native', () => ({
  NativeModules: {
    TsIdv: {
      initializeSDK: jest.fn(() => Promise.resolve(true)),
      initialize: jest.fn(() => Promise.resolve(true)),
      recapture: jest.fn(() => Promise.resolve(true)),
    },
  },
  Platform: { select: () => '' },
}));

import { NativeModules } from 'react-native';
import IdentityVerification from '../index';

const mockNative = NativeModules.TsIdv;

describe('initialize', () => {
  beforeEach(() => jest.clearAllMocks());

  it('defaults the base URL to US', async () => {
    await IdentityVerification.initialize('client-id');
    expect(mockNative.initialize).toHaveBeenCalledWith('client-id', 'https://api.transmitsecurity.io');
  });

  it('passes an explicit base URL through unchanged', async () => {
    await IdentityVerification.initialize('client-id', 'https://api.eu.transmitsecurity.io' as never);
    expect(mockNative.initialize).toHaveBeenCalledWith('client-id', 'https://api.eu.transmitsecurity.io');
  });
});

describe('recapture', () => {
  it('surfaces a native rejection instead of resolving', async () => {
    const failure = new Error('currentActivity is NULL');
    mockNative.recapture.mockImplementationOnce(() => Promise.reject(failure));
    await expect(IdentityVerification.recapture()).rejects.toBe(failure);
  });
});
