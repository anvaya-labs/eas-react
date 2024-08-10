import { TransactionSigner } from "@ethereum-attestation-service/eas-sdk"
import { Network } from "."
import React from "react"

export interface EasProps {
  schemaId: string,
  network: Network
  signer: TransactionSigner
  onAttestationComplete?: ({ attestationUid: string, txReceipt: any }) => void
  onAttestationError?: (error: any) => void
}

export interface EasCreateSchemaProps {
  network: Network
  signer: TransactionSigner
  onSchemaCreated?: (schemaId: string) => void
  onSchemaCreationError?: (error: any) => void
}

export const EasAttest: React.FC<EasProps>;

// Interface for schema property
export interface SchemaProperty {
  type: string;
  value: any;
}

// Interface for parsed schema
export interface ParsedSchema {
  [key: string]: SchemaProperty;
}


type Field = {
  name: string;
  type: string;
  isArray: boolean;
};
