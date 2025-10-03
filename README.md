# Smart contracts static rule/compliance analyzer

This project generates static smart contracts analysis report in two phases:
1. Slither low level code analysis of rules and compliances under erc-3643 standards (T-REX implementation https://github.com/TokenySolutions/T-REX/tree/main )
2. In ABI(Application Binary Interface) way, setup rule engine check on HKMA/SFC compliances.

To generate the report, we need to install, node, hardhat, npm and then run following to execute the renderer:
```shell
npx hardhat compile
node --require ts-node/register scripts/check-abipaths.ts
npm run phase2:run\nnpm run phase2:render && npm run phase2:open
```
