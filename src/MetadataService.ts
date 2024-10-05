import { BigInt } from "@graphprotocol/graph-ts";
import { MetadataUpdate } from "./types/MetadataService/MetadataService";
import { MetadataInfo, MetadataRecord } from "./types/schema";

function _metadataRecord(id: string): MetadataRecord {
  let record = MetadataRecord.load(id);
  if (!record) {
    record = new MetadataRecord(id);
    record.URL = "ipfs://";
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
    record.currentVersion = "v0";
    record.records = [];
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
    metadataInfo.currentVersion = "v".concat(
      BigInt.fromI32(idx + 1).toString()
    );
    metadataInfo.save();
  } else {
    let newMetadataRecord = _metadataRecord(event.transaction.hash.toHex());
    newMetadataRecord.URL = URL;
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
    metadataInfo.currentVersion = newMetadataRecord.version;
    metadataInfo.save();
  }
}
