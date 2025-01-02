import {
  BigInt,
  Bytes,
  ipfs,
  json,
  JSONValue,
  JSONValueKind,
} from "@graphprotocol/graph-ts";
import { MetadataUpdate } from "./types/MetadataService/MetadataService";
import {
  ADP,
  Discovery,
  KeyValue,
  MetadataInfo,
  MetadataRecord,
} from "./types/schema";

let default_str = "not found";

function _metadataRecord(id: string): MetadataRecord {
  let record = MetadataRecord.load(id);
  if (!record) {
    record = new MetadataRecord(id);
    record.URL = "ipfs://";
    record.adp = "ipfs://";
    record.createdAtBlockNumber = BigInt.fromI32(0);
    record.createdAtTimestamp = BigInt.fromI32(0);
    record.version = "v0";
  }

  return record;
}

function _metadataInfo(id: string): MetadataInfo {
  let record = MetadataInfo.load(id);
  if (!record) {
    record = new MetadataInfo(id);
    record.currentURL = "ipfs://";
    record.adp = "ipfs://";
    record.currentVersion = "v0";
    record.records = [];
  }

  return record;
}

function _adp(id: string): ADP {
  let record = ADP.load(id);
  if (!record) {
    record = new ADP(id);

    record.name = default_str;
    record.did = default_str;
    record.spaceId = default_str;
    record.nonce = -1;

    record.ipfsURI = id;
    record.discovery = id;
  }

  return record;
}

function _discovery(id: string): Discovery {
  let record = Discovery.load(id);
  if (!record) {
    record = new Discovery(id);

    record.adp = id;
    record.tags = [];
    record.discovery_service = default_str;
    record.workflow_descriptors = [];
  }

  return record;
}

function _keyvalue(id: string): KeyValue {
  let record = KeyValue.load(id);
  if (!record) {
    record = new KeyValue(id);

    record.adp = "ipfs://";
    record.discovery = "ipfs://";

    record.key = default_str;
    record.value = default_str;
  }

  return record;
}

export function handleMetadataUpdate(event: MetadataUpdate): void {
  let metadataInfo = _metadataInfo(event.params._tokenId.toString());

  let URL = event.params.__uri.toString();

  let records = metadataInfo.records;

  let idx = -1;

  for (let i = 0; i < records.length; i++) {
    let metadataRecord = _metadataRecord(records[i]);
    if (URL == metadataRecord.URL) {
      idx = i;
      break;
    }
  }

  // records.findIndex((record) => {
  //   let metadataRecord = _metadataRecord(record);
  //   let r = URL == metadataRecord.URL;
  //   return r;
  // });

  if (idx != -1) {
    let metadataRecord = _metadataRecord(records[idx]);

    metadataInfo.currentURL = metadataRecord.URL;
    metadataInfo.adp = metadataRecord.URL;

    metadataInfo.currentVersion = "v".concat(
      BigInt.fromI32(idx + 1).toString()
    );
    metadataInfo.save();
  } else {
    let newMetadataRecord = _metadataRecord(event.transaction.hash.toHex());
    newMetadataRecord.URL = URL;
    newMetadataRecord.adp = URL;
    newMetadataRecord.version = "v".concat(
      BigInt.fromI32(records.length + 1).toString()
    );
    newMetadataRecord.createdAtBlockNumber = event.block.number;
    newMetadataRecord.createdAtTimestamp = event.block.timestamp;
    newMetadataRecord.save();

    // let records = metadataInfo.records

    records.push(newMetadataRecord.id);
    metadataInfo.records = records;

    metadataInfo.currentURL = URL;
    metadataInfo.adp = URL;
    metadataInfo.currentVersion = newMetadataRecord.version;
    metadataInfo.save();

    // -------------------------------------- ipfs

    let ipfs_url = metadataInfo.currentURL;

    let getIPFSData = ipfs.cat(ipfs_url.slice(7));
    if (getIPFSData) {
      let adp = _adp(ipfs_url);

      let root_obj = json.fromBytes(getIPFSData as Bytes).toObject();

      let name = root_obj.get("name");
      let did = root_obj.get("did");
      let spaceId = root_obj.get("spaceId");
      let nonce = root_obj.get("nonce");

      if (name && !name.isNull()) {
        adp.name = name.toString();
      }

      if (did && !did.isNull()) {
        adp.did = did.toString();
      }

      if (spaceId && !spaceId.isNull()) {
        adp.spaceId = spaceId.toString();
      }

      if (nonce && !nonce.isNull() && nonce.kind == JSONValueKind.NUMBER) {
        adp.nonce = nonce.toBigInt().toI32();
      }

      adp.save();

      let domain = root_obj.get("domain");

      if (domain && !domain.isNull() && domain.kind == JSONValueKind.OBJECT) {
        let domainOBJ = domain.toObject();

        let discovery = domainOBJ.get("discovery");

        if (
          discovery &&
          !discovery.isNull() &&
          discovery.kind == JSONValueKind.OBJECT
        ) {
          let discovery_e = _discovery(ipfs_url);

          let discoveryOBJ = discovery.toObject();

          let tags = discoveryOBJ.get("tags");

          if (tags && !tags.isNull() && tags.kind == JSONValueKind.ARRAY) {
            let tagsArr = tags.toArray();

            let tagsArrLocal: string[] = [];

            for (let i = 0; i < tagsArr.length; i++) {
              if (
                tagsArr[i] &&
                !tagsArr[i].isNull() &&
                tagsArr[i].kind == JSONValueKind.STRING
              ) {
                tagsArrLocal.push(tagsArr[i].toString());
              }
            }

            discovery_e.tags = tagsArrLocal;
          }

          let workflow_descriptors = discoveryOBJ.get("workflow_descriptors");

          if (
            workflow_descriptors &&
            !workflow_descriptors.isNull() &&
            workflow_descriptors.kind == JSONValueKind.ARRAY
          ) {
            let workflow_descriptorsArr = workflow_descriptors.toArray();
            let workflow_descriptorsArrLocal: string[] = [];

            for (let i = 0; i < workflow_descriptorsArr.length; i++) {
              let id = ipfs_url.concat("-").concat(i.toString());

              let keyvalue = _keyvalue(id);

              keyvalue.adp = ipfs_url;
              keyvalue.discovery = ipfs_url;

              if (
                workflow_descriptorsArr[i] &&
                !workflow_descriptorsArr[i].isNull() &&
                workflow_descriptorsArr[i].kind == JSONValueKind.OBJECT
              ) {
                let workflow_descriptorsArrOBJ =
                  workflow_descriptorsArr[i].toObject();

                let key = workflow_descriptorsArrOBJ.get("key");
                let value = workflow_descriptorsArrOBJ.get("value");

                if (key && !key.isNull() && key.kind == JSONValueKind.STRING) {
                  keyvalue.key = key.toString();
                }

                if (
                  value &&
                  !value.isNull() &&
                  value.kind == JSONValueKind.STRING
                ) {
                  keyvalue.value = value.toString();
                }
              }
              keyvalue.save();
              workflow_descriptorsArrLocal.push(keyvalue.id);
            }
            discovery_e.workflow_descriptors = workflow_descriptorsArrLocal;
          }

          let discovery_service = discoveryOBJ.get("discovery_service");

          if (
            discovery_service &&
            !discovery_service.isNull() &&
            discovery_service.kind == JSONValueKind.STRING
          ) {
            discovery_e.discovery_service = discovery_service.toString();
          }

          discovery_e.save();
        }
      }
    }
  }
}
