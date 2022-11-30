# Dapp Sell Thing

To learn more about how to build Agoric Dapps, please see the [Dapp Guide](https://agoric.com/documentation/dapps/).

See the [Dapp Deployment Guide](https://github.com/Agoric/agoric-sdk/wiki/Dapp-Deployment-Guide) for how to deploy this Dapp on a public website, such as https://fungiblefaucet.testnet.agoric.com/


# DEV DIARY
- Step One - Remove Old UI
- Step Two - Contract Directory
    - Do edit `src/contract.js`; do *not* edit `deploy.js`
    - Removed old contract and replaced it with new contract
    - Removed old tests and replaced it with new tests

- Step Three - API Directory
    - Do edit `src/handler.js`; do *not* edit `deploy.js`
    - None of the other [Dapps on the example page](https://docs.agoric.com/guides/dapps/dapp-templates.html) have an API directory, so I'm not sure what to do here.
    - API not necessary here re: Sam. deleted directory

- Step Four - UI Directory
    - Create `ui/` directory with `yarn`
    - Add contexts and import into app with store


- Step Five - PROFIT