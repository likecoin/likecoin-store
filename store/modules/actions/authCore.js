import {
  AuthCoreAuthClient,
  AuthCoreKeyVaultClient,
  AuthCoreCosmosProvider,
} from 'authcore-js';
import * as types from '@/store/mutation-types';
import {
  AUTHCORE_API_HOST,
  COSMOS_CHAIN_ID,
  COSMOS_WALLET_PREFIX,
} from '@/constant';

export async function setAuthCoreToken({ commit, state, dispatch }, accessToken) {
  commit(types.AUTHCORE_SET_ACCESS_TOKEN, accessToken);
  if (accessToken) {
    if (window.localStorage) window.localStorage.setItem('authcore.accessToken', accessToken);
    if (state.authClient) {
      state.authClient.setAccessToken(accessToken);
    } else {
      await dispatch('initAuthCoreClient');
    }
    if (state.kvClient) {
      state.kvClient.setAccessToken(accessToken);
    } else {
      await dispatch('initAuthCoreWalletService');
    }
  } else {
    if (window.localStorage) window.localStorage.removeItem('authcore.accessToken');
    await dispatch('clearAuthCoreAllClients');
  }
}

export async function authCoreLogoutUser({ state, dispatch }) {
  if (state.authClient) {
    try {
      await state.authClient.signOut();
    } catch (err) {
      console.error(err);
    }
  }
  await dispatch('setAuthCoreToken', '');
}

export async function initAuthCoreClient({ commit, state, dispatch }) {
  const { accessToken } = state;
  const authClient = await new AuthCoreAuthClient({
    apiBaseURL: AUTHCORE_API_HOST,
    callbacks: {
      unauthenticated: () => {
        dispatch('setAuthCoreToken', '');
      },
    },
    accessToken,
  });
  commit(types.AUTHCORE_SET_AUTH_CLIENT, authClient);
}

export async function initAuthCoreWalletService({ commit, state }) {
  const keyVaultClient = await new AuthCoreKeyVaultClient({
    apiBaseURL: AUTHCORE_API_HOST,
    accessToken: state.accessToken,
  });
  const walletSubprovider = await new AuthCoreCosmosProvider({
    authcoreClient: keyVaultClient,
    authcoreWidgetsUrl: `${AUTHCORE_API_HOST}/widgets`,
    container: 'authcore-cosmos-container',
    chainId: COSMOS_CHAIN_ID,
  });
  commit(types.AUTHCORE_SET_KV_CLIENT, keyVaultClient);
  commit(types.AUTHCORE_SET_COSMOS_PROVIDER, walletSubprovider);
}

export async function initAuthCoreCosmosWallet({ state }) {
  const { kvClient, cosmosProvider } = state;
  const { length } = await cosmosProvider.getAddresses();
  if (!length) {
    await kvClient.createSecret('HD_KEY', 16);
  }
}

export async function clearAuthCoreAllClients({ commit }) {
  commit(types.AUTHCORE_SET_AUTH_CLIENT, null);
  commit(types.AUTHCORE_SET_KV_CLIENT, null);
  commit(types.AUTHCORE_SET_COSMOS_PROVIDER, null);
}

export async function fetchAuthCoreCosmosWallet({ state }) {
  if (!state.cosmosProvider) return null;
  const [cosmosAddress] = await state.cosmosProvider.getAddresses();
  return cosmosAddress;
}

export async function prepareCosmosTxSigner({ state }) {
  if (!state.cosmosProvider) throw new Error('COSMOS_WALLET_NOT_INITED');
  const [[{ id }], [publicKey]] = await Promise.all([
    state.kvClient.listHDChildPublicKeys(COSMOS_WALLET_PREFIX),
    state.cosmosProvider.getPublicKeys(),
  ]); // HACK: only get first wallet
  const signer = async (data) => {
    const signatureHex = await state.kvClient.cosmosSign(id, `${COSMOS_WALLET_PREFIX}/0`, data);
    return { signature: Buffer.from(signatureHex, 'hex'), publicKey: Buffer.from(publicKey, 'hex') };
  };
  return signer;
}