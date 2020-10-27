import React, { useState, useEffect, useContext } from 'react';
import { AppConfig, UserSession } from 'blockstack/lib';
import { Flex, ToastProvider } from '@stacks/ui';
import { showBlockstackConnect, FinishedData, AuthOptions } from '@blockstack/connect';
import { parseCookies } from 'nookies';
import useConstant from 'use-constant';
import debounce from 'awesome-debounce-promise';
import { NextPage } from 'next';

import { fetchAccount, setIdentity } from '@store/sandbox';
import { ReduxNextPageContext } from '@common/types';
import { useSandboxState } from '@common/hooks/use-sandbox-state';

import { Faucet } from '@components/sandbox/faucet';
import { USERNAME_COOKIE, IDENTITY_COOKIE } from '@common/utils';
import { PageContent } from '@components/sandbox/page';
import { PageWrapper } from '@components/page';
import { Title } from '@components/typography';

const ConnectContext = React.createContext<{ authOptions?: AuthOptions }>({
  authOptions: undefined,
});

const Connect: React.FC<{ authOptions?: AuthOptions }> = ({ authOptions, ...rest }) => (
  <ConnectContext.Provider value={{ authOptions }} {...rest} />
);
export const useConnect = () => {
  const { authOptions } = useContext(ConnectContext);
  return { authOptions, doOpenAuth: () => showBlockstackConnect(authOptions as AuthOptions) };
};
const paths = [
  { path: 'faucet', label: 'STX faucet', component: Faucet },
  // { path: 'stx-transfer', label: 'STX transfer', component: TokenTransfer },
  // { path: 'raw-tx', label: 'Raw transaction', component: RawTx },
  // { path: 'contract-deploy', label: 'Contract deploy', component: ContractDeploy },
  // { path: 'contract-call', label: 'Contract call', component: ContractCall },
];

const SandboxWrapper = React.memo(({ children }: any) => {
  const { doGenerateIdentity, doSetUserData } = useSandboxState();
  const [iconPath, setIconPath] = useState<string>('');

  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const userSession = new UserSession({ appConfig });

  // we are using useConstant and debounce because it seems connect fires this fn many times
  // https://github.com/blockstack/ux/issues/444
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const onFinish = useConstant(() =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    debounce(async (payload: FinishedData) => {
      const userData = payload.userSession.loadUserData();
      doSetUserData(userData);
      await doGenerateIdentity(payload.userSession);
    }, 350)
  );

  useEffect(() => {
    const iconPrefix = typeof document !== 'undefined' ? document.location.origin.toString() : '';
    if (!iconPath) {
      setIconPath(iconPrefix);
    }
  }, []);

  const authOptions: AuthOptions = {
    finished: onFinish,
    userSession,
    appDetails: {
      name: 'Stacks Explorer',
      icon: `${iconPath}/app-icon.png`,
    },
  };
  return (
    <Connect authOptions={authOptions}>
      <ToastProvider>{children}</ToastProvider>
    </Connect>
  );
});

const PageTop: React.FC = React.memo(() => (
  <Flex flexDirection="column" alignItems="center" maxWidth="544px" justify="center">
    <Title
      as="h1"
      fontSize="36px"
      display="block"
      width="100%"
      textAlign={['center', 'left']}
      mt="72px"
      mb="extra-loose"
      color="white"
    >
      Explorer sandbox
    </Title>
  </Flex>
));

const SandboxPage: NextPage<any> = ({ tab, identity: _cookieIdentity, username }) => {
  const [transactionsVisible, setShowTransactions] = useState(false);
  const { lastFetch, loading, identity, error, doFetchAccount } = useSandboxState();

  const hideTransactionDialog = () => {
    setShowTransactions(false);
  };
  const showTransactionDialog = () => {
    setShowTransactions(true);
  };

  useEffect(() => {
    if (!error && !lastFetch && loading !== 'pending' && identity) {
      void doFetchAccount(identity.address);
    }
  }, [error, lastFetch, loading, identity]);

  return (
    <SandboxWrapper>
      <PageWrapper>
        <PageTop />
        <PageContent
          hideTransactionDialog={hideTransactionDialog}
          showTransactionDialog={showTransactionDialog}
          transactionsVisible={transactionsVisible}
          username={username}
          tab={tab}
          tabs={paths}
        />
      </PageWrapper>
    </SandboxWrapper>
  );
};

SandboxPage.getInitialProps = async (ctx: ReduxNextPageContext) => {
  const cookies = parseCookies(ctx);
  const { dispatch } = ctx.store;
  const tab = ctx?.query?.tab ?? undefined;
  if (cookies) {
    const identity = cookies[IDENTITY_COOKIE] ? JSON.parse(cookies[IDENTITY_COOKIE]) : undefined;
    const username = cookies[USERNAME_COOKIE] ? JSON.parse(cookies[USERNAME_COOKIE]) : undefined;
    if (identity) {
      await Promise.all([
        dispatch(setIdentity(identity)),
        dispatch(fetchAccount(identity.address)),
      ]);
    }
    return {
      identity,
      username,
      tab,
    };
  }
  return { tab };
};

export default SandboxPage;