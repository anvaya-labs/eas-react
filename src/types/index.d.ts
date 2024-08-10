import { networkConfig } from "../config/networks"
import { EasAttest, EasProps } from "../types/Eas.types"

export type Network = keyof typeof networkConfig

export {
    EasAttest,
    EasProps
}
