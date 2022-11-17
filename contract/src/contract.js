// @ts-check
/* global harden */
import { Far } from '@endo/marshal';

/**
 * @type {ContractStartFn}
 */

const start = async (zcf) => {
  let sellerSeat;

  /** @type {OfferHandler} */
  const sellHandler = seat => {
    if (sellerSeat) {
      throw Error('already selling');
    }
    sellerSeat = seat;
    // WARNING! proposal needs validation
    return 'ready to sell';
  };

  const buyHandler = seat => {
    if (!sellerSeat) {
      throw Error('not yet selling');
    }
    const { give, want } = seat.getProposal();

    // swap item for price
    sellerSeat.incrementBy(seat.decrementBy({ Price: give.Price }));
    seat.incrementBy(sellerSeat.decrementBy({ Item: want.Item }));
    zcf.reallocate(seat, sellerSeat);

    seat.exit();
    sellerSeat.exit();
    return 'sold. nice doing business with you';
  };

  const creatorFacet = Far('creatorFacet', {
    makeSellInvitation: () => zcf.makeInvitation(sellHandler, 'sell item'),
  });

  const publicFacet = Far('pub', {
    makeBuyInvitation: () => zcf.makeInvitation(buyHandler, 'buy'),
  });
  return { publicFacet, creatorFacet };
};

harden(start);
export { start };
