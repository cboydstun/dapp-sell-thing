import './App.css';
import { useApplicationContext } from './contexts/Application';

function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { state, dispatch, walletP, retrySetup } = useApplicationContext();
  const { brandToInfo, purses, offers } = state;

  const toggle = () => setIsOpen(!isOpen);

  const handlePurseSelected = async (brandBoardId, pursePetname) => {
    const { brand, issuer } = brandToInfo.get(brandBoardId);
    const purse = await E(walletP).getPurse(pursePetname);
    const amount = await E(purse).getCurrentAmount();
    const amountIn = AmountMath.makeEmpty(brand);
    const amountOut = AmountMath.makeEmpty(brand);
  };

  const handleAmountInChanged = async (brandBoardId, amountIn) => {
    const { brand, issuer } = brandToInfo.get(brandBoardId);
    const amountOut = AmountMath.makeEmpty(brand);
  };

  const handleAmountOutChanged = async (brandBoardId, amountOut) => {
    const { brand, issuer } = brandToInfo.get(brandBoardId);
    const amountIn = AmountMath.makeEmpty(brand);
  };


  return (
    <div>

    </div>
  );
}

export default App;
