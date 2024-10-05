# ENS Subgraph Documentation

This document outlines the steps to configure and deploy the ENS Subgraph.

## Configuration

1. **Open the `subgraph.yaml` File**

   - Navigate to the root directory of your project and open the `subgraph.yaml` file.

2. **Specify the Network**

   - Modify the `network` field to reflect the network on which your smart contract is deployed. You can find the available network names [here](https://thegraph.com/docs/en/developing/supported-networks/).
   - Example:
     ```yaml
     network: cli-name
     ```
     Replace with:
     ```yaml
     network: mbase
     ```

3. **Update Smart Contract Address and Start Block**

   - In the `dataSources` section, change the `address` and `startBlock` fields to correspond to your specific smart contract. The `startBlock` typically represents the block in which the contract was created. The configuration should look as follows:
     ```yaml
     - kind: ethereum/contract
       name: MetadataService
       network: mbase
       source:
         address: "YOUR_METADATA_SERVICE_ADDRESS"
         abi: MetadataService
         startBlock: SMART_CONTRACT_CREATION_BLOCK
       mapping:
         kind: ethereum/events
         apiVersion: 0.0.6
         language: wasm/assemblyscript
         file: ./src/MetadataService.ts
         entities:
           - MetadataService
         abis:
           - name: MetadataService
             file: ./abis/MetadataService.json
         eventHandlers:
           - event: "MetadataUpdate(uint256,string)"
             handler: handleMetadataUpdate
     ```
   - **Important Note:** Ensure that you replace the `address` and `startBlock` with the correct values for your contract. Always verify the name before making replacements.

4. **Example Configuration**

   ```yaml
   - kind: ethereum/contract
     name: MetadataService
     network: mbase
     source:
       address: "0x452606a3176441753776766DBb51AE85136f4148"
       abi: MetadataService
       startBlock: 8883486
     mapping:
       kind: ethereum/events
       apiVersion: 0.0.6
       language: wasm/assemblyscript
       file: ./src/MetadataService.ts
       entities:
         - MetadataService
       abis:
         - name: MetadataService
           file: ./abis/MetadataService.json
       eventHandlers:
         - event: "MetadataUpdate(uint256,string)"
           handler: handleMetadataUpdate
   ```

5. **Update the `src/utils.ts` File**
   - Open the `src/utils.ts` file and modify the following constants:
     ```typescript
     export const ETH_NODE_TEXT = ".YOUR_DOMAIN";
     export const ETH_NODE = "NAMEHASH_OF_YOUR_DOMAIN";
     ```
   - **Example Update:**
     ```typescript
     export const ETH_NODE_TEXT = ".ns3";
     export const ETH_NODE =
       "0x212790ef3397c94de29376f58ecc41f1267661e3453d54551570a5dfb58d630d";
     ```

## Build and Deploy the Subgraph

1. **Generate Types**

   - To generate types, run the following command:
     ```bash
     npm run codegen
     ```

2. **Build the Subgraph**

   - To build the subgraph, execute:
     ```bash
     npm run build
     ```

3. **Authenticate for Deployment**

   - Before deploying the subgraph, you need to authenticate. Use the following command, replacing `YOUR_KEY` with your actual authentication key obtained from the subgraph project:
     ```bash
     graph auth --studio YOUR_KEY
     ```

4. **Deploy the Subgraph**

   - After authentication, deploy the subgraph using one of the following commands:
     - If you have copied the deploy command from the The Graph dashboard:
       ```bash
       graph deploy --studio 3ns
       ```
     - Or, you can use:
       ```bash
       npm run deploy
       ```

5. **Deployment Confirmation**
   - After executing the deploy command, your subgraph will be deployed successfully.
