import React, { useEffect, useState } from "react";
import { EasProps, ParsedSchema } from "../../types/Eas.types";
import axios from "axios";
import { Network } from "../../types";
import { networkConfig } from "../../config/networks";
import { parseSchema } from "../../utils";
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from '@ethereum-attestation-service/eas-sdk';
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    useDisclosure,
    Text,
    Link,
    Spinner,
} from "@chakra-ui/react";

const EasAttest: React.FC<EasProps> = (props) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [schemaObject, setSchemaObject] = useState<any>({});
    const [rawSchema, setRawSchema] = useState<string>("");
    const [schema, setSchema] = useState<ParsedSchema | null>(null);
    const [recipient, setRecipient] = useState<string>("");
    const [isAttestationInProgress, setIsAttestationInProgress] = useState<boolean>(false);

    const { colorScheme = "green", ...restButtonProps } = props.buttonProps || {};

    // Initialize the sdk with the address of the EAS Schema contract address
    const eas = new EAS(networkConfig[props.network].easContractAddress);
    eas.connect(props.signer);

    const getSchemaFromUid = async (schemaId: string, network: Network) => {
        let data = JSON.stringify({
            query: `query GetSchema($where: SchemaWhereUniqueInput!) {
                getSchema(where: $where) {
                    id
                    index
                    schema
                    revocable
                }
            }`,
            variables: { "where": { "id": schemaId } }
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: networkConfig[network].graphqlUrl,
            headers: {
                'content-type': 'application/json'
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                console.log(response.data);
                setSchemaObject(response.data.data.getSchema);
                setRawSchema(response.data.data.getSchema.schema);
                const parsedSchema = parseSchema(response.data.data.getSchema.schema);
                setSchema(parsedSchema);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    // Function to prepare the data to be encoded
    const prepareDataToEncode = () => {
        if (!schema) return [];

        return Object.keys(schema).map((key) => ({
            name: key,
            value: schema[key].value,
            type: schema[key].type,
        }));
    };

    const handleAttestationComplete = ({
        newAttestationUID,
        attestation
    }: { newAttestationUID: string; attestation: any }
    ) => {
        setIsAttestationInProgress(false);
        if (props.onAttestationComplete) {
            props.onAttestationComplete({
                attestationUid: newAttestationUID,
                txReceipt: attestation
            });
        }
    }

    // Handle attestation logic
    const attest = async () => {
        console.log("Attest clicked!");
        console.log("Recipient:", recipient);
        console.log("Schema:", schema);
        // Include the logic to perform the attestation here
        try {
            setIsAttestationInProgress(true);
            // Prepare the data for encoding
            const dataToEncode = prepareDataToEncode();

            // Initialize SchemaEncoder with the schema string
            const schemaEncoder = new SchemaEncoder(rawSchema);

            // Encode the data
            const encodedData = schemaEncoder.encodeData(dataToEncode);

            console.log("Encoded Data:", encodedData);

            const transaction = await eas.attest({
                schema: schemaObject.id,
                data: {
                    recipient: recipient,
                    expirationTime: BigInt(0),
                    revocable: schemaObject.revocable, // Be aware that if your schema is not revocable, this MUST be false
                    data: encodedData
                }
            });

            const newAttestationUID = await transaction.wait();

            console.log('New attestation UID:', newAttestationUID);

            console.log('Transaction receipt:', transaction.receipt);

            onClose();

            // Handle attestation complete  
            handleAttestationComplete({
                newAttestationUID,
                attestation: transaction.receipt
            });
        } catch (error) {
            console.error('Error attesting:', error);
            if (props.onAttestationError) {
                props.onAttestationError(error);
            }
            setIsAttestationInProgress(false);
            onClose();
        }
    };

    // Handle input changes and update the state
    const handleInputChange = (name: string, value: any) => {
        if (schema) {
            setSchema({
                ...schema,
                [name]: { ...schema[name], value }
            });
        }
    };

    // Fetch and parse the schema when component mounts
    useEffect(() => {
        getSchemaFromUid(props.schemaId, props.network);
    }, [props.schemaId, props.network]);

    return (
        <div className="eas-attest-container">
            <Button colorScheme={colorScheme} onClick={onOpen}
                {...restButtonProps}
            >
                {props.text || "Attest"}
            </Button>
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>New Attestation</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text fontSize="lg" color="gray.500" mb={4} fontWeight={800}>
                            # {schemaObject.index} &nbsp;|&nbsp;
                            <Link href={`https://sepolia.easscan.org/schema/view/${schemaObject.id}`} isExternal color="teal.500">
                                Schema ID:  {schemaObject.id && `${schemaObject.id.slice(0, 6)}...${schemaObject.id.slice(-4)}`}
                            </Link>
                        </Text>
                        <FormControl mb={4}>
                            <FormLabel>Recipient Address:</FormLabel>
                            <Input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                placeholder="Enter recipient address"
                            />
                        </FormControl>

                        {schema && Object.keys(schema).map((key) => (
                            <FormControl key={key} id={key} mb={4}>
                                <FormLabel>{key} <Text as="span" fontSize="sm" color="gray.500">({schema[key].type})</Text>:</FormLabel>
                                <Input
                                    type="text"
                                    value={schema[key].value}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                />
                            </FormControl>
                        ))}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue"
                            mr={3}
                            onClick={attest}
                            isLoading={isAttestationInProgress}
                            loadingText="Attesting..."
                        >
                            Attest
                        </Button>
                        <Button variant="ghost" onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default EasAttest;
