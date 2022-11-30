import { E } from '@endo/captp';
import { makeAsyncIterableFromNotifier as iterateNotifier } from '@agoric/notifier';

// eslint-disable-next-line import/no-mutable-exports
let walletP;
export { walletP };

export const ApplicationContext = createContext({
  state: initial,
  dispatch: /** @type { any } */ (undefined),
  walletP: /** @type { any } */ (undefined),
});

export function useApplicationContext() {
    return useContext(ApplicationContext);
  }

  const getBoardIDForIssuer = issuer => {
    return E(E(walletP).getBoard()).getId(issuer);
  };

  export default function Provider({ children }) {
    const [state, dispatch] = useReducer(reducer, defaultState);
    const { brandToInfo } = state;
  
    const retrySetup = async () => {
  
      const zoe = E(walletP).getZoe();
      const board = E(walletP).getBoard();
  
      const {
        ATOMIC_SWAP_INSTALLATION_BOARD_ID,
      } = lendingPoolDappConfig;
  
      await setupLendingPool(dispatch, zoe, board, ATOMIC_SWAP_INSTALLATION_BOARD_ID);
  
      // The moral equivalent of walletGetPurses()
      async function watchPurses() {
        const pn = E(walletP).getPursesNotifier();
        for await (const purses of iterateNotifier(pn)) {
          dispatch(setPurses(purses));
        }
      }
  
      watchPurses().catch(err =>
        console.error('ERROR: got watchPurses err', err),
      );
  
      await Promise.all([
        E(walletP).suggestInstance('Instance', ATOMIC_SWAP_INSTALLATION_BOARD_ID),
      ]);
  
      watchOffers(dispatch, ATOMIC_SWAP_INSTALLATION_BOARD_ID);
    };
  
    const setWalletP = async bridge => {
      walletP = bridge;
  
      console.log('set walletP');
      await retrySetup();
    };
  
    return (
      <ApplicationContext.Provider
        value={{ state, dispatch, walletP, retrySetup }}
      >
        {children}
        {/*<WalletConnection setWalletP={setWalletP} dispatch={dispatch} />*/}
        <LendingPoolWalletConnection dispatch={dispatch} setWalletP={setWalletP}></LendingPoolWalletConnection>
      </ApplicationContext.Provider>
    );
  }