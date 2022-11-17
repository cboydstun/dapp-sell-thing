// @ts-check

/* eslint-disable import/order -- https://github.com/endojs/endo/issues/1235 */
import { test } from './prepare-test-env-ava.js';
import path from 'path';

import bundleSource from '@endo/bundle-source';

import { E } from '@endo/eventual-send';
import { makeFakeVatAdmin } from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import { AmountMath } from '@agoric/ertp';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

test.before(async t => {
  const { zoeService } = makeZoeKit(makeFakeVatAdmin().admin);

  // #region bundle
  const sell1Url = await importMetaResolve('./sell1.js', import.meta.url);
  const sell1Path = url.fileURLToPath(sell1Url);
  const sell1Bundle = await bundleSource(sell1Path);
  // #endregion bundle
  const installation = await E(zoeService).install(sell1Bundle);

  t.context = { zoeService, installation };
});

test('sell 1 thing', async t => {
  /** @type {{ zoeService: ZoeService }} */
  const { zoeService: zoe, installation } = t.context;

  // Both Alice and Bob know about the issuers and brands for moola, things
  // but the mints are closely held.
  const common = () => {
    const { mint: moolaMint, ...moolaKit } = makeIssuerKit('Moola');
    const { mint: thingMint, ...thingKit } = makeIssuerKit(
      'Thing',
      AssetKind.SET,
    );
    const moolaAmt = val => AmountMath.make(moolaKit.brand, val);
    const thingAmt = val => AmountMath.make(thingKit.brand, val);

    const thing1 = thingMint.mintPayment(thingAmt(harden(['Thing 1'])));
    const moola200 = moolaMint.mintPayment(moolaAmt(200n));
    const share = makePromiseKit();

    const scenario = harden({ item: thing1, payment: moola200, share });

    return { moolaKit, thingKit, moolaAmt, thingAmt, scenario };
  };
  const { moolaKit, thingKit, moolaAmt, thingAmt, scenario } = common();

  // Alice starts the contract and offers to sell thing1 for 100 moola.
  const actAsAlice = async (thing1, shareInstance) => {
    const thing1Amt = await E(thingKit.issuer).getAmountOf(thing1);
    const proposalToSell = harden({
      give: { Item: thing1Amt },
      want: { Price: moolaAmt(100n) },
    });

    const issuers = {
      Item: thingKit.issuer,
      Price: moolaKit.issuer,
    };
    const terms = { Item: thing1Amt, Price: moolaAmt(100n) };
    const { instance, creatorFacet } = await E(zoe).startInstance(
      installation,
      issuers,
      terms,
    );

    const invitationToSell = await E(creatorFacet).makeSellInvitation();
    t.log('Alice offers to sell', proposalToSell);
    const seat = await E(zoe).offer(
      invitationToSell,
      proposalToSell,
      harden({ Item: thing1 }),
    );
    const result = await E(seat).getOfferResult();
    t.log('result from offer to sell:', result);
    shareInstance(instance); // with prospective buyers

    const proceeds = await E(seat).getPayout('Price');
    const procAmt = await E(moolaKit.issuer).getAmountOf(proceeds);
    t.log('alice received:', procAmt);
    t.deepEqual(procAmt, proposalToSell.want.Price);
  };

  // Bob buys thing1
  const actAsBob = async (funds, instanceP) => {
    const purse = moolaKit.issuer.makeEmptyPurse();
    purse.deposit(funds);

    // Bob checks the terms of the contract
    const instance = await instanceP;
    const { Price, Item } = await E(zoe).getTerms(instance);
    t.deepEqual(Price, moolaAmt(100n));
    t.deepEqual(Item, thingAmt(harden(['Thing 1'])));

    const proposal = harden({ give: { Price }, want: { Item } });

    // exercise: try this proposal instead
    // const proposal = harden({ give: { Price: moolaAmt(50n) }, want: { Item } });

    // or this one
    // const proposal = harden({
    //   give: { Price },
    //   want: { Item: thingAmt(harden(['Thing 2'])) },
    // });

    t.log('bob proposes', proposal);

    const publicFacet = E(zoe).getPublicFacet(instance);
    const buyInv = await E(publicFacet).makeBuyInvitation();
    const seat = await E(zoe).offer(buyInv, proposal, {
      Price: purse.withdraw(proposal.give.Price),
    });

    const property = await E(seat).getPayout('Item');
    const refund = await E(seat).getPayout('Price');
    const pAmt = await E(thingKit.issuer).getAmountOf(property);
    const rAmt = await E(moolaKit.issuer).getAmountOf(refund);
    t.log('bob received', pAmt, rAmt);
    t.deepEqual(pAmt, Item);
    t.deepEqual(rAmt, moolaAmt(0n));
  };

  await Promise.all([
    actAsAlice(scenario.item, scenario.share.resolve),
    actAsBob(scenario.payment, scenario.share.promise),
  ]);
});
