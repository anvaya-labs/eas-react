import { networkConfig } from "../config/networks"
import { EasAttest, EasProps, EasCreateSchema } from "../types/Eas.types"

export type Network = keyof typeof networkConfig

export {
    EasAttest,
    EasCreateSchema,
    EasProps
}
