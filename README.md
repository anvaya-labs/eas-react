# EAS REACT SDK

EAS React SDK exposes a set of React components that enable schema creation and attestation. These components abstract away the complexities of interacting with the EAS SDK, providing a smooth and efficient development experience.

## Installation

To install the EAS React SDK, run the following command:

```bash
npm install eas-react
```

## Usage

To use the EAS React SDK in your React application, import the components you need from the `eas-react` package and integrate them into your components.


### EasCreateSchema

```jsx
import { EasCreateSchema } from "eas-react"

function App() {
  return (
    <div>
      <EasCreateSchema network='sepolia'
          signer={signer!}
          onSchemaCreated={(schemaId) => {
            console.log('Schema created:', schemaId);
            // handle schema creation here
          }}
        />
    </div>
  )
}
```

### EasAttest

```jsx
import { EasAttest } from "eas-react";

function App() {
  return (
    <div>
      <EasAttest
          text="Attest this Schema"
          schemaId="<SCHEMA_ID>"
          network="sepolia"
          signer={signer!}
          onAttestationComplete={(attestation) => {
            console.log('Attestation complete', attestation);
            // handle attestation here
          }}
        />
    </div>
  )
}
```
