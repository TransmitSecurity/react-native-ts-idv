jest.mock('react-native', () => ({
  NativeModules: {
    TsIdv: {
      initializeSDK: jest.fn(() => Promise.resolve(true)),
      initializeSDKWithConfiguration: jest.fn(() => Promise.resolve(true)),
      initialize: jest.fn(() => Promise.resolve(true)),
      recapture: jest.fn(() => Promise.resolve(true)),
    },
  },
  Platform: { select: () => '' },
}));

import { NativeModules } from 'react-native';
import IdentityVerification from '../index';

const mockNative = NativeModules.TsIdv;

describe('initializeSDK', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the resource-based native method when no file name is given', async () => {
    await IdentityVerification.initializeSDK();
    expect(mockNative.initializeSDK).toHaveBeenCalledWith();
    expect(mockNative.initializeSDKWithConfiguration).not.toHaveBeenCalled();
  });

  it('routes a configuration file name to the configuration method', async () => {
    await IdentityVerification.initializeSDK('CustomConfig');
    expect(mockNative.initializeSDKWithConfiguration).toHaveBeenCalledWith('CustomConfig');
    expect(mockNative.initializeSDK).not.toHaveBeenCalled();
  });

  it('passes an empty file name through so native can reject it, rather than silently using the default', async () => {
    await IdentityVerification.initializeSDK('');
    expect(mockNative.initializeSDKWithConfiguration).toHaveBeenCalledWith('');
    expect(mockNative.initializeSDK).not.toHaveBeenCalled();
  });

  it('propagates a native rejection', async () => {
    const failure = Object.assign(new Error('not supported'), { userInfo: { errorCode: 'notSupported' } });
    mockNative.initializeSDKWithConfiguration.mockImplementationOnce(() => Promise.reject(failure));
    await expect(IdentityVerification.initializeSDK('CustomConfig')).rejects.toBe(failure);
  });
});

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
