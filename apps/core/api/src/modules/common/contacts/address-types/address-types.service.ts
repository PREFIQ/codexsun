import { CommonMasterService } from "../../foundation/common-master.service.js";
import { addressTypesDefinition } from "./address-types.definition.js";
export class AddressTypesService extends CommonMasterService { constructor() { super(addressTypesDefinition); } }
