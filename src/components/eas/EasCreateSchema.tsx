import React, { useState } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Text,
    Button,
    Input,
    Select,
    Checkbox,
    HStack,
    VStack,
    Box,
    FormControl,
    FormLabel,
    IconButton,
    useDisclosure,
    FormHelperText,
    Switch,
} from "@chakra-ui/react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';
import { networkConfig } from "../../config/networks";
import { EasCreateSchemaProps } from "../../types/Eas.types";
import { generateSchema } from "../../utils";

const dataTypes = [
    "address",
    "string",
    "bool",
    "bytes32",
    "bytes",
    "uint8",
    "uint16",
];

const EasCreateSchema: React.FC<EasCreateSchemaProps> = (props) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [fields, setFields] = useState([{ name: "", type: "", isArray: false }]);
    const [resolverAddress, setResolverAddress] = useState<string>("");
    const [isRevocable, setIsRevocable] = useState<boolean>(false);

    const [isCreatingSchema, setIsCreatingSchema] = useState<boolean>(false);

    const handleAddField = () => {
        setFields([...fields, { name: "", type: "", isArray: false }]);
    };

    const handleFieldChange = (index: number, field: string, value: any) => {
        const newFields = [...fields];
        newFields[index][field] = value;
        setFields(newFields);
    };

    const handleCheckboxChange = (index: number) => {
        const newFields = [...fields];
        newFields[index].isArray = !newFields[index].isArray;
        setFields(newFields);
    };

    const handleRemoveField = (index: number) => {
        const newFields = [...fields];
        newFields.splice(index, 1);
        setFields(newFields);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsCreatingSchema(true);
        const schemaData = fields;
        console.log("Form Data: ", schemaData);
        await createSchema();
        if (props.onSchemaCreated) {
            props.onSchemaCreated("schemaId");
        }
        onClose();
    };

    async function createSchema() {
        const schemaRegistryContractAddress = networkConfig[props.network].schemaRegistryContractAddress;
        const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);

        schemaRegistry.connect(props.signer);

        const schema = generateSchema(fields);

        const transaction = await schemaRegistry.register({
            schema,
            resolverAddress: resolverAddress ? resolverAddress : ethers.ZeroAddress,
            revocable: isRevocable,
        });

        // Optional: Wait for transaction to be validated
        const response = await transaction.wait();
        console.log("Transaction response", response);
        setIsCreatingSchema(false);
    }

    return (
        <Box>
            <Button onClick={onOpen} colorScheme="teal" leftIcon={<PlusIcon />}>
                Create EAS Schema
            </Button>
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create EAS Schema</ModalHeader>
                    <ModalBody>
                        <Text mb={4}>Fill out the form below to create a new EAS schema.</Text>

                        <form onSubmit={handleSubmit}>
                            {fields.map((field, index) => (
                                <VStack key={index} spacing={4} mb={4} align="stretch">
                                    <HStack>
                                        <FormControl>
                                            <FormLabel htmlFor={`name-${index}`}>Name</FormLabel>
                                            <Input
                                                id={`name-${index}`}
                                                value={field.name}
                                                onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                                                placeholder="Enter name"
                                            />
                                        </FormControl>

                                        <FormControl>
                                            <FormLabel htmlFor={`type-${index}`}>Type</FormLabel>
                                            <Select
                                                id={`type-${index}`}
                                                value={field.type}
                                                onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                                                placeholder="Select a type"
                                            >
                                                {dataTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <Checkbox
                                            id={`array-${index}`}
                                            isChecked={field.isArray}
                                            onChange={() => handleCheckboxChange(index)}
                                        >
                                            Array
                                        </Checkbox>

                                        <IconButton
                                            aria-label="Remove field"
                                            icon={<TrashIcon />}
                                            onClick={() => handleRemoveField(index)}
                                            colorScheme="red"
                                            size="sm"
                                        />
                                    </HStack>
                                </VStack>
                            ))}

                            <Box mt={4}>
                                <Button
                                    variant="outline"
                                    onClick={handleAddField}
                                    width="100%"
                                    leftIcon={<PlusIcon />}
                                >
                                    Add New Field
                                </Button>
                            </Box>

                            <FormControl mt={4}>
                                <FormLabel>Resolver Address</FormLabel>
                                <Input
                                    type="text"
                                    value={resolverAddress}
                                    onChange={(e) => setResolverAddress(e.target.value)}
                                    placeholder="0x0000000000000000000000000000000000000"
                                />
                                <FormHelperText>Optional smart contract that gets executed with every attestation of this type.
                                    (Can be used to verify, limit, act upon any attestation)
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel htmlFor='is-revocable' mt={4}>
                                    Is Revocable?
                                </FormLabel>
                                <Switch
                                    id='is-revocable'
                                    size="lg"
                                    isChecked={isRevocable}
                                    onChange={(e) => setIsRevocable(e.target.checked)}
                                />
                            </FormControl>

                            <ModalFooter mt={4}>
                                <Button
                                    type="submit"
                                    colorScheme="teal"
                                    mr={3} 
                                    isLoading={ isCreatingSchema }
                                    loadingText="Creating Schema..."
                                >
                                    Create Schema
                                </Button>
                                <Button onClick={onClose} variant="outline">
                                    Close
                                </Button>
                            </ModalFooter>
                        </form>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default EasCreateSchema;
